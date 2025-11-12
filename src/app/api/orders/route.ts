/**
 * Orders List API
 * GET /api/orders - Fetch user's orders with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { OrderSummary } from '@/lib/types/cart';

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
 * GET /api/orders
 * Fetch user's orders with pagination and filtering
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '10');
    const status = searchParams.get('status'); // Optional filter by status

    // Calculate pagination
    const start = (page - 1) * per_page;
    const end = start + per_page - 1;

    // Build query
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        fulfillment_status,
        total_amount,
        currency,
        created_at,
        order_items (
          id
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(start, end);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error: ordersError, count } = await query;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Format orders with item count
    const formattedOrders: OrderSummary[] = (orders || []).map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      total_amount: order.total_amount,
      currency: order.currency,
      item_count: order.order_items?.length || 0,
      created_at: order.created_at
    }));

    // Calculate total pages
    const total_pages = count ? Math.ceil(count / per_page) : 0;

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        page,
        per_page,
        total: count || 0,
        total_pages
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET orders API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

