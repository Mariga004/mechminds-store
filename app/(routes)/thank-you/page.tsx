'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Package, ArrowRight, Home, Car, Truck } from 'lucide-react';
import  Button  from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';

const PaymentSuccess = () => {
  const [sessionId, setSessionId] = useState('');
 const router = useRouter();

  useEffect(() => {
    // Generate a mock session ID
    const generateSessionId = () => {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 15);
      return `${timestamp.slice(-8)}-${random.slice(0, 4)}-${random.slice(4, 8)}-${random.slice(8, 12)}-${timestamp.slice(0, 8)}${random.slice(-4)}`;
    };
    
    setSessionId(generateSessionId());
  }, []);

  const handleTrackOrder = () => {
    router.push('/orders');
  };

  const handleContinueShopping = () => {
    // Navigate back to home/shop
    console.log('Navigating to home page');
  };

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full mx-auto my-8">
        {/* Success Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Payment Successful! 🎉
          </h1>
          
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
            Thank you for your purchase. Your order has been placed successfully!
          </p>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6 sm:mb-8">
            <Button
              onClick={handleTrackOrder}
              className="w-full text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Truck className="w-4 h-4" />
              Track Order
            </Button>
            
            <Button
              onClick={handleContinueShopping}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Home className="w-4 h-4" />
              Continue Shopping
            </Button>
          </div>

          {/* Session Info */}
          {sessionId && (
            <div className="border-t pt-4 sm:pt-6">
              <p className="text-xs text-gray-400 mb-1">Payment Session ID:</p>
              <p className="text-xs text-gray-600 font-mono break-all">
                {sessionId}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;