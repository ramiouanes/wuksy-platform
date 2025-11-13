/**
 * Cart Item API Routes
 * 
 * PUT /api/cart/[itemId] - Update cart item quantity
 * DELETE /api/cart/[itemId] - Remove cart item
 */

import { NextRequest, NextResponse } from 'next/server';
import type { UpdateCartItemRequest } from '@/lib/types/cart';
import { getAuthenticatedUser, isAuthError, unauthorizedResponse } from '@/lib/auth/api-auth';

/**
 * PUT /api/cart/[itemId]
 * Update cart item quantity
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) {
      return unauthorizedResponse(authResult.error);
    }

    const { user, supabase } = authResult;
    const { itemId } = await params;

    // Parse request body
    const body: UpdateCartItemRequest = await request.json();
    const { quantity } = body;

    // Validate input
    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Verify the cart item belongs to the user's cart
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        shopping_carts!inner (
          user_id
        )
      `)
      .eq('id', itemId)
      .single() as { data: any | null; error: any };

    if (itemError || !cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Check user owns this cart
    if ((cartItem.shopping_carts as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update the quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select(`
        id,
        cart_id,
        partner_product_id,
        recommendation_id,
        quantity,
        unit_price,
        created_at
      `)
      .single() as { data: any | null; error: any };

    if (updateError || !updatedItem) {
      console.error('Error updating cart item:', updateError);
      return NextResponse.json(
        { error: 'Failed to update cart item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      item: updatedItem,
      message: 'Cart item updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error in PUT cart item API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/[itemId]
 * Remove cart item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) {
      return unauthorizedResponse(authResult.error);
    }

    const { user, supabase } = authResult;
    const { itemId } = await params;

    // Verify the cart item belongs to the user's cart
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .select(`
        id,
        cart_id,
        shopping_carts!inner (
          user_id
        )
      `)
      .eq('id', itemId)
      .single() as { data: any | null; error: any };

    if (itemError || !cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Check user owns this cart
    if ((cartItem.shopping_carts as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the cart item
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Error deleting cart item:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete cart item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cart item removed successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE cart item API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
