'use client';

import { Cart } from '@/lib/types/cart';
import Button from '@/components/ui/Button';
import { Package, AlertCircle } from 'lucide-react';

interface OrderReviewProps {
  cart: Cart;
  onNext: () => void;
  isLoading?: boolean;
}

export default function OrderReview({ cart, onNext, isLoading }: OrderReviewProps) {
  const { items, summary } = cart;

  // Group items by partner
  const partnerGroups = summary?.partner_groups || [];
  const hasMultiplePartners = partnerGroups.length > 1;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Review Your Order</h2>
        <p className="text-neutral-600 mt-2">
          Please review your items before proceeding to shipping information.
        </p>
      </div>

      {/* Multi-partner notice */}
      {hasMultiplePartners && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Multiple Partners
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Your items will be shipped from different partners. Each partner will fulfill their items separately.
            </p>
          </div>
        </div>
      )}

      {/* Order Items grouped by partner */}
      <div className="space-y-6">
        {partnerGroups.map((group) => (
          <div key={group.partner_id} className="border border-neutral-200 rounded-lg overflow-hidden">
            {/* Partner Header */}
            <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-neutral-600" />
                <h3 className="font-semibold text-neutral-900">{group.partner_name}</h3>
              </div>
            </div>

            {/* Partner Items */}
            <div className="divide-y divide-neutral-200">
              {group.items.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.product?.image_urls?.[0] ? (
                      <img
                        src={item.product.image_urls[0]}
                        alt={item.product.product_name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-neutral-900 truncate">
                      {item.product?.brand_name}
                    </h4>
                    <p className="text-sm text-neutral-600 truncate">
                      {item.product?.product_name}
                    </p>
                    {item.product?.size && (
                      <p className="text-xs text-neutral-500 mt-1">
                        Size: {item.product.size}
                      </p>
                    )}
                    <p className="text-sm text-neutral-700 mt-2">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-neutral-600">
                      ${item.unit_price.toFixed(2)} each
                    </p>
                    <p className="font-semibold text-neutral-900 mt-1">
                      ${item.subtotal?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Partner Subtotal */}
            <div className="bg-neutral-50 px-4 py-3 border-t border-neutral-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-neutral-700">
                  {group.partner_name} Subtotal
                </span>
                <span className="font-semibold text-neutral-900">
                  ${group.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="border-t border-neutral-200 pt-6">
        <div className="space-y-3">
          <div className="flex justify-between text-neutral-700">
            <span>Subtotal</span>
            <span>${summary?.subtotal.toFixed(2)}</span>
          </div>
          {summary && summary.tax_amount > 0 && (
            <div className="flex justify-between text-neutral-700">
              <span>Tax</span>
              <span>${summary.tax_amount.toFixed(2)}</span>
            </div>
          )}
          {summary && summary.shipping_amount > 0 && (
            <div className="flex justify-between text-neutral-700">
              <span>Shipping</span>
              <span>${summary.shipping_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-neutral-900 pt-3 border-t border-neutral-200">
            <span>Total</span>
            <span>${summary?.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="pt-4">
        <Button
          onClick={onNext}
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Continue to Shipping
        </Button>
      </div>
    </div>
  );
}

