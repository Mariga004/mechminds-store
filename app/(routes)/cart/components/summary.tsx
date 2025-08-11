"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/app/components/ui/button";
import Currency from "@/app/components/ui/currency";
import { Label } from "@/app/components/ui/label"
import useCart from "@/hooks/use-cart";
import toast from "react-hot-toast";
import axios from "axios";
import { useUser, useClerk } from "@clerk/nextjs";
import { Input } from "@/app/components/ui/input"
import { ChevronLeft, ChevronRight, Check, UserPlus, Mail } from "lucide-react";

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: any) => { openIframe: () => void };
    };
  }
}

const Summary = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const items = useCart((state) => state.items);
  const removeAll = useCart((state) => state.removeAll);
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [county, setCounty] = useState("");
  const [idNumber, setIdNumber] = useState("");

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(0);

  const { user, isLoaded } = useUser();
  const { openSignIn, openSignUp } = useClerk();

  // Define form steps
  const formSteps = [
    {
      title: "Address Info",
      fields: [
        {
          label: "Full Name",
          value: customerName,
          setValue: setCustomerName,
          type: "text",
          placeholder: "Enter your full name",
          required: true
        }
      ]
    },
    {
      title: "Contact Details",
      fields: [
        {
          label: "Phone Number",
          value: phone,
          setValue: setPhone,
          type: "tel",
          placeholder: "0712345678",
          required: true
        }
      ]
    },
    {
      title: "Delivery Address",
      subtitle: "Where should we deliver your order?",
      fields: [
        {
          label: "County",
          value: county,
          setValue: setCounty,
          type: "text",
          placeholder: "Nairobi",
          required: true
        }
      ]
    },
    {
      title: "Location Details",
      subtitle: "Help us locate you better",
      fields: [
        {
          label: "Address",
          value: address,
          setValue: setAddress,
          type: "text",
          placeholder: "Westlands",
          required: true
        }
      ]
    },
    {
      title: "Identification",
      subtitle: "For verification purposes",
      fields: [
        {
          label: "ID Number",
          value: idNumber,
          setValue: setIdNumber,
          type: "text",
          placeholder: "12345678",
          required: true
        }
      ]
    }
  ];

  const totalSteps = formSteps.length;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
  
    if (success) {
      toast.success("Payment completed", { id: "payment-status" });
      removeAll();
      window.history.replaceState(null, '', window.location.pathname);
    } else if (canceled) {
      toast.error("Payment was canceled", { id: "payment-status" });
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [searchParams, removeAll]);

  // Modified useEffect to handle post-authentication redirect
  useEffect(() => {
    if (isLoaded && user) {
      const pending = localStorage.getItem("pendingCheckout");
      if (pending === "true") {
        localStorage.removeItem("pendingCheckout");
        
        // Ensure we stay on the cart route
        if (window.location.pathname !== "/cart") {
          router.push("/cart");
        }
        
        // Set email if available
        if (user.primaryEmailAddress?.emailAddress) {
          setEmail(user.primaryEmailAddress.emailAddress);
        }
        
        toast.success("Welcome back! Please complete your order details.");
      }
    }
  }, [user, isLoaded, router]);

  const totalPrice = items.reduce((total, item) => total + Number(item.price) * item.quantity, 0);

  // Validation for current step
  const isCurrentStepValid = () => {
    const currentStepData = formSteps[currentStep];
    return currentStepData.fields.every(field => 
      !field.required || (field.value && field.value.trim() !== "")
    );
  };

  // Navigation functions
  const handleNext = () => {
    if (!isCurrentStepValid()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Modified auth handlers to specify redirect URL
  const handleSignUp = async () => {
    localStorage.setItem("pendingCheckout", "true");
    await openSignUp({
      redirectUrl: `${window.location.origin}/cart`,
      afterSignUpUrl: `${window.location.origin}/cart`
    });
  };

  const handleSignIn = async () => {
    localStorage.setItem("pendingCheckout", "true");
    await openSignIn({
      redirectUrl: `${window.location.origin}/cart`,
      afterSignInUrl: `${window.location.origin}/cart`
    });
  };

  const handlePayment = async (overrideEmail?: string) => {
  if (!user) {
    localStorage.setItem("pendingCheckout", "true");
    await openSignIn({
      redirectUrl: `${window.location.origin}/cart`,
      afterSignInUrl: `${window.location.origin}/cart`
    });
    return;
  }

  const finalEmail = overrideEmail || email || user.primaryEmailAddress?.emailAddress;

  if (!finalEmail || !/^\S+@\S+\.\S+$/.test(finalEmail)) {
    toast.error("Please enter a valid email");
    return;
  }

  if (!customerName || !phone || !address || !county || !idNumber) {
    toast.error("Please fill in all required fields");
    return;
  }

  setLoading(true);

  const requestData = {
    items: items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    })),
    customerEmail: finalEmail,
    phone,
    address,
    county,
    customerName,
    idNumber,
  };

  console.log("Full checkout request:", requestData);

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/checkout`,
      requestData,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.data.success && window.PaystackPop) {
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: response.data.email,
        amount: response.data.amount,
        ref: response.data.reference,
        currency: "KES",
        callback: () => {
          // Clear cart immediately on successful payment
          removeAll();
          toast.success("Payment completed successfully!");
          window.location.href = `${window.location.origin}/thank-you?session=${response.data.reference}`;
        },
        onClose: () => {
          window.location.href = `${window.location.origin}/cart?canceled=1`;
        },
      });

      handler.openIframe();
    } else {
      throw new Error(response.data.error || "Payment failed");
    }
  } catch (error) {
    console.error("Payment error:", error);
    toast.error(
      axios.isAxiosError(error)
        ? error.response?.data?.error || "Payment failed"
        : "An error occurred"
    );
  } finally {
    setLoading(false);
  }
};
  const currentStepData = formSteps[currentStep];

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="mt-20 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:ml-0 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main content area */}
      <div className={`mt-25 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:ml-0 lg:p-8 ${!user ? 'pb-24 lg:pb-8' : 'pb-32 lg:pb-8'}`}>
        {/* Order Summary Header */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="text-base font-medium text-gray-900">Order Total</div>
            <Currency value={totalPrice} />
          </div>
        </div>

        {/* Authentication Required Section - Desktop Only */}
        {!user && (
          <div className="hidden lg:block bg-white rounded-lg p-8 border text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Account to Continue
              </h3>
              <p className="text-gray-600 mb-6">
                To complete your order and track your purchases, please create an account or sign in.
              </p>
            </div>

            {/* Auth Buttons */}
            <div className="space-y-3 max-w-sm mx-auto">
              <Button
                onClick={handleSignUp}
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Authentication Message - Only show content, not button */}
        {!user && (
          <div className="lg:hidden bg-white rounded-lg p-6 border text-center mb-6">
            <div className="mb-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create Account to Continue
              </h3>
              <p className="text-gray-600 text-sm">
                To complete your order and track your purchases, please create an account using the button below.
              </p>
            </div>
          </div>
        )}

        {/* Multi-step Form - Only show when user is authenticated */}
        {user && (
          <>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-black h-2 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Step Form */}
            <div className="bg-white rounded-lg p-6 border">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-600">
                  {currentStepData.subtitle}
                </p>
              </div>

              {currentStepData.fields.map((field, index) => (
                <div key={index} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.setValue(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                </div>
              ))}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex justify-between items-center mt-8">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep < totalSteps - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isCurrentStepValid()}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  disabled={items.length === 0 || loading || !isCurrentStepValid()}
                  onClick={() => handlePayment()}
                  className="px-8 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="mr-3 h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                    
                    </>
                  ) : (
                    "Checkout"
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile Floating Signup Button - Only show when not authenticated */}
      {!user && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 lg:hidden">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Order total display */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Total: <Currency value={totalPrice} />
              </div>
            </div>
            
            {/* Floating Signup Button */}
            <Button
              onClick={handleSignUp}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
            >
              <UserPlus className="w-5 h-5" />
              Create Account & Continue
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Navigation - Only show when authenticated */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 lg:hidden">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Order total display */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Total: <Currency value={totalPrice} />
              </div>
              <div className="text-xs text-gray-500">
                Step {currentStep + 1} of {totalSteps}
              </div>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep < totalSteps - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isCurrentStepValid()}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  disabled={items.length === 0 || loading || !isCurrentStepValid()}
                  onClick={() => handlePayment()}
                  className="px-4 py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                >
                  {loading ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        ></path>
                      </svg>
                    </>
                  ) : (
                    "Checkout"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Summary;