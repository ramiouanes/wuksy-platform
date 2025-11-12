/**
 * TypeScript types for Cart and Orders system
 * Compatible with both web and mobile apps
 */

// ============================================================================
// Partner Products Types
// ============================================================================

export interface PartnerSupplier {
  id: string;
  name: string;
  business_type: 'pharmacy' | 'health_store' | 'online_retailer' | 'manufacturer';
  is_active: boolean;
  commission_rate?: number;
  contact_email?: string;
  contact_phone?: string;
}

export interface PartnerProduct {
  id: string;
  partner_id: string;
  product_name: string;
  brand_name: string;
  supplement_category: string;
  dosage_form: string; // capsule, tablet, liquid, powder
  strength?: string; // e.g., "1000mg", "500IU"
  size?: string; // e.g., "60 capsules", "100ml"
  unit_price: number;
  currency: string;
  in_stock: boolean;
  lead_time_days?: number;
  product_url?: string;
  image_urls?: string[];
  description?: string;
  ingredients?: string[];
  created_at: string;
  updated_at: string;
  
  // Joined partner info (when fetched with partner details)
  partner?: PartnerSupplier;
}

// ============================================================================
// Cart Types
// ============================================================================

export interface CartItem {
  id: string;
  cart_id: string;
  partner_product_id: string;
  recommendation_id?: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  
  // Extended fields (joined from partner_products)
  product?: PartnerProduct;
  subtotal?: number; // calculated: quantity * unit_price
}

export interface CartItemWithDetails extends CartItem {
  product: PartnerProduct;
  subtotal: number;
}

export interface CartSummary {
  items: CartItemWithDetails[];
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total: number;
  item_count: number;
  partner_groups?: PartnerGroupSummary[]; // items grouped by partner
}

export interface PartnerGroupSummary {
  partner_id: string;
  partner_name: string;
  items: CartItemWithDetails[];
  subtotal: number;
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  items: CartItemWithDetails[];
  summary?: CartSummary;
}

// ============================================================================
// Checkout & Shipping Types
// ============================================================================

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface CheckoutRequest {
  shipping_address: ShippingAddress;
  customer_notes?: string;
}

export interface CheckoutInitiateResponse {
  order_id: string;
  order_number: string;
  total_amount: number;
  currency: string;
}

// ============================================================================
// Order Types
// ============================================================================

export type OrderStatus = 
  | 'pending_payment'
  | 'payment_processing'
  | 'payment_completed'
  | 'payment_failed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export type FulfillmentStatus = 
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  partner_product_id: string;
  recommendation_id?: string;
  product_name: string;
  product_brand?: string;
  product_size?: string;
  partner_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  commission_rate?: number;
  commission_amount?: number;
  created_at: string;
  
  // Extended fields (when fetched with product details)
  product?: PartnerProduct;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  
  // Amounts
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency: string;
  
  // Shipping information
  shipping_full_name?: string;
  shipping_email?: string;
  shipping_phone?: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  
  // Payment information
  payment_method?: string;
  payment_transaction_id?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  payment_completed_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  
  // Notes
  customer_notes?: string;
  admin_notes?: string;
  
  // Items (when fetched with details)
  items?: OrderItem[];
}

export interface OrderSummary {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  total_amount: number;
  currency: string;
  item_count: number;
  created_at: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface AddToCartRequest {
  partner_product_id: string;
  recommendation_id?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

