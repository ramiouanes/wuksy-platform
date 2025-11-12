/**
 * CartButton Component
 * Small icon button for adding supplements to cart
 * Opens product selection modal to choose from available partner products
 */

'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import ProductSelectionModal from './ProductSelectionModal';

interface CartButtonProps {
  recommendationId: string;
  supplementName: string;
  onSuccess?: () => void;
}

export default function CartButton({ 
  recommendationId, 
  supplementName,
  onSuccess
}: CartButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    onSuccess?.();
    // Modal will auto-close after successful add
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="p-2 rounded-full hover:bg-primary-50 active:bg-primary-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1"
        aria-label={`Add ${supplementName} to cart`}
        title="Add to cart"
      >
        <ShoppingCart className="h-4 w-4 text-primary-600" />
      </button>

      <ProductSelectionModal
        isOpen={isModalOpen}
        onClose={handleClose}
        recommendationId={recommendationId}
        supplementName={supplementName}
        onSuccess={handleSuccess}
      />
    </>
  );
}

