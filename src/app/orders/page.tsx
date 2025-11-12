'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchOrders } from '@/lib/orders-service';
import { OrderSummary, OrderStatus } from '@/lib/types/cart';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Package, ShoppingBag, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Status badge colors
const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  pending_payment: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending Payment' },
  payment_processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Processing Payment' },
  payment_completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Payment Completed' },
  payment_failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Payment Failed' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Processing' },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Shipped' },
  delivered: { bg: 'bg-green-100', text: 'text-green-700', label: 'Delivered' },
  cancelled: { bg: 'bg-neutral-100', text: 'text-neutral-700', label: 'Cancelled' },
  refunded: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Refunded' },
};

export default function OrdersPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders
  useEffect(() => {
    async function loadOrders() {
      if (!session?.access_token) {
        if (!authLoading) {
          router.push('/auth/login?redirect=/orders');
        }
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchOrders(session.access_token);
        setOrders(response.orders);
      } catch (err) {
        console.error('Error loading orders:', err);
        const message = err instanceof Error ? err.message : 'Failed to load orders';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [session, authLoading, router]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-neutral-600 mt-4">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return null;
  }

  // Empty state
  if (!isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto py-12 px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900">My Orders</h1>
            <p className="text-neutral-600 mt-2">View and track your supplement orders</p>
          </div>

          {/* Empty State */}
          <Card className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-neutral-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              No Orders Yet
            </h2>
            <p className="text-neutral-600 mb-6">
              You haven&apos;t placed any orders yet. Start shopping for your supplements!
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="primary">
              Browse Recommendations
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">My Orders</h1>
          <p className="text-neutral-600 mt-2">
            View and track your supplement orders
          </p>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = STATUS_COLORS[order.status] || STATUS_COLORS.processing;
            const orderDate = new Date(order.created_at);

            return (
              <Card key={order.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1 space-y-3">
                    {/* Order Number and Date */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-neutral-500" />
                        <span className="font-mono font-semibold text-neutral-900">
                          {order.order_number}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Date and Amount */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{format(orderDate, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4" />
                        <span>{order.item_count} {order.item_count === 1 ? 'item' : 'items'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-neutral-900">
                          ${order.total_amount.toFixed(2)} {order.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <div>
                    <Button
                      onClick={() => router.push(`/orders/${order.id}`)}
                      variant="outline"
                      size="md"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

