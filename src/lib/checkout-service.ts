/**
 * Checkout Service
 * Handles checkout operations by communicating with backend API
 */

import { ShippingAddress, CheckoutRequest, CheckoutInitiateResponse, Order } from '@/lib/types/cart';

/**
 * Validates shipping address has all required fields
 */
export function validateAddress(address: ShippingAddress): boolean {
  const requiredFields: (keyof ShippingAddress)[] = [
    'full_name',
    'email',
    'phone',
    'address_line1',
    'city',
    'state',
    'postal_code',
    'country'
  ];

  for (const field of requiredFields) {
    if (!address[field] || address[field].toString().trim() === '') {
      return false;
    }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(address.email)) {
    return false;
  }

  return true;
}

/**
 * Initiates checkout process - creates order from cart
 * TODO: PAYMENT_INTEGRATION - This will return payment client secret in the future
 */
export async function initiateCheckout(
  authToken: string,
  shippingAddress: ShippingAddress,
  customerNotes?: string
): Promise<CheckoutInitiateResponse> {
  // Validate address before sending
  if (!validateAddress(shippingAddress)) {
    throw new Error('Invalid shipping address. Please check all required fields.');
  }

  const body: CheckoutRequest = {
    shipping_address: shippingAddress,
    customer_notes: customerNotes
  };

  const response = await fetch('/api/checkout/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to initiate checkout');
  }

  const data = await response.json();
  return data as CheckoutInitiateResponse;
}

/**
 * Confirms checkout and completes the order
 * TODO: PAYMENT_INTEGRATION - This will verify payment before confirming
 */
export async function confirmCheckout(
  authToken: string,
  orderId: string
): Promise<Order> {
  const response = await fetch('/api/checkout/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ order_id: orderId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to confirm checkout');
  }

  const data = await response.json();
  return data.order;
}

/**
 * Saves shipping address to user profile
 * Note: This would typically be implemented as a separate API endpoint
 * For now, this is a placeholder for future implementation
 */
export async function saveShippingAddress(
  authToken: string,
  userId: string,
  address: ShippingAddress
): Promise<void> {
  // TODO: Implement user profile update API endpoint
  // This would save the shipping address to the user's profile for future use
  console.log('Save shipping address not yet implemented');
}

