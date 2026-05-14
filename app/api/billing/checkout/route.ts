import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { createClient } from "../../../../lib/supabase/server";
import {
  billingPlans,
  getSiteUrl,
  getStripePriceId,
  isBillingPlan,
} from "../../../../lib/stripe";
import { areSubscriptionsEnabled } from "../../../../lib/app-settings";

export async function POST(request: Request) {
  if (!(await areSubscriptionsEnabled())) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/quick-signup", request.url));
  }

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    return NextResponse.json(
      { error: "Pagamenti non configurati: manca Supabase admin." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const planValue = String(formData.get("plan") || "");

  if (!isBillingPlan(planValue)) {
    return NextResponse.json({ error: "Piano non valido." }, { status: 400 });
  }

  const selectedPlan = billingPlans[planValue];
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = getStripePriceId(planValue);

  if (!stripeSecretKey || !priceId) {
    return NextResponse.json(
      { error: "Pagamenti Stripe non configurati." },
      { status: 500 }
    );
  }

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("account_type, account_plan")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.redirect(new URL("/auth/quick-signup", request.url));
  }

  if (profile.account_type !== selectedPlan.accountType) {
    return NextResponse.redirect(
      new URL("/abbonamenti?error=piano-non-compatibile", request.url)
    );
  }

  if (profile.account_plan === "pro") {
    return NextResponse.redirect(new URL("/abbonamenti?active=1", request.url));
  }

  const siteUrl = getSiteUrl();
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set(
    "success_url",
    `${siteUrl}/abbonamenti/conferma?session_id={CHECKOUT_SESSION_ID}`
  );
  params.set("cancel_url", `${siteUrl}/abbonamenti?billing=cancelled`);
  params.set("client_reference_id", user.id);
  params.set("customer_email", user.email || "");
  params.set("metadata[user_id]", user.id);
  params.set("metadata[user_email]", user.email || "");
  params.set("metadata[account_type]", profile.account_type);
  params.set("metadata[billing_plan]", planValue);
  params.set("subscription_data[metadata][user_id]", user.id);
  params.set("subscription_data[metadata][account_type]", profile.account_type);
  params.set("subscription_data[metadata][billing_plan]", planValue);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const session = await response.json();

  if (!response.ok || !session.url) {
    return NextResponse.json(
      { error: session.error?.message || "Impossibile avviare il checkout." },
      { status: 400 }
    );
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
