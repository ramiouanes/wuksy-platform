'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, CreditCard, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface OrderConfirmationProps {
  orderNumber: string;
  orderId: string;
  totalAmount: number;
  currency?: string;
  email?: string;
}

export default function OrderConfirmation({
  orderNumber,
  orderId,
  totalAmount,
  currency = 'USD',
  email,
}: OrderConfirmationProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(8);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center space-y-6">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
          className="flex justify-center"
        >
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.3,
              }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-16 h-16 text-green-600" />
            </motion.div>
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-neutral-900">Order Confirmed!</h1>
          <p className="text-lg text-neutral-600 mt-2">
            Thank you for your order
          </p>
        </motion.div>

        {/* Order Number */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-neutral-50 border border-neutral-200 rounded-lg p-6"
        >
          <p className="text-sm text-neutral-600 mb-2">Order Number</p>
          <p className="text-2xl font-bold text-neutral-900 font-mono">
            {orderNumber}
          </p>
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <div className="flex justify-between items-center">
              <span className="text-neutral-700">Total Amount</span>
              <span className="text-xl font-bold text-neutral-900">
                ${totalAmount.toFixed(2)} {currency}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Information Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          {/* Email Confirmation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-blue-900">
                Order Confirmation Email
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {email
                  ? `We've sent a confirmation email to ${email}`
                  : 'You will receive an order confirmation email shortly'}
              </p>
            </div>
          </div>

          {/* Payment Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-amber-900">
                Payment Processing
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Payment will be processed separately. Your order is currently pending payment confirmation.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-3 pt-6"
        >
          <Button
            onClick={() => router.push(`/orders/${orderId}`)}
            variant="primary"
            size="lg"
            className="w-full"
          >
            View Order Details
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Continue Shopping
          </Button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-neutral-500 pt-4 space-y-3"
        >
          <p>
            Your supplements will be shipped from our partner suppliers.
            You'll receive tracking information once your order is processed.
          </p>
          
          {/* Countdown Timer */}
          <div className="flex items-center justify-center gap-2 text-neutral-600 pt-2">
            <Clock className="w-4 h-4" />
            <p className="text-sm">
              Redirecting to your orders in <span className="font-semibold text-primary-600">{countdown}</span> seconds...
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

