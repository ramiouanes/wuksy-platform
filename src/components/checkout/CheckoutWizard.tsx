'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCart } from '@/contexts/CartContext';
import { ShippingAddress, Order } from '@/lib/types/cart';
import { initiateCheckout, confirmCheckout } from '@/lib/checkout-service';
import OrderReview from './OrderReview';
import ShippingForm from './ShippingForm';
import OrderConfirmation from './OrderConfirmation';
import Button from '@/components/ui/Button';
import { ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

type CheckoutStep = 'review' | 'shipping' | 'confirm' | 'success';

interface CheckoutState {
  currentStep: CheckoutStep;
  shippingAddress: ShippingAddress | null;
  orderId: string | null;
  orderNumber: string | null;
  totalAmount: number | null;
  email: string | null;
}

const STEPS: { id: CheckoutStep; label: string; number: number }[] = [
  { id: 'review', label: 'Review Order', number: 1 },
  { id: 'shipping', label: 'Shipping Info', number: 2 },
  { id: 'confirm', label: 'Confirm', number: 3 },
  { id: 'success', label: 'Complete', number: 4 },
];

export default function CheckoutWizard() {
  const { session } = useAuth();
  const { cart, refreshCart } = useCart();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isCreatingOrder = useRef(false);

  const [state, setState] = useState<CheckoutState>({
    currentStep: 'review',
    shippingAddress: null,
    orderId: null,
    orderNumber: null,
    totalAmount: null,
    email: null,
  });

  // Clear old checkout state on mount to always start fresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('checkoutState');
    }
    // Reset order creation flag on mount
    isCreatingOrder.current = false;
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('checkoutState', JSON.stringify(state));
    }
  }, [state]);

  // Clear sessionStorage when reaching success and refresh cart when leaving
  useEffect(() => {
    if (state.currentStep === 'success' && typeof window !== 'undefined') {
      sessionStorage.removeItem('checkoutState');
      
      // Refresh cart only when component unmounts (user navigates away)
      // This ensures OrderConfirmation is fully rendered before cart operations
      return () => {
        refreshCart();
      };
    }
  }, [state.currentStep, refreshCart]);

  // Redirect if cart is empty (unless we're on success or confirm steps)
  useEffect(() => {
    // Don't redirect if we're already on success or confirm step
    if (state.currentStep === 'success' || state.currentStep === 'confirm') {
      return;
    }
    
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      router.push('/dashboard');
    }
  }, [cart, state.currentStep, router]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === state.currentStep);

  const handleNextFromReview = () => {
    setState((prev) => ({ ...prev, currentStep: 'shipping' }));
  };

  const handleBackFromShipping = () => {
    setState((prev) => ({ ...prev, currentStep: 'review' }));
  };

  const handleBackFromConfirm = () => {
    // Reset order creation flag when going back
    isCreatingOrder.current = false;
    setState((prev) => ({ ...prev, currentStep: 'shipping' }));
  };

  const handleShippingSubmit = (shippingAddress: ShippingAddress) => {
    // Just save the address and move to confirmation step
    setState((prev) => ({
      ...prev,
      currentStep: 'confirm',
      shippingAddress,
      email: shippingAddress.email,
    }));
  };

  const handleConfirmOrder = async () => {
    // Prevent double-clicks and concurrent order creation
    if (isCreatingOrder.current) {
      return;
    }

    if (!session?.access_token || !cart || !state.shippingAddress) {
      toast.error('Please complete all steps');
      return;
    }

    isCreatingOrder.current = true;
    setIsLoading(true);
    
    try {
      // Initiate checkout - creates order
      const result = await initiateCheckout(
        session.access_token,
        state.shippingAddress
      );

      // Confirm checkout - marks order as complete (in demo, skips payment)
      const order = await confirmCheckout(
        session.access_token,
        result.order_id
      );

      // Update state with order details and move to success
      setState((prev) => ({
        ...prev,
        currentStep: 'success',
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
      }));

      toast.success('Order placed successfully!');
      // Don't reset isCreatingOrder.current on success - we've moved to success page
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete checkout');
      // Reset on error so user can retry
      isCreatingOrder.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  if (!cart && state.currentStep !== 'success' && state.currentStep !== 'confirm') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center">
          <p className="text-neutral-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Step Indicator */}
      {state.currentStep !== 'success' && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                      ${
                        index < currentStepIndex
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : index === currentStepIndex
                          ? 'bg-white border-primary-500 text-primary-500'
                          : 'bg-white border-neutral-300 text-neutral-400'
                      }
                    `}
                  >
                    {index < currentStepIndex ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="font-semibold">{step.number}</span>
                    )}
                  </div>
                  <span
                    className={`
                      text-sm mt-2 font-medium hidden sm:block
                      ${
                        index <= currentStepIndex
                          ? 'text-neutral-900'
                          : 'text-neutral-400'
                      }
                    `}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`
                      flex-1 h-0.5 mx-4 transition-colors
                      ${
                        index < currentStepIndex
                          ? 'bg-primary-500'
                          : 'bg-neutral-300'
                      }
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 md:p-8">
        {state.currentStep === 'review' && cart && (
          <>
            {currentStepIndex > 0 && (
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Cart
              </Button>
            )}
            <OrderReview
              cart={cart}
              onNext={handleNextFromReview}
              isLoading={isLoading}
            />
          </>
        )}

        {state.currentStep === 'shipping' && (
          <>
            <Button
              onClick={handleBackFromShipping}
              variant="ghost"
              size="sm"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Review
            </Button>
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Shipping Information</h2>
                <p className="text-neutral-600 mt-2">
                  Enter your shipping address to complete your order.
                </p>
              </div>
              <ShippingForm
                onSubmit={handleShippingSubmit}
                initialData={state.shippingAddress || undefined}
                isLoading={false}
              />
            </div>
          </>
        )}

        {state.currentStep === 'confirm' && cart && state.shippingAddress && (
          <>
            <Button
              onClick={handleBackFromConfirm}
              variant="ghost"
              size="sm"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shipping
            </Button>
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Confirm Your Order</h2>
                <p className="text-neutral-600 mt-2">
                  Please review your order details before confirming.
                </p>
              </div>

              {/* Order Items Summary */}
              <div className="border border-neutral-200 rounded-lg p-6">
                <h3 className="font-semibold text-neutral-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{item.product?.brand_name}</p>
                        <p className="text-sm text-neutral-600">{item.product?.product_name}</p>
                        <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-neutral-900">${item.subtotal?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>${cart.summary?.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address Summary */}
              <div className="border border-neutral-200 rounded-lg p-6">
                <h3 className="font-semibold text-neutral-900 mb-4">Shipping Address</h3>
                <div className="text-sm text-neutral-700 space-y-1">
                  <p className="font-medium">{state.shippingAddress.full_name}</p>
                  <p>{state.shippingAddress.email}</p>
                  <p>{state.shippingAddress.phone}</p>
                  <p className="pt-2">{state.shippingAddress.address_line1}</p>
                  {state.shippingAddress.address_line2 && <p>{state.shippingAddress.address_line2}</p>}
                  <p>
                    {state.shippingAddress.city}, {state.shippingAddress.state} {state.shippingAddress.postal_code}
                  </p>
                  <p>{state.shippingAddress.country}</p>
                </div>
              </div>

              {/* Confirm Button */}
              <Button
                onClick={handleConfirmOrder}
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Order...' : 'Confirm & Place Order'}
              </Button>
            </div>
          </>
        )}

        {state.currentStep === 'success' &&
          state.orderId &&
          state.orderNumber &&
          state.totalAmount !== null && (
            <OrderConfirmation
              orderId={state.orderId}
              orderNumber={state.orderNumber}
              totalAmount={state.totalAmount}
              email={state.email || undefined}
            />
          )}
      </div>
    </div>
  );
}

