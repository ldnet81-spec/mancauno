import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { getSiteUrl } from "../../../../lib/stripe";

type StripeSubscription = {
  customer?: string;
  id: string;
  status?: string;
};

const manageableStatuses = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
]);

function escapeStripeSearchValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

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

  const searchParams = new URLSearchParams();
  searchParams.set("limit", "10");
  searchParams.set(
    "query",
    `metadata['user_id']:'${escapeStripeSearchValue(user.id)}'`
  );

  const searchResponse = await fetch(
    `https://api.stripe.com/v1/subscriptions/search?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
      cache: "no-store",
    }
  );

  if (!searchResponse.ok) {
    return NextResponse.redirect(
      new URL("/abbonamenti?error=abbonamento-non-trovato", request.url)
    );
  }

  const searchData = (await searchResponse.json()) as {
    data?: StripeSubscription[];
  };
  const subscription = searchData.data?.find((item) =>
    manageableStatuses.has(item.status || "")
  );

  if (!subscription?.customer) {
    return NextResponse.redirect(
      new URL("/abbonamenti?error=abbonamento-non-trovato", request.url)
    );
  }

  const siteUrl = getSiteUrl();
  const portalParams = new URLSearchParams();
  portalParams.set("customer", subscription.customer);
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
