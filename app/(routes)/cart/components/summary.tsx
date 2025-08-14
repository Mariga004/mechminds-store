"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/app/components/ui/button";
import Currency from "@/app/components/ui/currency";
import useCart from "@/hooks/use-cart";
import toast from "react-hot-toast";
import axios from "axios";
import { useUser, useClerk } from "@clerk/nextjs";
import { UserPlus } from "lucide-react";

interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number;
  ref: string;
  currency?: string;
  callback?: () => void;
  onClose?: () => void;
  [key: string]: unknown;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: PaystackSetupOptions) => { openIframe: () => void };
    };
  }
}

const Summary = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const items = useCart((state) => state.items);
  const removeAll = useCart((state) => state.removeAll);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [county, setCounty] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const { user, isLoaded } = useUser();
  const { openSignIn, openSignUp } = useClerk();

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
          required: true,
        },
      ],
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
          required: true,
        },
      ],
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
          required: true,
        },
      ],
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
          required: true,
        },
      ],
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
          required: true,
        },
      ],
    },
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
      window.history.replaceState(null, "", window.location.pathname);
    } else if (canceled) {
      toast.error("Payment was canceled", { id: "payment-status" });
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchParams, removeAll]);

  useEffect(() => {
    if (isLoaded && user) {
      const pending = localStorage.getItem("pendingCheckout");
      if (pending === "true") {
        localStorage.removeItem("pendingCheckout");
        if (window.location.pathname !== "/cart") {
          router.push("/cart");
        }
        if (user.primaryEmailAddress?.emailAddress) {
          setEmail(user.primaryEmailAddress.emailAddress);
        }
        toast.success("Welcome back! Please complete your order details.");
      }
    }
  }, [user, isLoaded, router]);

  const totalPrice = items.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  const isCurrentStepValid = () => {
    const currentStepData = formSteps[currentStep];
    return currentStepData.fields.every(
      (field) => !field.required || (field.value && field.value.trim() !== "")
    );
  };

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

  const handleSignUp = async () => {
    localStorage.setItem("pendingCheckout", "true");
    await openSignUp({
      redirectUrl: `${window.location.origin}/cart`,
      afterSignUpUrl: `${window.location.origin}/cart`,
    });
  };

  const handleSignIn = async () => {
    localStorage.setItem("pendingCheckout", "true");
    await openSignIn({
      redirectUrl: `${window.location.origin}/cart`,
      afterSignInUrl: `${window.location.origin}/cart`,
    });
  };

  const handlePayment = async (overrideEmail?: string) => {
    if (!user) {
      localStorage.setItem("pendingCheckout", "true");
      await openSignIn({
        redirectUrl: `${window.location.origin}/cart`,
        afterSignInUrl: `${window.location.origin}/cart`,
      });
      return;
    }

    const finalEmail =
      overrideEmail || email || user.primaryEmailAddress?.emailAddress;

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
    <div
      className={`mt-25 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:ml-0 lg:p-8 ${
        !user ? "pb-24 lg:pb-8" : "pb-32 lg:pb-8"
      }`}
    >
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="text-base font-medium text-gray-900">Order Total</div>
          <Currency value={totalPrice} />
        </div>
      </div>

      {!user && (
        <div className="bg-white rounded-lg p-6 lg:p-8 border text-center">
          <div className="mb-6">
            <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
            </div>
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">
              Create Account to Continue
            </h3>
            <p className="text-sm lg:text-base text-gray-600 mb-6">
              To complete your order and track your purchases, please create an
              account or sign in.
            </p>
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            <Button
              onClick={handleSignUp}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg"
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </Button>
            <Button
              onClick={handleSignIn}
              className="w-full bg-gray-200 hover:bg-gray-300 text-black font-medium py-3 px-6 rounded-lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      )}

      {user && (
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">{currentStepData.title}</h3>
          {currentStepData.subtitle && (
            <p className="text-gray-500 mb-4">{currentStepData.subtitle}</p>
          )}
          {currentStepData.fields.map((field, idx) => (
            <div key={idx} className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.setValue(e.target.value)}
                placeholder={field.placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          ))}

          <div className="flex justify-between mt-6">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 0 || loading}
              className="bg-gray-300 text-black"
            >
              Previous
            </Button>
            {currentStep < totalSteps - 1 ? (
              <Button
                onClick={handleNext}
                disabled={loading}
                className="bg-black text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={() => handlePayment()}
                disabled={loading}
                className="bg-green-600 text-white"
              >
                {loading ? "Processing..." : "Pay Now"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Summary;