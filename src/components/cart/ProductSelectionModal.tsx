/**
 * ProductSelectionModal Component
 * Modal for selecting from available partner products
 * Shows horizontal scrolling cards of products with add to cart functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useCart } from '@/contexts/CartContext';
import ResponsiveModal from '@/components/ui/ResponsiveModal';
import Button from '@/components/ui/Button';
import { fetchProductsForRecommendation } from '@/lib/cart-service';
import { PartnerProduct } from '@/lib/types/cart';
import { Package, Store, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendationId: string;
  supplementName: string;
  onSuccess?: () => void;
}

export default function ProductSelectionModal({
  isOpen,
  onClose,
  recommendationId,
  supplementName,
  onSuccess
}: ProductSelectionModalProps) {
  const { session } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  // Fetch products when modal opens
  useEffect(() => {
    if (isOpen && recommendationId && session?.access_token) {
      fetchProducts();
    }
  }, [isOpen, recommendationId, session?.access_token]);

  const fetchProducts = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);
    try {
      const fetchedProducts = await fetchProductsForRecommendation(
        session.access_token,
        recommendationId
      );
      setProducts(fetchedProducts);
      
      if (fetchedProducts.length === 0) {
        setError('No products available for this supplement yet. Check back soon!');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    setAddingProductId(productId);
    try {
      await addToCart(productId, recommendationId, 1);
      onSuccess?.();
      
      // Close modal after short delay to show success
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      console.error('Error adding to cart:', err);
      // Error toast is already shown by addToCart
    } finally {
      setAddingProductId(null);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Choose Your ${supplementName}`}
    >
      <div className="min-h-[300px]">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-4" />
            <p className="text-neutral-600">Loading available products...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-neutral-700 text-center mb-4">{error}</p>
            <Button variant="outline" onClick={fetchProducts}>
              Try Again
            </Button>
          </div>
        )}

        {/* Products Horizontal Scroll */}
        {!loading && !error && products.length > 0 && (
          <div className="overflow-x-auto -mx-4 px-4 md:-mx-6 md:px-6">
            <div className="flex gap-4 pb-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-[280px] bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  {/* Product Image or Placeholder */}
                  <div className="w-full h-32 bg-neutral-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img 
                        src={product.image_urls[0]} 
                        alt={product.product_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-neutral-400" />
                    )}
                  </div>

                  {/* Brand Name */}
                  <h3 className="font-semibold text-neutral-800 text-lg mb-1">
                    {product.brand_name}
                  </h3>

                  {/* Product Name */}
                  <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                    {product.product_name}
                  </p>

                  {/* Size and Strength */}
                  <div className="space-y-1 mb-3">
                    {product.strength && (
                      <p className="text-xs text-neutral-500">
                        <span className="font-medium">Strength:</span> {product.strength}
                      </p>
                    )}
                    {product.size && (
                      <p className="text-xs text-neutral-500">
                        <span className="font-medium">Size:</span> {product.size}
                      </p>
                    )}
                    {product.dosage_form && (
                      <p className="text-xs text-neutral-500">
                        <span className="font-medium">Form:</span> {product.dosage_form}
                      </p>
                    )}
                  </div>

                  {/* Partner Badge */}
                  {product.partner && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Store className="h-3 w-3 text-neutral-400" />
                      <span className="text-xs text-neutral-500">
                        {product.partner.name}
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-primary-600">
                      {product.currency === 'TND' ? 'TND' : '$'}{product.unit_price.toFixed(2)}
                    </p>
                    {product.lead_time_days && (
                      <p className="text-xs text-neutral-500 mt-1">
                        Ships in {product.lead_time_days} days
                      </p>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleAddToCart(product.id)}
                    isLoading={addingProductId === product.id}
                    disabled={addingProductId !== null}
                  >
                    {addingProductId === product.id ? 'Adding...' : 'Add to Cart'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-neutral-300 mb-4" />
            <p className="text-neutral-600 text-center">
              No products available for this supplement yet.
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              Check back soon for available options!
            </p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}

