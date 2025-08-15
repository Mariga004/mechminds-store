"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
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

const OrdersDashboard = () => {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  
  // Get storeId from URL params or use default
  const storeId = searchParams.get('storeId') || '3b479db5-4359-49a2-8ff6-7753906fc5c6';

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const loadUserOrders = useCallback(async () => {
    addDebug('loadUserOrders called');

    if (!user?.emailAddresses?.[0]?.emailAddress) {
      addDebug('No user email available');
      setLoading(false);
      setInitialized(true);
      return;
    }

    addDebug(`Loading orders for email: ${user.emailAddresses[0].emailAddress}, storeId: ${storeId}`);
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
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, [user?.emailAddresses?.[0]?.emailAddress, storeId]);

  useEffect(() => {
    addDebug(`Effect triggered - isLoaded: ${isLoaded}, user: ${!!user}, storeId: ${storeId}`);
    if (isLoaded) {
      if (user?.emailAddresses?.[0]?.emailAddress) {
        addDebug('User authenticated, loading orders...');
        loadUserOrders();
      } else {
        addDebug('User not authenticated');
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [isLoaded, user, loadUserOrders]);

  const handleViewOrder = async (orderId: string) => {
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

  // Loading screen
  if (!initialized || (loading && !selectedOrder)) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  // Sign-in required
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your orders.</p>
        </div>
      </div>
    );
  }

  // Order details view
  if (selectedOrder) {
    const totalPrice = selectedOrder.orderItems.reduce((total, item) => {
      return total + (item.quantity * Number(item.product.price.toString()));
    }, 0);

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Button onClick={handleBackToOrders} className="mb-6 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Button>
        
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order #{selectedOrder.id.slice(-8)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Customer:</span>
                    <span className="text-sm">{selectedOrder.customerName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Delivery Address:</span>
                  </div>
                  <p className="text-sm ml-6">{selectedOrder.address}, {selectedOrder.county}</p>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Phone:</span>
                    <span className="text-sm">{selectedOrder.phone}</span>
                  </div>

                  {selectedOrder.customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Email:</span>
                      <span className="text-sm">{selectedOrder.customerEmail}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-sm font-semibold">KSh {totalPrice.toLocaleString()}</span>
                  </div>
                  
                  {selectedOrder.trackingId && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Tracking ID:</span>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{selectedOrder.trackingId}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Order Date:</span>
                    <span className="text-sm">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <Badge className={getStatusColor(selectedOrder.deliveryStatus)}>
                  {getStatusIcon(selectedOrder.deliveryStatus)}
                  <span className="ml-1">{selectedOrder.deliveryStatus}</span>
                </Badge>
                <Badge variant={selectedOrder.isPaid ? "default" : "destructive"}>
                  {selectedOrder.isPaid ? "Paid" : "Pending"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedOrder.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white">
                    <Image
                      src={item.product.images[0]?.url || '/placeholder-image.jpg'}
                      alt={item.product.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity} × KSh {Number(item.product.price.toString()).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        KSh {(item.quantity * Number(item.product.price.toString())).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Delivery Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedOrder.trackingUpdates?.length > 0 ? (
                <div className="space-y-6">
                  {selectedOrder.trackingUpdates.map((update, index) => (
                    <div key={update.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          update.status.toLowerCase() === 'delivered' 
                            ? 'bg-green-500' 
                            : index === 0 
                              ? 'bg-blue-500' 
                              : 'bg-gray-300'
                        }`}>
                          {update.status.toLowerCase() === 'delivered' && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                        {index < selectedOrder.trackingUpdates.length - 1 && (
                          <div className="w-px h-16 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex flex-col gap-1 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{update.status}</span>
                            {update.location && (
                              <span className="text-sm text-gray-500">• {update.location}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {formatDate(update.timestamp)}
                          </p>
                        </div>
                        {update.note && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {update.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tracking updates available yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Orders list view
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Your Orders</h1>

        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent>
              <p className="text-red-700">{error}</p>
              <Button onClick={loadUserOrders} className="mt-2">Try Again</Button>
            </CardContent>
          </Card>
        )}

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">When you place orders, they'll appear here.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => {
            const totalPrice = order.orderItems.reduce((total, item) => {
              return total + (item.quantity * Number(item.product.price.toString()));
            }, 0);

            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow mb-4">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                    <p className="text-sm">KSh {totalPrice.toLocaleString()}</p>
                  </div>
                  <Button onClick={() => handleViewOrder(order.id)}>
                    <Eye className="h-4 w-4 mr-2" /> View
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrdersDashboard;