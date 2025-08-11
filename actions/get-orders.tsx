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
  const url = `${process.env.NEXT_PUBLIC_API_URL}/orders/customer?email=${encodeURIComponent(email)}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch orders');
  }

  const data = await res.json();
  
  // Convert date strings back to Date objects
  return data.map((order: any) => ({
    ...order,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    trackingUpdates: order.trackingUpdates.map((update: any) => ({
      ...update,
      timestamp: new Date(update.timestamp)
    }))
  }));
};

// Get specific order by ID
export const getOrderById = async (
  storeId: string,
  orderId: string
): Promise<Order> => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  });
  
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Order not found');
    }
    throw new Error('Failed to fetch order');
  }

  const data = await res.json();
  
  // Convert date strings back to Date objects
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    trackingUpdates: data.trackingUpdates.map((update: any) => ({
      ...update,
      timestamp: new Date(update.timestamp)
    }))
  };
};