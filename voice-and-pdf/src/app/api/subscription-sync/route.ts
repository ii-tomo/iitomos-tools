import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getCreditsForContinuousMonths } from "@/utils/subscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

type SyncableProfile = {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_plan: string;
  subscription_status: string | null;
  continuous_months: number | null;
  last_bonus_applied_at: string | null;
};

function getCurrentPeriodEndIso(subscription: Stripe.Subscription): string | null {
  const periodEndUnix =
    typeof subscription.current_period_end === "number"
      ? subscription.current_period_end
      : null;

  return periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select(
        "id, stripe_customer_id, stripe_subscription_id, subscription_plan, subscription_status, continuous_months, last_bonus_applied_at",
      )
      .eq("id", user.id)
      .maybeSingle<SyncableProfile>();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    if (!profile.stripe_subscription_id) {
      return NextResponse.json({ synced: false, reason: "no_subscription" });
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const currentPeriodEndIso = getCurrentPeriodEndIso(subscription);

    const updates: Record<string, string | number | null> = {
      stripe_customer_id:
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
      subscription_status: subscription.status,
      subscription_plan: subscription.status === "canceled" ? "free" : "premium",
    };

    if (currentPeriodEndIso) {
      updates.current_period_end = currentPeriodEndIso;
    }

    let grantedInitialCredits = false;

    if (
      subscription.status === "active" &&
      !profile.last_bonus_applied_at &&
      (profile.continuous_months ?? 0) === 0
    ) {
      updates.continuous_months = 1;
      updates.credits_remaining = getCreditsForContinuousMonths(1);
      updates.last_bonus_applied_at = new Date().toISOString();
      grantedInitialCredits = true;
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ synced: true, grantedInitialCredits });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscription sync failed.";
    console.error("Subscription sync error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
