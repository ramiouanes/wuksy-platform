/**
 * CartDrawer Component
 * Sliding drawer from right side showing cart contents
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import CartItemCard from './CartItemCard';
import CartSummary from './CartSummary';
import Button from '@/components/ui/Button';
import { X, ShoppingBag } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart } = useCart();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[440px] bg-white shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-800">Your Cart</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                aria-label="Close cart"
              >
                <X className="h-5 w-5 text-neutral-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isEmpty ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center h-full px-6 py-12">
                  <ShoppingBag className="h-16 w-16 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-sm text-neutral-600 text-center mb-6">
                    Add supplements from your analysis to get started
                  </p>
                  <Button variant="primary" onClick={onClose}>
                    Browse Supplements
                  </Button>
                </div>
              ) : (
                /* Cart Items */
                <div className="p-6 space-y-4">
                  {cart.items.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Summary and Actions */}
            {!isEmpty && cart.summary && (
              <div className="border-t border-neutral-200 p-6 space-y-4 bg-white">
                <CartSummary summary={cart.summary} showPartnerBreakdown={true} />

                <div className="space-y-3">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onClose}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

