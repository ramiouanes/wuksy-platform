/**
 * Checkout Confirm API
 * POST /api/checkout/confirm - Confirm order and complete checkout
 * 
 * This endpoint:
 * - Verifies payment (TODO: PAYMENT_INTEGRATION)
 * - Updates order status to completed
 * - Clears user's cart
 * - Triggers partner notifications (TODO: PARTNER_NOTIFICATION)
 * - Sends confirmation email (TODO: EMAIL_NOTIFICATION)
 * 
 * TODO: PAYMENT_INTEGRATION - Payment verification goes here (Line ~60)
 * TODO: PARTNER_NOTIFICATION - Partner notification triggers here (Line ~120)
 * TODO: EMAIL_NOTIFICATION - User email confirmation goes here (Line ~130)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
 * POST /api/checkout/confirm
 * Confirm order and complete checkout process
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
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'order_id is required' },
        { status: 400 }
      );
    }

    // TODO: PAYMENT_INTEGRATION - Verify payment before confirming order
    // This is where you would verify the payment was successful
    // Example with Stripe:
    //
    // const { payment_intent_id } = body;
    // const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    // 
    // if (paymentIntent.status !== 'succeeded') {
    //   return NextResponse.json(
    //     { error: 'Payment not successful' },
    //     { status: 400 }
    //   );
    // }
    //
    // Verify the payment amount matches the order amount
    // Verify the payment is for the correct order
    //
    // For demo purposes, we skip payment verification

    // Fetch order to verify it belongs to the user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        status,
        payment_status,
        total_amount,
        shipping_email
      `)
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is in correct state
    if (order.payment_status === 'completed') {
      return NextResponse.json(
        { error: 'Order already confirmed' },
        { status: 400 }
      );
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        status: 'payment_completed',
        fulfillment_status: 'processing',
        payment_completed_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .select('*')
      .single();

    if (updateError || !updatedOrder) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // TODO: PARTNER_NOTIFICATION - Send notification to partner(s) about new order
    // This is where you would notify partners about the order
    // Example:
    //
    // // Get order items with partner info
    // const { data: orderItems } = await supabase
    //   .from('order_items')
    //   .select(`
    //     *,
    //     partner_products!inner (
    //       partner_id,
    //       partner_suppliers!inner (
    //         name,
    //         contact_email
    //       )
    //     )
    //   `)
    //   .eq('order_id', order_id);
    //
    // // Group items by partner and send notifications
    // const partnerGroups = groupByPartner(orderItems);
    // for (const partner of partnerGroups) {
    //   await sendPartnerNotification(partner, updatedOrder);
    // }

    // TODO: EMAIL_NOTIFICATION - Send order confirmation email to user
    // This is where you would send confirmation email to the user
    // Example:
    //
    // await sendOrderConfirmationEmail({
    //   to: order.shipping_email,
    //   orderNumber: order.order_number,
    //   orderDetails: updatedOrder,
    //   // ... other email details
    // });

    // Clear user's cart
    const { data: cart } = await supabase
      .from('shopping_carts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (cart) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);
    }

    // Fetch complete order details with items
    const { data: orderWithItems, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          partner_product_id,
          product_name,
          product_brand,
          product_size,
          partner_name,
          quantity,
          unit_price,
          subtotal,
          commission_rate,
          commission_amount
        )
      `)
      .eq('id', order_id)
      .single();

    if (fetchError || !orderWithItems) {
      console.error('Error fetching order details:', fetchError);
      // Still return success since order was updated
      return NextResponse.json({
        success: true,
        order: updatedOrder
      });
    }

    return NextResponse.json({
      success: true,
      order: orderWithItems,
      message: 'Order confirmed successfully'
    });

  } catch (error) {
    console.error('Unexpected error in POST checkout/confirm API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

