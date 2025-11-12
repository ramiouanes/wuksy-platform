'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchOrderById } from '@/lib/orders-service';
import { Order, OrderStatus, PaymentStatus, FulfillmentStatus } from '@/lib/types/cart';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  Mail,
  Phone,
  User,
  CreditCard,
  Truck,
  FileText,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Status badge styling
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

export default function OrderDetailPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  useEffect(() => {
    async function loadOrder() {
      if (!session?.access_token) {
        if (!authLoading) {
          router.push('/auth/login?redirect=/orders');
        }
        return;
      }

      if (!orderId) {
        setError('Order ID is missing');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const fetchedOrder = await fetchOrderById(session.access_token, orderId);
        setOrder(fetchedOrder);
      } catch (err) {
        console.error('Error loading order:', err);
        const message = err instanceof Error ? err.message : 'Failed to load order';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [session, authLoading, router, orderId]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="text-neutral-600 mt-4">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-6xl mx-auto py-12 px-4">
          <Card className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Order Not Found</h2>
            <p className="text-neutral-600 mb-6">{error || 'The order you are looking for does not exist.'}</p>
            <Button onClick={() => router.push('/orders')} variant="primary">
              Back to Orders
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_COLORS[order.status] || STATUS_COLORS.processing;
  const orderDate = new Date(order.created_at);

  // Group items by partner
  const itemsByPartner = (order.items || []).reduce((acc, item) => {
    const partnerName = item.partner_name || 'Unknown Partner';
    if (!acc[partnerName]) {
      acc[partnerName] = [];
    }
    acc[partnerName].push(item);
    return acc;
  }, {} as Record<string, typeof order.items>);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push('/orders')}
            variant="ghost"
            size="sm"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-neutral-900 font-mono">
                  {order.order_number}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-neutral-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Ordered on {format(orderDate, 'MMMM dd, yyyy')}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="md" disabled>
                <FileText className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
              <Button variant="outline" size="md" disabled>
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Status Notice */}
        {order.payment_status === 'pending' && (
          <Card className="mb-6 p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">Payment Pending</p>
                <p className="text-sm text-amber-700 mt-1">
                  This order is awaiting payment confirmation. Payment will be processed separately.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items by Partner */}
            {Object.entries(itemsByPartner).map(([partnerName, items]) => (
              <Card key={partnerName} className="p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-neutral-200">
                  <Package className="w-5 h-5 text-neutral-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">{partnerName}</h2>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                      <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-neutral-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900">
                          {item.product_brand || 'Unknown Brand'}
                        </h3>
                        <p className="text-sm text-neutral-600">{item.product_name}</p>
                        {item.product_size && (
                          <p className="text-xs text-neutral-500 mt-1">Size: {item.product_size}</p>
                        )}
                        <p className="text-sm text-neutral-700 mt-2">
                          Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900">${item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between">
                  <span className="text-sm font-medium text-neutral-700">Partner Subtotal</span>
                  <span className="font-semibold text-neutral-900">
                    ${items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                  </span>
                </div>
              </Card>
            ))}

            {/* Partner Fulfillment Notice */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Partner Fulfillment</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your supplements will be shipped directly from our partner suppliers.
                    You'll receive tracking information once each partner processes their items.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="p-6">
              <h2 className="font-semibold text-neutral-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-neutral-700">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Tax</span>
                    <span>${order.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                {order.shipping_amount > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Shipping</span>
                    <span>${order.shipping_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-neutral-900 pt-3 border-t border-neutral-200">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)} {order.currency}</span>
                </div>
              </div>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6">
              <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>
              <div className="space-y-2 text-sm text-neutral-700">
                {order.shipping_full_name && (
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-500" />
                    {order.shipping_full_name}
                  </p>
                )}
                {order.shipping_email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-neutral-500" />
                    {order.shipping_email}
                  </p>
                )}
                {order.shipping_phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-neutral-500" />
                    {order.shipping_phone}
                  </p>
                )}
                <div className="pt-2 border-t border-neutral-200 mt-3">
                  <p>{order.shipping_address_line1}</p>
                  {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                  <p>
                    {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                  </p>
                  <p>{order.shipping_country}</p>
                </div>
              </div>
            </Card>

            {/* Customer Notes */}
            {order.customer_notes && (
              <Card className="p-6">
                <h2 className="font-semibold text-neutral-900 mb-2">Order Notes</h2>
                <p className="text-sm text-neutral-700">{order.customer_notes}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

