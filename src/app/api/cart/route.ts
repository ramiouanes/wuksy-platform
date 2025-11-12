/**
 * Cart API Routes
 * 
 * GET /api/cart - Fetch user's cart with all items
 * POST /api/cart - Add item to cart (creates cart if doesn't exist)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Cart, CartItemWithDetails, AddToCartRequest } from '@/lib/types/cart';

// Helper function to get authenticated user with properly configured Supabase client
async function getAuthenticatedUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Create Supabase client WITH the user's auth token (for RLS)
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return { user, supabase };
}

/**
 * GET /api/cart
 * Fetch user's active cart with all items and calculated totals
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user, supabase } = auth;

    console.log('Fetching cart for user:', user.id);

    // Fetch user's cart
    const { data: cart, error: cartError } = await supabase
      .from('shopping_carts')
      .select('id, user_id, created_at, updated_at, expires_at')
      .eq('user_id', user.id)
      .gte('expires_at', new Date().toISOString())
      .single();

    // If no cart exists, return empty cart
    if (cartError || !cart) {
      console.log('No cart found or error:', cartError?.message || 'No cart');
      return NextResponse.json({
        cart: null,
        items: [],
        summary: {
          subtotal: 0,
          tax_amount: 0,
          shipping_amount: 0,
          total: 0,
          item_count: 0
        }
      });
    }

    console.log('Found cart:', cart.id);

    // Fetch cart items with product and partner details
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        partner_product_id,
        recommendation_id,
        quantity,
        unit_price,
        created_at,
        partner_products!inner (
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
          partner_suppliers!inner (
            id,
            name,
            business_type
          )
        )
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch cart items', details: itemsError.message },
        { status: 500 }
      );
    }

    console.log(`Found ${cartItems?.length || 0} items in cart`);

    // Format cart items with calculated subtotals
    const items: CartItemWithDetails[] = (cartItems || []).map((item: any) => {
      const product = item.partner_products;
      return {
        id: item.id,
        cart_id: item.cart_id,
        partner_product_id: item.partner_product_id,
        recommendation_id: item.recommendation_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        created_at: item.created_at,
        subtotal: item.quantity * item.unit_price,
        product: {
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
          ingredients: [],
          created_at: '',
          updated_at: '',
          partner: {
            id: product.partner_suppliers.id,
            name: product.partner_suppliers.name,
            business_type: product.partner_suppliers.business_type,
            is_active: true
          }
        }
      };
    });

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax_amount = 0; // TODO: Implement tax calculation based on location
    const shipping_amount = 0; // TODO: Implement shipping calculation
    const total = subtotal + tax_amount + shipping_amount;

    // Group items by partner for summary
    const partnerGroups = items.reduce((groups: any[], item) => {
      const partnerId = item.product.partner_id;
      let group = groups.find(g => g.partner_id === partnerId);
      
      if (!group) {
        group = {
          partner_id: partnerId,
          partner_name: item.product.partner?.name || 'Unknown Partner',
          items: [],
          subtotal: 0
        };
        groups.push(group);
      }
      
      group.items.push(item);
      group.subtotal += item.subtotal;
      
      return groups;
    }, []);

    const cartResponse: Cart = {
      id: cart.id,
      user_id: cart.user_id,
      created_at: cart.created_at,
      updated_at: cart.updated_at,
      expires_at: cart.expires_at,
      items,
      summary: {
        items,
        subtotal,
        tax_amount,
        shipping_amount,
        total,
        item_count: items.length,
        partner_groups: partnerGroups
      }
    };

    // Return consistent format: { cart: Cart }
    return NextResponse.json({ cart: cartResponse });

  } catch (error) {
    console.error('Unexpected error in GET cart API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Add item to cart (creates cart if doesn't exist)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user, supabase } = auth;

    // Parse request body
    const body: AddToCartRequest = await request.json();
    const { partner_product_id, recommendation_id, quantity } = body;

    // Validate input
    if (!partner_product_id || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid request. partner_product_id and quantity (>0) are required.' },
        { status: 400 }
      );
    }

    // Fetch product details to get current price
    const { data: product, error: productError } = await supabase
      .from('partner_products')
      .select('id, unit_price, in_stock')
      .eq('id', partner_product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.in_stock) {
      return NextResponse.json(
        { error: 'Product is out of stock' },
        { status: 400 }
      );
    }

    // Get or create cart using the database function
    const { data: cartId, error: cartError } = await supabase
      .rpc('get_or_create_cart', { p_user_id: user.id });

    if (cartError || !cartId) {
      console.error('Error getting/creating cart:', cartError);
      return NextResponse.json(
        { error: 'Failed to create or retrieve cart', details: cartError?.message },
        { status: 500 }
      );
    }

    console.log('Cart ID for adding item:', cartId);

    // Check if item already exists in cart
    const { data: existingItem, error: existingError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('partner_product_id', partner_product_id)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing item:', existingError);
    }

    if (existingItem) {
      // Update existing item quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: existingItem.quantity + quantity,
          unit_price: product.unit_price // Update price to current
        })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        return NextResponse.json(
          { error: 'Failed to update cart item' },
          { status: 500 }
        );
      }
    } else {
      // Add new item to cart
      console.log('Adding new item to cart:', { cart_id: cartId, product_id: partner_product_id, quantity });
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          partner_product_id,
          recommendation_id: recommendation_id || null,
          quantity,
          unit_price: product.unit_price
        });

      if (insertError) {
        console.error('Error inserting cart item:', insertError);
        return NextResponse.json(
          { error: 'Failed to add item to cart', details: insertError.message },
          { status: 500 }
        );
      }
      console.log('Successfully added item to cart');
    }

    // Fetch and return updated cart
    console.log('Fetching updated cart...');
    const getResponse = await GET(request);
    return getResponse;

  } catch (error) {
    console.error('Unexpected error in POST cart API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

