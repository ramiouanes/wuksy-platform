/**
 * CartContext - Global cart state management
 * Provides cart state and operations throughout the app
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Cart } from '@/lib/types/cart';
import * as cartService from '@/lib/cart-service';
import toast from 'react-hot-toast';

interface CartContextValue {
  cart: Cart | null;
  cartItemCount: number;
  isLoading: boolean;
  addToCart: (productId: string, recommendationId: string | null, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate cart item count
  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Fetch cart on mount and when user session changes
  const refreshCart = useCallback(async () => {
    if (!session?.access_token) {
      setCart(null);
      return;
    }

    setIsLoading(true);
    try {
      const fetchedCart = await cartService.fetchCart(session.access_token);
      setCart(fetchedCart);
    } catch (error) {
      // Don't show error toast on initial load
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  // Initialize cart when user logs in
  useEffect(() => {
    if (session?.access_token) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [session?.access_token, refreshCart]);

  // Add item to cart
  const addToCart = useCallback(async (
    productId: string,
    recommendationId: string | null,
    quantity: number = 1
  ) => {
    if (!session?.access_token) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    setIsLoading(true);
    try {
      const updatedCart = await cartService.addItemToCart(
        session.access_token,
        productId,
        recommendationId,
        quantity
      );
      setCart(updatedCart);
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add to cart');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId: string) => {
    if (!session?.access_token) {
      toast.error('Please sign in');
      return;
    }

    setIsLoading(true);
    try {
      await cartService.removeCartItem(session.access_token, itemId);
      // Refresh cart after removing
      await refreshCart();
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove item');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, refreshCart]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!session?.access_token) {
      toast.error('Please sign in');
      return;
    }

    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setIsLoading(true);
    try {
      await cartService.updateCartItem(session.access_token, itemId, quantity);
      // Refresh cart after updating
      await refreshCart();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update quantity');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, refreshCart]);

  // Clear all items from cart
  const clearCart = useCallback(async () => {
    if (!session?.access_token) {
      toast.error('Please sign in');
      return;
    }

    setIsLoading(true);
    try {
      await cartService.clearCart(session.access_token);
      setCart(null);
      toast.success('Cart cleared');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clear cart');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  const value: CartContextValue = {
    cart,
    cartItemCount,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

