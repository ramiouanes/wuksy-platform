'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCart } from '@/contexts/CartContext';
import CheckoutWizard from '@/components/checkout/CheckoutWizard';
import { ArrowLeft } from 'lucide-react';

export default function CheckoutPage() {
  const { session, loading: authLoading } = useAuth();
  const { cart, isLoading: cartLoading } = useCart();
  const router = useRouter();

  // Protected route - redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [session, authLoading, router]);

  // Show loading while checking auth or loading cart
  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-neutral-600 mt-4">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header with breadcrumb */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto py-4 px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Complete your order
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="py-8">
        <CheckoutWizard />
      </div>
    </div>
  );
}

