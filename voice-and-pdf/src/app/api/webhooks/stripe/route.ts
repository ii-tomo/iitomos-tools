import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCreditsForContinuousMonths, isProcessedBillingCycle } from "@/utils/subscription";
import { createAdminClient } from "@/utils/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

type ProfileRecord = {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  continuous_months: number | null;
  last_bonus_applied_at: string | null;
};

function extractStripeId(
  value: string | Stripe.Customer | Stripe.Subscription | Stripe.DeletedCustomer | Stripe.DeletedSubscription | null,
): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function getCurrentPeriodEndIso(subscription: Stripe.Subscription): string | null {
  const periodEndUnix =
    typeof subscription.current_period_end === "number"
      ? subscription.current_period_end
      : null;

  if (!periodEndUnix) {
    return null;
  }

  return new Date(periodEndUnix * 1000).toISOString();
}

async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = extractStripeId(session.customer);
  const subscriptionId = extractStripeId(session.subscription);

  if (!userId || !customerId || !subscriptionId) {
    console.warn("[Webhook] checkout.session.completed missing linkage:", session.id);
    return;
  }

  const admin = createAdminClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEndIso = getCurrentPeriodEndIso(subscription);

  const updates: {
    stripe_customer_id: string;
    stripe_subscription_id: string;
    subscription_plan: string;
    subscription_status: Stripe.Subscription.Status;
    current_period_end?: string;
  } = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    subscription_plan: "premium",
    subscription_status: subscription.status,
  };

  if (currentPeriodEndIso) {
    updates.current_period_end = currentPeriodEndIso;
  }

  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to sync checkout session: ${error.message}`);
  }
}

async function applyInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = extractStripeId(invoice.subscription);
  const customerId = extractStripeId(invoice.customer);
  const paidAtUnix = invoice.status_transitions?.paid_at ?? invoice.created ?? null;

  if (!subscriptionId || !customerId || !paidAtUnix) {
    console.warn("[Webhook] invoice.paid missing subscription, customer, or paid_at:", invoice.id);
    return;
  }

  const admin = createAdminClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.userId;

  let profile: ProfileRecord | null = null;

  if (userId) {
    const { data } = await admin
      .from("profiles")
      .select("id, stripe_customer_id, stripe_subscription_id, continuous_months, last_bonus_applied_at")
      .eq("id", userId)
      .maybeSingle<ProfileRecord>();
    profile = data;
  }

  if (!profile) {
    const { data } = await admin
      .from("profiles")
      .select("id, stripe_customer_id, stripe_subscription_id, continuous_months, last_bonus_applied_at")
      .eq("stripe_customer_id", customerId)
      .maybeSingle<ProfileRecord>();
    profile = data;
  }

  if (!profile) {
    console.warn("[Webhook] invoice.paid could not find matching profile:", invoice.id);
    return;
  }

  if (isProcessedBillingCycle(profile.last_bonus_applied_at, paidAtUnix)) {
    console.log("[Webhook] invoice.paid already processed:", invoice.id);
    return;
  }

  const nextContinuousMonths = (profile.continuous_months ?? 0) + 1;
  const creditsToGrant = getCreditsForContinuousMonths(nextContinuousMonths);
  const paidAtIso = new Date(paidAtUnix * 1000).toISOString();
  const currentPeriodEndIso = getCurrentPeriodEndIso(subscription);

  const updates: {
    subscription_plan: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    subscription_status: Stripe.Subscription.Status;
    continuous_months: number;
    last_bonus_applied_at: string;
    credits_remaining: number;
    current_period_end?: string;
  } = {
    subscription_plan: "premium",
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    subscription_status: subscription.status,
    continuous_months: nextContinuousMonths,
    last_bonus_applied_at: paidAtIso,
    credits_remaining: creditsToGrant,
  };

  if (currentPeriodEndIso) {
    updates.current_period_end = currentPeriodEndIso;
  }

  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", profile.id);

  if (error) {
    throw new Error(`Failed to apply invoice credits: ${error.message}`);
  }
}

async function syncSubscriptionStatus(subscription: Stripe.Subscription) {
  const admin = createAdminClient();
  const customerId = extractStripeId(subscription.customer);

  if (!customerId) {
    return;
  }

  const latestSubscription =
    subscription.status === "canceled"
      ? subscription
      : await stripe.subscriptions.retrieve(subscription.id);
  const currentPeriodEndIso = getCurrentPeriodEndIso(latestSubscription);

  const updates: {
    stripe_subscription_id: string;
    subscription_plan: string;
    subscription_status: Stripe.Subscription.Status;
    current_period_end?: string;
  } = {
    stripe_subscription_id: subscription.id,
    subscription_plan: latestSubscription.status === "canceled" ? "free" : "premium",
    subscription_status: latestSubscription.status,
  };

  if (currentPeriodEndIso) {
    updates.current_period_end = currentPeriodEndIso;
  }

  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("stripe_customer_id", customerId);

  if (error) {
    throw new Error(`Failed to sync subscription status: ${error.message}`);
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !endpointSecret) {
    return NextResponse.json({ error: "Webhook configuration error" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook signature verification failed.";
    console.error("Webhook error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await syncCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
        await applyInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscriptionStatus(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    console.error(`[Webhook] ${event.type} failed:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
