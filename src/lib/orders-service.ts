/**
 * Orders Service
 * Handles order-related operations by communicating with backend API
 */

import { Order, OrderSummary } from '@/lib/types/cart';

interface FetchOrdersParams {
  page?: number;
  per_page?: number;
  status?: string;
}

interface FetchOrdersResponse {
  orders: OrderSummary[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Fetches user's orders with pagination and optional filtering
 */
export async function fetchOrders(
  authToken: string,
  params?: FetchOrdersParams
): Promise<FetchOrdersResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.per_page) {
    queryParams.append('per_page', params.per_page.toString());
  }
  if (params?.status) {
    queryParams.append('status', params.status);
  }

  const url = `/api/orders${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch orders');
  }

  const data = await response.json();
  return data;
}

/**
 * Fetches a specific order by ID with full details
 */
export async function fetchOrderById(
  authToken: string,
  orderId: string
): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch order');
  }

  const data = await response.json();
  return data.order;
}

