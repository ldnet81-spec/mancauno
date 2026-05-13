export type StripeSubscriptionSummary = {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  customer: string | null;
  id: string;
  status: string | null;
};

type StripeSubscriptionResponse = {
  cancel_at_period_end?: boolean;
  current_period_end?: number;
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

export async function findStripeSubscriptionForUser(
  userId: string
): Promise<StripeSubscriptionSummary | null> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return null;
  }

  const searchParams = new URLSearchParams();
  searchParams.set("limit", "10");
  searchParams.set(
    "query",
    `metadata['user_id']:'${escapeStripeSearchValue(userId)}'`
  );

  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/search?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    data?: StripeSubscriptionResponse[];
  };

  const subscription = data.data?.find((item) =>
    manageableStatuses.has(item.status || "")
  );

  if (!subscription) {
    return null;
  }

  return {
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    customer: subscription.customer || null,
    id: subscription.id,
    status: subscription.status || null,
  };
}
