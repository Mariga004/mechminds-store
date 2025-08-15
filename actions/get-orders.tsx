// actions/get-orders.ts
export interface OrderItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: any;
    images: { url: string }[];
  };
}

export interface TrackingUpdate {
  id: string;
  status: string;
  location?: string;
  note?: string;
  timestamp: Date;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  county: string;
  customerEmail?: string;
  trackingId?: string;
  deliveryStatus: string;
  isPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
  orderItems: OrderItem[];
  trackingUpdates: TrackingUpdate[];
}

// Get all orders for a user by email
export const getUserOrders = async (
  storeId: string,
  email: string
): Promise<Order[]> => {
  try {
    // Check if API URL is configured
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('NEXT_PUBLIC_API_URL is not configured');
      throw new Error('API URL not configured');
    }

    // Include storeId in the API call if your backend expects it
    const url = `${process.env.NEXT_PUBLIC_API_URL}/orders/customer?email=${encodeURIComponent(email)}&storeId=${encodeURIComponent(storeId)}`;
    
    console.log('Fetching orders from:', url); // Debug log
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    console.log('Response status:', res.status); // Debug log
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error Response:', errorText);
      
      if (res.status === 404) {
        // No orders found - return empty array instead of throwing
        return [];
      }
      
      throw new Error(`Failed to fetch orders: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    console.log('Raw API response:', data); // Debug log
    
    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.warn('API response is not an array:', data);
      return [];
    }
    
    // Convert date strings back to Date objects
    const processedOrders = data.map((order: any) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
      trackingUpdates: (order.trackingUpdates || []).map((update: any) => ({
        ...update,
        timestamp: new Date(update.timestamp)
      }))
    }));
    
    console.log('Processed orders:', processedOrders); // Debug log
    return processedOrders;
    
  } catch (error) {
    console.error('getUserOrders error:', error);
    
    // Don't throw on network errors in production - return empty array
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error fetching orders');
      return [];
    }
    
    throw error;
  }
};

// Get specific order by ID
export const getOrderById = async (
  storeId: string,
  orderId: string
): Promise<Order> => {
  try {
    // Check if API URL is configured
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('NEXT_PUBLIC_API_URL is not configured');
      throw new Error('API URL not configured');
    }

    // Include storeId if your API needs it
    const url = `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}?storeId=${encodeURIComponent(storeId)}`;
    
    console.log('Fetching order from:', url); // Debug log
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    console.log('Response status:', res.status); // Debug log
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error Response:', errorText);
      
      if (res.status === 404) {
        throw new Error('Order not found');
      }
      throw new Error(`Failed to fetch order: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    console.log('Raw order response:', data); // Debug log
    
    // Convert date strings back to Date objects
    const processedOrder = {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      trackingUpdates: (data.trackingUpdates || []).map((update: any) => ({
        ...update,
        timestamp: new Date(update.timestamp)
      }))
    };
    
    console.log('Processed order:', processedOrder); // Debug log
    return processedOrder;
    
  } catch (error) {
    console.error('getOrderById error:', error);
    throw error;
  }
};

// Alternative version if your API doesn't use storeId
export const getUserOrdersWithoutStoreId = async (
  email: string
): Promise<Order[]> => {
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('NEXT_PUBLIC_API_URL is not configured');
      throw new Error('API URL not configured');
    }

    const url = `${process.env.NEXT_PUBLIC_API_URL}/orders/customer?email=${encodeURIComponent(email)}`;
    
    console.log('Fetching orders from:', url);
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!res.ok) {
      if (res.status === 404) {
        return [];
      }
      throw new Error(`Failed to fetch orders: ${res.status}`);
    }

    const data = await res.json();
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map((order: any) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
      trackingUpdates: (order.trackingUpdates || []).map((update: any) => ({
        ...update,
        timestamp: new Date(update.timestamp)
      }))
    }));
    
  } catch (error) {
    console.error('getUserOrdersWithoutStoreId error:', error);
    throw error;
  }
};