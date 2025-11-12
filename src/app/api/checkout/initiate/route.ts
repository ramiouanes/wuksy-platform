/**
 * Checkout Initiate API
 * POST /api/checkout/initiate - Create order from cart
 * 
 * This endpoint:
 * - Validates cart is not empty
 * - Checks all products are still in stock
 * - Creates order with status 'pending_payment'
 * - Creates order_items from cart_items
 * - Calculates commissions
 * 
 * TODO: PAYMENT_INTEGRATION - Payment initiation will be added here (Line ~150)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { CheckoutRequest, CheckoutInitiateResponse } from '@/lib/types/cart';

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
 * POST /api/checkout/initiate
 * Initiate checkout process and create order
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
    const body: CheckoutRequest = await request.json();
    const { shipping_address, customer_notes } = body;

    // Validate shipping address
    if (!shipping_address || !shipping_address.full_name || !shipping_address.email || 
        !shipping_address.phone || !shipping_address.address_line1 || 
        !shipping_address.city || !shipping_address.state || 
        !shipping_address.postal_code || !shipping_address.country) {
      return NextResponse.json(
        { error: 'Invalid shipping address. All required fields must be provided.' },
        { status: 400 }
      );
    }

    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from('shopping_carts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (cartError || !cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Fetch cart items with product details
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        partner_product_id,
        recommendation_id,
        quantity,
        unit_price,
        partner_products!inner (
          id,
          product_name,
          brand_name,
          size,
          in_stock,
          unit_price,
          partner_id,
          partner_suppliers!inner (
            id,
            name,
            commission_rate
          )
        )
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('Error fetching cart items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch cart items' },
        { status: 500 }
      );
    }

    // Validate cart is not empty
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Check all products are still in stock
    const outOfStockItems = cartItems.filter((item: any) => !item.partner_products.in_stock);
    if (outOfStockItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some products are out of stock',
          out_of_stock_products: outOfStockItems.map((item: any) => item.partner_products.product_name)
        },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unit_price), 0
    );
    const tax_amount = 0; // TODO: Implement tax calculation
    const shipping_amount = 0; // TODO: Implement shipping calculation
    const total_amount = subtotal + tax_amount + shipping_amount;

    // Generate order number
    const { data: orderNumber, error: orderNumberError } = await supabase
      .rpc('generate_order_number');

    if (orderNumberError || !orderNumber) {
      console.error('Error generating order number:', orderNumberError);
      return NextResponse.json(
        { error: 'Failed to generate order number' },
        { status: 500 }
      );
    }

    // TODO: PAYMENT_INTEGRATION - Here is where you would:
    // 1. Initialize payment intent with your payment provider (Stripe, PayPal, etc.)
    // 2. Get payment_intent_id or transaction_id
    // 3. Store it in the order record
    // 4. Return payment client secret to frontend
    //
    // Example:
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(total_amount * 100), // Convert to cents
    //   currency: 'usd',
    //   metadata: { order_number: orderNumber }
    // });
    // const payment_transaction_id = paymentIntent.id;
    //
    // For now, we skip payment and create order with 'pending_payment' status

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        status: 'pending_payment',
        payment_status: 'pending',
        fulfillment_status: 'pending',
        subtotal,
        tax_amount,
        shipping_amount,
        total_amount,
        currency: 'USD',
        shipping_full_name: shipping_address.full_name,
        shipping_email: shipping_address.email,
        shipping_phone: shipping_address.phone,
        shipping_address_line1: shipping_address.address_line1,
        shipping_address_line2: shipping_address.address_line2 || null,
        shipping_city: shipping_address.city,
        shipping_state: shipping_address.state,
        shipping_postal_code: shipping_address.postal_code,
        shipping_country: shipping_address.country,
        customer_notes: customer_notes || null,
        // payment_transaction_id: payment_transaction_id, // TODO: PAYMENT_INTEGRATION - Add when payment is integrated
      })
      .select('id, order_number, total_amount, currency')
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = cartItems.map((item: any) => {
      const product = item.partner_products;
      const partner = product.partner_suppliers;
      const commission_rate = partner.commission_rate || 10;
      const item_subtotal = item.quantity * item.unit_price;
      const commission_amount = (item_subtotal * commission_rate) / 100;

      return {
        order_id: order.id,
        partner_product_id: item.partner_product_id,
        recommendation_id: item.recommendation_id || null,
        product_name: product.product_name,
        product_brand: product.brand_name,
        product_size: product.size,
        partner_name: partner.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item_subtotal,
        commission_rate,
        commission_amount
      };
    });

    const { error: itemsInsertError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsInsertError) {
      console.error('Error creating order items:', itemsInsertError);
      // Rollback: delete the order
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      );
    }

    // Return order details
    const response: CheckoutInitiateResponse = {
      order_id: order.id,
      order_number: order.order_number,
      total_amount: order.total_amount,
      currency: order.currency
      // TODO: PAYMENT_INTEGRATION - Add payment client_secret here
      // payment_client_secret: paymentIntent.client_secret,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Unexpected error in POST checkout/initiate API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

