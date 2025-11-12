/**
 * Cart Service
 * Handles all cart operations by communicating with backend API
 */

import { Cart, CartItemWithDetails, AddToCartRequest, UpdateCartItemRequest, ApiResponse } from '@/lib/types/cart';

/**
 * Fetches the current user's cart with full details
 */
export async function fetchCart(authToken: string): Promise<Cart> {
  const response = await fetch('/api/cart', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch cart');
  }

  const data = await response.json();
  return data.cart;
}

/**
 * Adds an item to the cart or updates quantity if already exists
 */
export async function addItemToCart(
  authToken: string,
  productId: string,
  recommendationId: string | null,
  quantity: number = 1
): Promise<Cart> {
  const body: AddToCartRequest = {
    partner_product_id: productId,
    recommendation_id: recommendationId || undefined,
    quantity
  };

  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add item to cart');
  }

  const data = await response.json();
  return data.cart;
}

/**
 * Updates the quantity of an item in the cart
 */
export async function updateCartItem(
  authToken: string,
  itemId: string,
  quantity: number
): Promise<CartItemWithDetails> {
  const body: UpdateCartItemRequest = { quantity };

  const response = await fetch(`/api/cart/${itemId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update cart item');
  }

  const data = await response.json();
  return data.item;
}

/**
 * Removes an item from the cart
 */
export async function removeCartItem(
  authToken: string,
  itemId: string
): Promise<void> {
  const response = await fetch(`/api/cart/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove cart item');
  }
}

/**
 * Clears all items from the cart
 */
export async function clearCart(authToken: string): Promise<void> {
  const response = await fetch('/api/cart/clear', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to clear cart');
  }
}

/**
 * Fetches available products for a supplement recommendation
 */
export async function fetchProductsForRecommendation(
  authToken: string,
  recommendationId: string
): Promise<any[]> {
  const response = await fetch(`/api/supplements/${recommendationId}/products`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch products');
  }

  const data = await response.json();
  return data.products || [];
}

