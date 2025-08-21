import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";
import { billingDB } from "./db";

const stripeSecretKey = secret("StripeSecretKey");
const stripeWebhookSecret = secret("StripeWebhookSecret");

interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  organizationId?: string;
}

interface CreateCheckoutSessionResponse {
  sessionUrl: string;
}

interface CreatePortalSessionRequest {
  returnUrl: string;
}

interface CreatePortalSessionResponse {
  sessionUrl: string;
}

interface Subscription {
  id: string;
  userId: string;
  organizationId?: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  plan: "pro" | "enterprise";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GetSubscriptionResponse {
  subscription: Subscription | null;
  usage: {
    recordingsThisMonth: number;
    transcriptionMinutesThisMonth: number;
    storageUsedMB: number;
  };
  limits: {
    maxRecordings: number;
    maxTranscriptionMinutes: number;
    maxStorageMB: number;
  };
}

// Creates a Stripe checkout session for subscription.
export const createCheckoutSession = api<CreateCheckoutSessionRequest, CreateCheckoutSessionResponse>(
  { auth: true, expose: true, method: "POST", path: "/billing/checkout" },
  async (req) => {
    const auth = getAuthData()!;
    
    try {
      const stripe = require('stripe')(stripeSecretKey());
      
      // Get or create customer
      let customer;
      const existingCustomer = await billingDB.queryRow<{ stripe_customer_id: string }>`
        SELECT stripe_customer_id FROM subscriptions 
        WHERE user_id = ${auth.userID} OR organization_id = ${req.organizationId}
        LIMIT 1
      `;
      
      if (existingCustomer) {
        customer = await stripe.customers.retrieve(existingCustomer.stripe_customer_id);
      } else {
        customer = await stripe.customers.create({
          email: auth.email,
          metadata: {
            userId: auth.userID,
            organizationId: req.organizationId || '',
          },
        });
      }
      
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: req.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: req.successUrl,
        cancel_url: req.cancelUrl,
        metadata: {
          userId: auth.userID,
          organizationId: req.organizationId || '',
        },
      });
      
      return { sessionUrl: session.url! };
    } catch (error) {
      console.error("Checkout session creation error:", error);
      throw APIError.internal("Failed to create checkout session");
    }
  }
);

// Creates a Stripe customer portal session.
export const createPortalSession = api<CreatePortalSessionRequest, CreatePortalSessionResponse>(
  { auth: true, expose: true, method: "POST", path: "/billing/portal" },
  async (req) => {
    const auth = getAuthData()!;
    
    try {
      const stripe = require('stripe')(stripeSecretKey());
      
      const subscription = await billingDB.queryRow<{ stripe_customer_id: string }>`
        SELECT stripe_customer_id FROM subscriptions 
        WHERE user_id = ${auth.userID}
        LIMIT 1
      `;
      
      if (!subscription) {
        throw APIError.notFound("No subscription found");
      }
      
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: req.returnUrl,
      });
      
      return { sessionUrl: session.url };
    } catch (error) {
      console.error("Portal session creation error:", error);
      throw APIError.internal("Failed to create portal session");
    }
  }
);

// Gets user's subscription and usage information.
export const getSubscription = api<void, GetSubscriptionResponse>(
  { auth: true, expose: true, method: "GET", path: "/billing/subscription" },
  async () => {
    const auth = getAuthData()!;
    
    try {
      const subscription = await billingDB.queryRow<{
        id: string;
        user_id: string;
        organization_id: string | null;
        stripe_customer_id: string;
        stripe_subscription_id: string;
        status: string;
        plan: string;
        current_period_start: Date;
        current_period_end: Date;
        cancel_at_period_end: boolean;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT * FROM subscriptions 
        WHERE user_id = ${auth.userID} OR organization_id = ${auth.organizationId}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      // Get usage statistics
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const usage = await billingDB.queryRow<{
        recordings_count: number;
        transcription_minutes: number;
        storage_mb: number;
      }>`
        SELECT 
          COUNT(*) as recordings_count,
          COALESCE(SUM(duration), 0) / 60 as transcription_minutes,
          COALESCE(SUM(LENGTH(transcript) + LENGTH(summary)), 0) / 1024 / 1024 as storage_mb
        FROM notes 
        WHERE user_id = ${auth.userID} AND created_at >= ${currentMonth}
      `;
      
      // Define plan limits
      const planLimits = {
        free: { maxRecordings: 10, maxTranscriptionMinutes: 60, maxStorageMB: 100 },
        pro: { maxRecordings: 1000, maxTranscriptionMinutes: 1000, maxStorageMB: 10000 },
        enterprise: { maxRecordings: -1, maxTranscriptionMinutes: -1, maxStorageMB: -1 },
      };
      
      const limits = planLimits[auth.plan] || planLimits.free;
      
      return {
        subscription: subscription ? {
          id: subscription.id,
          userId: subscription.user_id,
          organizationId: subscription.organization_id || undefined,
          stripeCustomerId: subscription.stripe_customer_id,
          stripeSubscriptionId: subscription.stripe_subscription_id,
          status: subscription.status,
          plan: subscription.plan as "pro" | "enterprise",
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          createdAt: subscription.created_at,
          updatedAt: subscription.updated_at,
        } : null,
        usage: {
          recordingsThisMonth: usage?.recordings_count || 0,
          transcriptionMinutesThisMonth: Math.round(usage?.transcription_minutes || 0),
          storageUsedMB: Math.round(usage?.storage_mb || 0),
        },
        limits,
      };
    } catch (error) {
      console.error("Get subscription error:", error);
      throw APIError.internal("Failed to get subscription information");
    }
  }
);

// Handles Stripe webhooks for subscription events.
export const handleWebhook = api<{ body: string; signature: string }, void>(
  { expose: true, method: "POST", path: "/billing/webhook" },
  async (req) => {
    try {
      const stripe = require('stripe')(stripeSecretKey());
      
      const event = stripe.webhooks.constructEvent(
        req.body,
        req.signature,
        stripeWebhookSecret()
      );
      
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object);
          break;
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;
      }
    } catch (error) {
      console.error("Webhook handling error:", error);
      throw APIError.internal("Failed to handle webhook");
    }
  }
);

async function handleCheckoutCompleted(session: any) {
  const userId = session.metadata?.userId;
  const organizationId = session.metadata?.organizationId || null;
  
  if (!userId) return;
  
  const stripe = require('stripe')(stripeSecretKey());
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  // Determine plan from price ID
  const priceId = subscription.items.data[0].price.id;
  let plan = "pro";
  if (priceId.includes("enterprise")) {
    plan = "enterprise";
  }
  
  await billingDB.exec`
    INSERT INTO subscriptions (
      user_id, organization_id, stripe_customer_id, stripe_subscription_id,
      status, plan, current_period_start, current_period_end, cancel_at_period_end
    ) VALUES (
      ${userId}, ${organizationId}, ${session.customer}, ${subscription.id},
      ${subscription.status}, ${plan}, 
      ${new Date(subscription.current_period_start * 1000)},
      ${new Date(subscription.current_period_end * 1000)},
      ${subscription.cancel_at_period_end}
    )
    ON CONFLICT (stripe_subscription_id) 
    DO UPDATE SET
      status = EXCLUDED.status,
      plan = EXCLUDED.plan,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      updated_at = NOW()
  `;
}

async function handleSubscriptionUpdated(subscription: any) {
  await billingDB.exec`
    UPDATE subscriptions SET
      status = ${subscription.status},
      current_period_start = ${new Date(subscription.current_period_start * 1000)},
      current_period_end = ${new Date(subscription.current_period_end * 1000)},
      cancel_at_period_end = ${subscription.cancel_at_period_end},
      updated_at = NOW()
    WHERE stripe_subscription_id = ${subscription.id}
  `;
}

async function handleSubscriptionDeleted(subscription: any) {
  await billingDB.exec`
    UPDATE subscriptions SET
      status = 'canceled',
      updated_at = NOW()
    WHERE stripe_subscription_id = ${subscription.id}
  `;
}

async function handlePaymentSucceeded(invoice: any) {
  // Update subscription status if needed
  if (invoice.subscription) {
    await billingDB.exec`
      UPDATE subscriptions SET
        status = 'active',
        updated_at = NOW()
      WHERE stripe_subscription_id = ${invoice.subscription}
    `;
  }
}

async function handlePaymentFailed(invoice: any) {
  // Update subscription status
  if (invoice.subscription) {
    await billingDB.exec`
      UPDATE subscriptions SET
        status = 'past_due',
        updated_at = NOW()
      WHERE stripe_subscription_id = ${invoice.subscription}
    `;
  }
}
