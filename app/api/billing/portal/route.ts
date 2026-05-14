import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { getSiteUrl } from "../../../../lib/stripe";
import { findStripeSubscriptionForUser } from "../../../../lib/stripe-subscriptions";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/quick-signup", request.url));
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return NextResponse.redirect(
      new URL("/abbonamenti?error=pagamenti-non-configurati", request.url)
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .single();

  let customerId: string | null = profile?.stripe_customer_id ?? null;

  // Fallback per abbonamenti creati prima dello storage degli id Stripe.
  if (!customerId) {
    const subscription = await findStripeSubscriptionForUser(
      user.id,
      profile?.stripe_subscription_id
    );
    customerId = subscription?.customer ?? null;
  }

  if (!customerId) {
    return NextResponse.redirect(
      new URL("/abbonamenti?error=abbonamento-non-trovato", request.url)
    );
  }

  const siteUrl = getSiteUrl();
  const portalParams = new URLSearchParams();
  portalParams.set("customer", customerId);
  portalParams.set("return_url", `${siteUrl}/abbonamenti/gestione`);

  const portalResponse = await fetch(
    "https://api.stripe.com/v1/billing_portal/sessions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: portalParams,
    }
  );

  const portalSession = await portalResponse.json();

  if (!portalResponse.ok || !portalSession.url) {
    return NextResponse.redirect(
      new URL("/abbonamenti?error=portale-non-configurato", request.url)
    );
  }

  return NextResponse.redirect(portalSession.url, { status: 303 });
}
