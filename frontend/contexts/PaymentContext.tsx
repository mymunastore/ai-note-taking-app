import React, { createContext, useContext, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "./AuthContext";
import { paypalClientId, paypalEnvironment } from "../config";

interface PaymentContextType {
  createOrder: (amount: string, currency: string, description?: string) => Promise<{ orderId: string; approvalUrl: string }>;
  captureOrder: (orderId: string) => Promise<any>;
  createSubscription: (planId: string, email: string) => Promise<{ subscriptionId: string; approvalUrl: string }>;
  isPayPalLoaded: boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
  children: ReactNode;
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  const backend = useBackend();
  const { toast } = useToast();
  const [isPayPalLoaded, setIsPayPalLoaded] = React.useState(false);

  React.useEffect(() => {
    // Load PayPal SDK
    if (paypalClientId && !window.paypal) {
      const script = document.createElement("script");
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture`;
      script.onload = () => setIsPayPalLoaded(true);
      document.head.appendChild(script);
    } else if (window.paypal) {
      setIsPayPalLoaded(true);
    }
  }, []);

  const createOrder = async (amount: string, currency: string, description?: string) => {
    try {
      const response = await backend.payments.createOrder({
        amount,
        currency,
        description,
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
      });
      return response;
    } catch (error) {
      console.error("Create order error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to create payment order. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const captureOrder = async (orderId: string) => {
    try {
      const response = await backend.payments.captureOrder({ orderId });
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
      return response;
    } catch (error) {
      console.error("Capture order error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createSubscription = async (planId: string, email: string) => {
    try {
      const response = await backend.payments.createSubscription({
        planId,
        subscriberEmail: email,
        returnUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/cancel`,
      });
      return response;
    } catch (error) {
      console.error("Create subscription error:", error);
      toast({
        title: "Subscription Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value: PaymentContextType = {
    createOrder,
    captureOrder,
    createSubscription,
    isPayPalLoaded,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
}
