export type BillingPlan = "private_plus" | "club_pro";

export const billingPlans: Record<
  BillingPlan,
  {
    accountType: "privato" | "circolo";
    badge: "private" | "club";
    description: string;
    envPriceKey: string;
    name: string;
    price: string;
  }
> = {
  private_plus: {
    accountType: "privato",
    badge: "private",
    description: "Per sportivi che organizzano spesso partite e uscite.",
    envPriceKey: "STRIPE_PRICE_PRIVATE_PLUS",
    name: "Privato Plus",
    price: "9,90 € / mese",
  },
  club_pro: {
    accountType: "circolo",
    badge: "club",
    description: "Per circoli e organizzatori che vogliono riempire i posti.",
    envPriceKey: "STRIPE_PRICE_CLUB_PRO",
    name: "Club Pro",
    price: "19,90 € / mese",
  },
};

export function isBillingPlan(value: string): value is BillingPlan {
  return value === "private_plus" || value === "club_pro";
}

export function getStripePriceId(plan: BillingPlan) {
  return process.env[billingPlans[plan].envPriceKey];
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
