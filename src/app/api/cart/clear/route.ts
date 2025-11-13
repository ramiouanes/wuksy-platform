/**
 * Clear Cart API Route
 * DELETE /api/cart/clear - Remove all items from user's cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, isAuthError, unauthorizedResponse } from '@/lib/auth/api-auth';

/**
 * DELETE /api/cart/clear
 * Remove all items from user's cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (isAuthError(authResult)) {
      return unauthorizedResponse(authResult.error);
    }

    const { user, supabase } = authResult;

    // Get user's cart
    const { data: cart, error: cartError } = await supabase
      .from('shopping_carts')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null; error: any };

    // If no cart exists, nothing to clear
    if (cartError || !cart) {
      return NextResponse.json({
        success: true,
        message: 'No cart to clear'
      });
    }

    // Delete all items in the cart
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteError) {
      console.error('Error clearing cart:', deleteError);
      return NextResponse.json(
        { error: 'Failed to clear cart' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE cart/clear API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
