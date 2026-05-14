import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { billingPlans, isBillingPlan } from "../../../../lib/stripe";

export const runtime = "nodejs";

type StripeObject = {
  client_reference_id?: string;
  customer?: string;
  id?: string;
  metadata?: Record<string, string>;
  status?: string;
  subscription?: string;
};

type StripeEvent = {
  data?: {
    object?: StripeObject;
  };
  type?: string;
};

function getStripeSignatureParts(signatureHeader: string) {
  return signatureHeader.split(",").reduce(
    (parts, item) => {
      const [key, value] = item.split("=");

      if (key === "t" && value) {
        parts.timestamp = value;
      }

      if (key === "v1" && value) {
        parts.signatures.push(value);
      }

      return parts;
    },
    { signatures: [] as string[], timestamp: "" }
  );
}

const SIGNATURE_TOLERANCE_SECONDS = 300;

function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
) {
  const { signatures, timestamp } = getStripeSignatureParts(signatureHeader);

  if (!timestamp || !signatures.length) {
    return false;
  }

  // Rifiuta eventi troppo vecchi per evitare replay attack.
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }
  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
  if (ageSeconds > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  return signatures.some((signature) => {
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(signature, "hex");

    return (
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  });
}

async function setAccountPlan(
  userId: string | undefined,
  plan: "free" | "pro",
  billingPlan?: string
) {
  if (!userId) {
    return;
  }

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    throw new Error("Supabase admin non configurato.");
  }

  if (plan === "pro") {
    if (!billingPlan || !isBillingPlan(billingPlan)) {
      return;
    }

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("account_type")
      .eq("id", userId)
      .single();

    if (profile?.account_type !== billingPlans[billingPlan].accountType) {
      return;
    }
  }

  const { error } = await adminSupabase
    .from("profiles")
    .update({ account_plan: plan })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

async function saveStripeIds(
  userId: string | undefined,
  customerId: string | undefined,
  subscriptionId: string | undefined
) {
  if (!userId || (!customerId && !subscriptionId)) {
    return;
  }

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    throw new Error("Supabase admin non configurato.");
  }

  const updates: Record<string, string> = {};

  if (customerId) {
    updates.stripe_customer_id = customerId;
  }

  if (subscriptionId) {
    updates.stripe_subscription_id = subscriptionId;
  }

  const { error } = await adminSupabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signatureHeader = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!webhookSecret || !signatureHeader) {
    return NextResponse.json(
      { error: "Webhook Stripe non configurato." },
      { status: 400 }
    );
  }

  if (!verifyStripeSignature(payload, signatureHeader, webhookSecret)) {
    return NextResponse.json({ error: "Firma non valida." }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;
  const object = event.data?.object;
  const userId = object?.metadata?.user_id || object?.client_reference_id;
  const billingPlan = object?.metadata?.billing_plan;

  if (event.type === "checkout.session.completed") {
    await saveStripeIds(userId, object?.customer, object?.subscription);

    if (isBillingPlan(billingPlan || "")) {
      await setAccountPlan(userId, "pro", billingPlan);
    }

    return NextResponse.json({ received: true });
  }

  if (event.type === "customer.subscription.updated") {
    // L'oggetto qui e la subscription: object.id e l'id dell'abbonamento.
    await saveStripeIds(userId, object?.customer, object?.id);

    // "past_due" significa solo che Stripe sta ancora ritentando l'addebito
    // (dunning): il piano resta Pro finche non diventa canceled/unpaid.
    const proStatuses = ["active", "trialing", "past_due"];
    await setAccountPlan(
      userId,
      proStatuses.includes(object?.status || "") ? "pro" : "free",
      billingPlan
    );

    return NextResponse.json({ received: true });
  }

  if (event.type === "customer.subscription.deleted") {
    await setAccountPlan(userId, "free");
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
