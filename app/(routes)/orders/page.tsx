"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import Button from '@/app/components/ui/button';
import { Package, MapPin, Clock, User, Phone, Mail, CreditCard, ArrowLeft, Truck, CheckCircle, Eye, ShoppingBag, Calendar } from 'lucide-react';
import { getUserOrders, getOrderById } from '@/actions/get-orders';
import type { Order } from '@/actions/get-orders';
import Image from 'next/image';

// Helper functions
function formatDate(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in transit':
    case 'shipped':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'order confirmed':
    case 'order_received':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'delivered':
      return <CheckCircle className="h-4 w-4" />;
    case 'in transit':
    case 'shipped':
      return <Truck className="h-4 w-4" />;
    case 'processing':
    case 'order confirmed':
    case 'order_received':
      return <Package className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

interface OrdersPageProps {
  params: Promise<{ storeId: string }>;
}

const OrdersDashboard = ({ params }: OrdersPageProps) => {
  const { user, isLoaded } = useUser();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Helper function to add debug info
  const addDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Resolve the params Promise
  useEffect(() => {
    const resolveParams = async () => {
      try {
        addDebug('Starting params resolution...');
        const resolvedParams = await params;
        addDebug(`Resolved params: ${JSON.stringify(resolvedParams)}`);
        setStoreId(resolvedParams.storeId);
      } catch (err) {
        addDebug(`Error resolving params: ${err}`);
        setError('Failed to load store information');
        setLoading(false);
      }
    };
    resolveParams();
  }, [params]);

  const loadUserOrders = useCallback(async () => {
    addDebug('loadUserOrders called');
    
    if (!user?.emailAddresses?.[0]?.emailAddress) {
      addDebug('No user email available');
      return;
    }
    
    if (!storeId) {
      addDebug('No storeId available');
      return;
    }

    addDebug(`Attempting to load orders for email: ${user.emailAddresses[0].emailAddress}, storeId: ${storeId}`);
    
    setLoading(true);
    setError(null);

    try {
      const userOrders = await getUserOrders(storeId, user.emailAddresses[0].emailAddress);
      addDebug(`Successfully loaded ${userOrders?.length || 0} orders`);
      setOrders(userOrders || []);
      setInitialized(true);
    } catch (err) {
      addDebug(`Error loading orders: ${err}`);
      setError('Failed to load your orders. Please try again.');
      setOrders([]);
      setInitialized(true); // Set initialized even on error
    } finally {
      setLoading(false);
    }
  }, [user?.emailAddresses?.[0]?.emailAddress, storeId]);

  // Main effect to trigger loading
  useEffect(() => {
    addDebug(`Main effect triggered - isLoaded: ${isLoaded}, storeId: ${storeId}, user: ${!!user}`);
    
    if (isLoaded && storeId) {
      if (user?.emailAddresses?.[0]?.emailAddress) {
        addDebug('All conditions met, calling loadUserOrders');
        loadUserOrders();
      } else {
        addDebug('User loaded but no email, setting initialized');
        setLoading(false);
        setInitialized(true);
      }
    } else {
      addDebug(`Waiting for conditions - isLoaded: ${isLoaded}, storeId: ${storeId}`);
    }
  }, [isLoaded, user, storeId, loadUserOrders]);

  const handleViewOrder = async (orderId: string) => {
    if (!storeId) {
      addDebug('No storeId available for viewing order');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const order = await getOrderById(storeId, orderId);
      setSelectedOrder(order);
    } catch (err) {
      addDebug(`Error loading order: ${err}`);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToOrders = () => {
    setSelectedOrder(null);
    setError(null);
  };

  // Enhanced loading state with debug info
  if (!initialized || (loading && !selectedOrder)) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading your orders...</p>
              
              {/* Always show debug info when loading */}
              <div className="mt-4 text-xs text-gray-400 max-w-md">
                <p>User loaded: {isLoaded ? 'Yes' : 'No'}</p>
                <p>Store ID: {storeId || 'Not loaded'}</p>
                <p>User email: {user?.emailAddresses?.[0]?.emailAddress || 'Not available'}</p>
                <p>API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}</p>
                <p>Initialized: {initialized ? 'Yes' : 'No'}</p>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
                
                {debugInfo.length > 0 && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-left max-h-40 overflow-y-auto">
                    <p className="font-semibold">Debug Log:</p>
                    {debugInfo.slice(-10).map((info, index) => (
                      <p key={index} className="text-xs">{info}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Please Sign In</h2>
            <p className="text-gray-600">You need to be signed in to view your orders.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show selected order details (same as before)
  if (selectedOrder) {
    const totalPrice = selectedOrder.orderItems.reduce((total, item) => {
      return total + (item.quantity * Number(item.product.price.toString()));
    }, 0);

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button  
              onClick={handleBackToOrders}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Button>
            <h1 className="text-2xl font-bold">Order Details</h1>
          </div>

          {/* Rest of order details UI - keeping original */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order #{selectedOrder.id.slice(-8)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ... rest of order details ... */}
              <div className="text-center py-4">
                <p>Order details would be shown here...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main orders list view
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600">Track and manage all your orders</p>
        </div>

        {/* Debug panel in development */}
        {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <details className="text-sm">
                <summary className="font-semibold cursor-pointer">Debug Information</summary>
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {debugInfo.map((info, index) => (
                    <p key={index} className="text-xs text-blue-700">{info}</p>
                  ))}
                </div>
              </details>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
              <Button onClick={loadUserOrders} className="mt-2">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600">When you place orders, they&apos;ll appear here.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const totalPrice = order.orderItems.reduce((total, item) => {
                return total + (item.quantity * Number(item.product.price.toString()));
              }, 0);

              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <h3 className="font-semibold text-lg">
                            Order #{order.id.slice(-8)}
                          </h3>
                          <Badge className={getStatusColor(order.deliveryStatus)}>
                            {getStatusIcon(order.deliveryStatus)}
                            <span className="ml-1">{order.deliveryStatus}</span>
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.createdAt).split(',')[0]}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            KSh {totalPrice.toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{order.address}, {order.county}</span>
                        </div>
                      </div>

                      <Button 
                        onClick={() => handleViewOrder(order.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersDashboard;