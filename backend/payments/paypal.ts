import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";

const paypalClientId = secret("PayPalClientId");
const paypalClientSecret = secret("PayPalClientSecret");
const paypalEnvironment = secret("PayPalEnvironment"); // "sandbox" or "live"

interface PayPalAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CreateOrderRequest {
  amount: string;
  currency: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
}

interface CreateOrderResponse {
  orderId: string;
  approvalUrl: string;
}

interface CaptureOrderRequest {
  orderId: string;
}

interface CaptureOrderResponse {
  orderId: string;
  status: string;
  payerId?: string;
  amount: string;
  currency: string;
}

interface CreateSubscriptionRequest {
  planId: string;
  subscriberEmail: string;
  returnUrl: string;
  cancelUrl: string;
}

interface CreateSubscriptionResponse {
  subscriptionId: string;
  approvalUrl: string;
}

async function getPayPalAccessToken(): Promise<string> {
  const baseUrl = paypalEnvironment() === "live" 
    ? "https://api.paypal.com" 
    : "https://api.sandbox.paypal.com";

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`${paypalClientId()}:${paypalClientSecret()}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data: PayPalAccessTokenResponse = await response.json();
  return data.access_token;
}

// Creates a PayPal payment order.
export const createOrder = api<CreateOrderRequest, CreateOrderResponse>(
  { expose: true, method: "POST", path: "/payments/paypal/orders" },
  async (req) => {
    try {
      const accessToken = await getPayPalAccessToken();
      const baseUrl = paypalEnvironment() === "live" 
        ? "https://api.paypal.com" 
        : "https://api.sandbox.paypal.com";

      const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: {
              currency_code: req.currency,
              value: req.amount,
            },
            description: req.description || "SCRIBE AI Payment",
          }],
          application_context: {
            return_url: req.returnUrl,
            cancel_url: req.cancelUrl,
            brand_name: "SCRIBE AI",
            user_action: "PAY_NOW",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`PayPal API error: ${error}`);
      }

      const order = await response.json();
      const approvalUrl = order.links.find((link: any) => link.rel === "approve")?.href;

      return {
        orderId: order.id,
        approvalUrl: approvalUrl || "",
      };
    } catch (error) {
      console.error("PayPal create order error:", error);
      throw APIError.internal("Failed to create PayPal order");
    }
  }
);

// Captures a PayPal payment order.
export const captureOrder = api<CaptureOrderRequest, CaptureOrderResponse>(
  { expose: true, method: "POST", path: "/payments/paypal/orders/:orderId/capture" },
  async (req) => {
    try {
      const accessToken = await getPayPalAccessToken();
      const baseUrl = paypalEnvironment() === "live" 
        ? "https://api.paypal.com" 
        : "https://api.sandbox.paypal.com";

      const response = await fetch(`${baseUrl}/v2/checkout/orders/${req.orderId}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`PayPal API error: ${error}`);
      }

      const capture = await response.json();
      const purchaseUnit = capture.purchase_units[0];
      const captureDetails = purchaseUnit.payments.captures[0];

      return {
        orderId: capture.id,
        status: capture.status,
        payerId: capture.payer?.payer_id,
        amount: captureDetails.amount.value,
        currency: captureDetails.amount.currency_code,
      };
    } catch (error) {
      console.error("PayPal capture order error:", error);
      throw APIError.internal("Failed to capture PayPal order");
    }
  }
);

// Creates a PayPal subscription.
export const createSubscription = api<CreateSubscriptionRequest, CreateSubscriptionResponse>(
  { expose: true, method: "POST", path: "/payments/paypal/subscriptions" },
  async (req) => {
    try {
      const accessToken = await getPayPalAccessToken();
      const baseUrl = paypalEnvironment() === "live" 
        ? "https://api.paypal.com" 
        : "https://api.sandbox.paypal.com";

      const response = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan_id: req.planId,
          subscriber: {
            email_address: req.subscriberEmail,
          },
          application_context: {
            brand_name: "SCRIBE AI",
            return_url: req.returnUrl,
            cancel_url: req.cancelUrl,
            user_action: "SUBSCRIBE_NOW",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw APIError.internal(`PayPal API error: ${error}`);
      }

      const subscription = await response.json();
      const approvalUrl = subscription.links.find((link: any) => link.rel === "approve")?.href;

      return {
        subscriptionId: subscription.id,
        approvalUrl: approvalUrl || "",
      };
    } catch (error) {
      console.error("PayPal create subscription error:", error);
      throw APIError.internal("Failed to create PayPal subscription");
    }
  }
);
