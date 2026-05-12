import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { isBillingPlan } from "../../../../lib/stripe";

export const runtime = "nodejs";

type StripeObject = {
  client_reference_id?: string;
  metadata?: Record<string, string>;
  status?: string;
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

function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
) {
  const { signatures, timestamp } = getStripeSignatureParts(signatureHeader);

  if (!timestamp || !signatures.length) {
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

async function setAccountPlan(userId: string | undefined, plan: "free" | "pro") {
  if (!userId) {
    return;
  }

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    throw new Error("Supabase admin non configurato.");
  }

  const { error } = await adminSupabase
    .from("profiles")
    .update({ account_plan: plan })
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
    if (isBillingPlan(billingPlan || "")) {
      await setAccountPlan(userId, "pro");
    }

    return NextResponse.json({ received: true });
  }

  if (event.type === "customer.subscription.updated") {
    const activeStatuses = ["active", "trialing"];
    await setAccountPlan(
      userId,
      activeStatuses.includes(object?.status || "") ? "pro" : "free"
    );

    return NextResponse.json({ received: true });
  }

  if (event.type === "customer.subscription.deleted") {
    await setAccountPlan(userId, "free");
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
