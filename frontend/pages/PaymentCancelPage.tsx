import React from "react";
import { Link } from "react-router-dom";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-border bg-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-950/50 dark:to-rose-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-foreground">Payment Cancelled</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Your payment was cancelled. No charges have been made to your account.
            </p>
            
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Note:</strong> You can continue using SCRIBE AI with the free plan, or upgrade anytime to unlock premium features.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Free Plan Includes:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                5 recordings per month
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                Basic transcription
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                AI summaries
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                Local storage
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Link to="/pricing">
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                <CreditCard className="w-4 h-4 mr-2" />
                View Pricing Plans
              </Button>
            </Link>
            
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue with Free Plan
              </Button>
            </Link>
          </div>
          
          <div className="text-center pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Questions about pricing? Contact us at sales@scribeai.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
