/**
 * CartItemCard Component
 * Displays individual cart item with quantity controls and remove button
 */

'use client';

import { useState } from 'react';
import { CartItemWithDetails } from '@/lib/types/cart';
import { Package, Store, Minus, Plus, Trash2, Loader2 } from 'lucide-react';

interface CartItemCardProps {
  item: CartItemWithDetails;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}

export default function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsRemoving(false);
    }
  };

  const product = item.product;
  if (!product) return null;

  return (
    <div className="flex gap-4 p-4 bg-white border border-neutral-200 rounded-lg hover:shadow-sm transition-shadow relative">
      {/* Loading Overlay */}
      {(isUpdating || isRemoving) && (
        <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center z-10">
          <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
        </div>
      )}

      {/* Product Image */}
      <div className="flex-shrink-0 w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
        {product.image_urls && product.image_urls.length > 0 ? (
          <img 
            src={product.image_urls[0]} 
            alt={product.product_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="h-8 w-8 text-neutral-400" />
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        {/* Brand and Name */}
        <h4 className="font-semibold text-neutral-800 truncate">
          {product.brand_name}
        </h4>
        <p className="text-sm text-neutral-600 truncate mb-1">
          {product.product_name}
        </p>

        {/* Size/Strength */}
        <div className="flex flex-wrap gap-2 text-xs text-neutral-500 mb-2">
          {product.strength && <span>{product.strength}</span>}
          {product.size && <span>• {product.size}</span>}
        </div>

        {/* Partner Badge */}
        {product.partner && (
          <div className="flex items-center gap-1 mb-2">
            <Store className="h-3 w-3 text-neutral-400" />
            <span className="text-xs text-neutral-500">{product.partner.name}</span>
          </div>
        )}

        {/* Price per unit */}
        <p className="text-sm font-medium text-neutral-700">
          {product.currency === 'TND' ? 'TND' : '$'}{item.unit_price.toFixed(2)} each
        </p>
      </div>

      {/* Quantity Controls and Remove */}
      <div className="flex flex-col items-end justify-between">
        {/* Remove Button */}
        <button
          onClick={handleRemove}
          disabled={isUpdating || isRemoving}
          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Quantity Controls */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 border border-neutral-200 rounded-lg p-1">
            <button
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
              className="p-1 hover:bg-neutral-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isUpdating}
              className="p-1 hover:bg-neutral-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Subtotal */}
          <p className="text-base font-bold text-primary-600">
            {product.currency === 'TND' ? 'TND' : '$'}{item.subtotal.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

