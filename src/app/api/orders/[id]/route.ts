/**
 * Order Detail API
 * GET /api/orders/[id] - Fetch specific order with full details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Order } from '@/lib/types/cart';

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
 * GET /api/orders/[id]
 * Fetch specific order with full details including items and shipping info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user, supabase } = auth;
    const { id: orderId } = await params;

    // Fetch order with all details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        status,
        payment_status,
        fulfillment_status,
        subtotal,
        tax_amount,
        shipping_amount,
        total_amount,
        currency,
        shipping_full_name,
        shipping_email,
        shipping_phone,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        payment_method,
        payment_transaction_id,
        created_at,
        updated_at,
        payment_completed_at,
        shipped_at,
        delivered_at,
        customer_notes,
        admin_notes,
        order_items (
          id,
          order_id,
          partner_product_id,
          recommendation_id,
          product_name,
          product_brand,
          product_size,
          partner_name,
          quantity,
          unit_price,
          subtotal,
          commission_rate,
          commission_amount,
          created_at
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Format the order response
    const formattedOrder: Order = {
      id: order.id,
      order_number: order.order_number,
      user_id: order.user_id,
      status: order.status,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      shipping_amount: order.shipping_amount,
      total_amount: order.total_amount,
      currency: order.currency,
      shipping_full_name: order.shipping_full_name,
      shipping_email: order.shipping_email,
      shipping_phone: order.shipping_phone,
      shipping_address_line1: order.shipping_address_line1,
      shipping_address_line2: order.shipping_address_line2,
      shipping_city: order.shipping_city,
      shipping_state: order.shipping_state,
      shipping_postal_code: order.shipping_postal_code,
      shipping_country: order.shipping_country,
      payment_method: order.payment_method,
      payment_transaction_id: order.payment_transaction_id,
      created_at: order.created_at,
      updated_at: order.updated_at,
      payment_completed_at: order.payment_completed_at,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at,
      customer_notes: order.customer_notes,
      admin_notes: order.admin_notes,
      items: order.order_items || []
    };

    return NextResponse.json({
      order: formattedOrder
    });

  } catch (error) {
    console.error('Unexpected error in GET orders/[id] API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

