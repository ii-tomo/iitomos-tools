import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

const subscriptionPriceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export async function POST() {
  try {
    if (!subscriptionPriceId) {
      return NextResponse.json(
        { error: "STRIPE_SUBSCRIPTION_PRICE_ID is not configured." },
        { status: 500 },
      );
    }

    if (!appUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL is not configured." },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return NextResponse.json({ error: "Failed to load your profile." }, { status: 500 });
    }

    if (profile?.subscription_status === "active") {
      return NextResponse.json(
        { error: "An active subscription already exists for this account." },
        { status: 409 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: subscriptionPriceId, quantity: 1 }],
      success_url: `${appUrl}/settings?subscription=success`,
      cancel_url: `${appUrl}/pricing?subscription=cancelled`,
      customer: profile?.stripe_customer_id ?? undefined,
      customer_email: profile?.stripe_customer_id ? undefined : user.email,
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Checkout session creation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
