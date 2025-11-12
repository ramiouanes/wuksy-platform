/**
 * CartSummary Component
 * Displays cart totals and summary information
 */

'use client';

import { CartSummary as CartSummaryType } from '@/lib/types/cart';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface CartSummaryProps {
  summary: CartSummaryType;
  showPartnerBreakdown?: boolean;
}

export default function CartSummary({ summary, showPartnerBreakdown = true }: CartSummaryProps) {
  const [showPartners, setShowPartners] = useState(false);
  const hasMultiplePartners = summary.partner_groups && summary.partner_groups.length > 1;

  const currency = summary.items[0]?.product?.currency || 'USD';
  const currencySymbol = currency === 'TND' ? 'TND' : '$';

  return (
    <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
      {/* Partner Breakdown (if multiple partners) */}
      {showPartnerBreakdown && hasMultiplePartners && (
        <div className="border-b border-neutral-200 pb-3">
          <button
            onClick={() => setShowPartners(!showPartners)}
            className="flex items-center justify-between w-full text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            <span>Items from {summary.partner_groups?.length} partners</span>
            {showPartners ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showPartners && summary.partner_groups && (
            <div className="mt-3 space-y-2">
              {summary.partner_groups.map((group) => (
                <div key={group.partner_id} className="flex justify-between text-xs">
                  <span className="text-neutral-600">{group.partner_name}</span>
                  <span className="font-medium text-neutral-700">
                    {currencySymbol}{group.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtotal */}
      <div className="flex justify-between text-sm">
        <span className="text-neutral-600">Subtotal ({summary.item_count} items)</span>
        <span className="font-medium text-neutral-800">
          {currencySymbol}{summary.subtotal.toFixed(2)}
        </span>
      </div>

      {/* Tax (if applicable) */}
      {summary.tax_amount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Tax</span>
          <span className="font-medium text-neutral-800">
            {currencySymbol}{summary.tax_amount.toFixed(2)}
          </span>
        </div>
      )}

      {/* Shipping (if applicable) */}
      {summary.shipping_amount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Shipping</span>
          <span className="font-medium text-neutral-800">
            {currencySymbol}{summary.shipping_amount.toFixed(2)}
          </span>
        </div>
      )}

      {/* Note about shipping */}
      {hasMultiplePartners && (
        <p className="text-xs text-neutral-500 italic">
          * Items will be shipped separately from different partners
        </p>
      )}

      {/* Total */}
      <div className="flex justify-between text-lg font-bold border-t border-neutral-200 pt-3">
        <span className="text-neutral-800">Total</span>
        <span className="text-primary-600">
          {currencySymbol}{summary.total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

