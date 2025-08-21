import React, { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePayment } from "../contexts/PaymentContext";
import { useToast } from "@/components/ui/use-toast";

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { captureOrder } = usePayment();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(true);
  const [paymentDetails, setPaymentDetails] = React.useState<any>(null);

  const orderId = searchParams.get("token");
  const payerId = searchParams.get("PayerID");

  useEffect(() => {
    const processPayment = async () => {
      if (orderId && payerId) {
        try {
          const result = await captureOrder(orderId);
          setPaymentDetails(result);
          
          // Here you would typically update the user's subscription status
          // and grant access to premium features
          
        } catch (error) {
          console.error("Payment processing error:", error);
          toast({
            title: "Payment Processing Error",
            description: "There was an issue processing your payment. Please contact support.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      } else {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [orderId, payerId, captureOrder, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border bg-card">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Processing Payment</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-border bg-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl text-foreground">Payment Successful!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Thank you for your payment. Your SCRIBE AI Pro subscription is now active!
            </p>
            
            {paymentDetails && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="text-sm space-y-1">
                  <p><strong>Order ID:</strong> {paymentDetails.orderId}</p>
                  <p><strong>Amount:</strong> {paymentDetails.currency} {paymentDetails.amount}</p>
                  <p><strong>Status:</strong> {paymentDetails.status}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">What's Next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Access to unlimited recordings
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Real-time transcription enabled
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                50+ language support activated
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Team collaboration features unlocked
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Link to="/record">
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                Start Recording
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link to="/">
              <Button variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="text-center pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Need help? Contact our support team at support@scribeai.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
