/**
 * Product Matching API
 * GET /api/supplements/[recommendationId]/products
 * 
 * Fetches available partner products matching a supplement recommendation
 * Returns products sorted by price (lowest first)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recommendationId: string }> }
) {
  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Missing required configuration' },
        { status: 500 }
      );
    }

    // Get user session for authentication
    const authorization = request.headers.get('authorization');
    const token = authorization?.replace('Bearer ', '');

    if (!token) {
      console.error('Missing authorization token');
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    // Create Supabase client with user's auth token (for RLS)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { recommendationId } = await params;
    console.log('Fetching products for recommendation:', recommendationId);

    // Fetch the supplement recommendation
    const { data: recommendation, error: recError } = await supabase
      .from('supplement_recommendations')
      .select('id, supplement_name, analysis_id')
      .eq('id', recommendationId)
      .single();

    if (recError) {
      console.error('Database error fetching recommendation:', recError);
      return NextResponse.json(
        { error: 'Database error', details: recError.message },
        { status: 500 }
      );
    }

    if (!recommendation) {
      console.error('Recommendation not found:', recommendationId);
      return NextResponse.json(
        { error: 'Supplement recommendation not found', recommendationId },
        { status: 404 }
      );
    }

    console.log('Found recommendation:', recommendation.supplement_name);

    // Extract supplement name and normalize it for matching
    const supplementName = recommendation.supplement_name.toLowerCase();
    
    // Build search keywords from supplement name
    // e.g., "Vitamin D3" -> ["vitamin d3", "vitamin d", "vitamin-d", "cholecalciferol"]
    const searchTerms = [
      supplementName,
      supplementName.replace(/[-_]/g, ' '),
      supplementName.replace(/\s+/g, '-'),
      supplementName.replace(/[0-9]/g, '').trim(), // Remove numbers
    ].filter(Boolean);

    // Fetch matching partner products with partner info
    // We'll use multiple strategies: exact match, category match, and keyword match
    const { data: products, error: productsError } = await supabase
      .from('partner_products')
      .select(`
        id,
        partner_id,
        product_name,
        brand_name,
        supplement_category,
        dosage_form,
        strength,
        size,
        unit_price,
        currency,
        in_stock,
        lead_time_days,
        product_url,
        image_urls,
        description,
        ingredients,
        created_at,
        updated_at,
        partner_suppliers!inner (
          id,
          name,
          business_type,
          is_active,
          commission_rate
        )
      `)
      .eq('in_stock', true)
      .eq('partner_suppliers.is_active', true);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products', details: productsError.message },
        { status: 500 }
      );
    }

    console.log(`Found ${products?.length || 0} products in database`);

    if (!products || products.length === 0) {
      console.log('No products found for supplement:', recommendation.supplement_name);
      return NextResponse.json({
        products: [],
        message: 'No products available for this supplement',
        recommendation: {
          id: recommendation.id,
          supplement_name: recommendation.supplement_name
        }
      });
    }

    // Filter and score products based on match quality
    const scoredProducts = products
      .map((product: any) => {
        let matchScore = 0;
        const productNameLower = product.product_name.toLowerCase();
        const categoryLower = product.supplement_category.toLowerCase();
        const searchKeywords = product.search_keywords || [];

        // Exact match on category (highest score)
        if (searchTerms.some(term => categoryLower.includes(term) || term.includes(categoryLower))) {
          matchScore += 100;
        }

        // Match in product name
        if (searchTerms.some(term => productNameLower.includes(term))) {
          matchScore += 50;
        }

        // Match in search keywords
        if (searchKeywords.some((keyword: string) => 
          searchTerms.some(term => keyword.toLowerCase().includes(term) || term.includes(keyword.toLowerCase()))
        )) {
          matchScore += 30;
        }

        // Partial word matches
        const supplementWords = supplementName.split(/\s+/);
        supplementWords.forEach((word: string) => {
          if (word.length > 2) { // Ignore very short words
            if (productNameLower.includes(word) || categoryLower.includes(word)) {
              matchScore += 10;
            }
          }
        });

        return {
          ...product,
          partner: product.partner_suppliers,
          partner_suppliers: undefined, // Remove nested object
          matchScore
        };
      })
      .filter((product: any) => product.matchScore > 0) // Only include products with some match
      .sort((a: any, b: any) => {
        // Sort by match score first, then by price
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return a.unit_price - b.unit_price;
      });

    // Format the response
    const formattedProducts = scoredProducts.map((product: any) => ({
      id: product.id,
      partner_id: product.partner_id,
      product_name: product.product_name,
      brand_name: product.brand_name,
      supplement_category: product.supplement_category,
      dosage_form: product.dosage_form,
      strength: product.strength,
      size: product.size,
      unit_price: product.unit_price,
      currency: product.currency,
      in_stock: product.in_stock,
      lead_time_days: product.lead_time_days,
      product_url: product.product_url,
      image_urls: product.image_urls,
      description: product.description,
      partner: {
        id: product.partner.id,
        name: product.partner.name,
        business_type: product.partner.business_type
      }
    }));

    console.log(`Returning ${formattedProducts.length} matched products for ${recommendation.supplement_name}`);

    return NextResponse.json({
      products: formattedProducts,
      recommendation: {
        id: recommendation.id,
        supplement_name: recommendation.supplement_name
      },
      total_count: formattedProducts.length
    });

  } catch (error) {
    console.error('Unexpected error in product matching API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

