import type { Metadata } from "next";
import AppHeaderServer from "../../components/AppHeaderServer";
import SubscriptionPlans from "../../components/SubscriptionPlans";
import { createClient } from "../../lib/supabase/server";
import { findStripeSubscriptionForUser } from "../../lib/stripe-subscriptions";

export const metadata: Metadata = {
  title: "Abbonamenti",
  description:
    "Scopri Privato Plus e Club Pro: piani mensili per creare eventi sportivi illimitati su mancauno.it.",
};

type AbbonamentiPageProps = {
  searchParams: Promise<{
    active?: string;
    billing?: string;
    error?: string;
  }>;
};

export default async function AbbonamentiPage({
  searchParams,
}: AbbonamentiPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("account_type, account_plan, stripe_subscription_id")
        .eq("id", user.id)
        .single()
    : { data: null };

  const billingStatus =
    user && profile?.account_plan === "pro"
      ? await findStripeSubscriptionForUser(
          user.id,
          profile?.stripe_subscription_id
        )
      : null;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-28 pt-4 text-slate-950 sm:px-6">
      <AppHeaderServer />

      <section className="mb-8">
        <p className="text-sm font-black uppercase tracking-[0.06em] text-orange-600">
          Mancauno premium
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Più eventi, più fiducia, meno posti vuoti
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Privati e club possono registrarsi gratis. L&apos;abbonamento mensile
          sblocca eventi illimitati e un badge premium visibile nelle pagine e
          nelle anteprime evento.
        </p>
      </section>

      {params.error === "piano-non-compatibile" ? (
        <div className="mb-5 rounded-2xl bg-orange-50 p-4 text-sm font-semibold text-orange-800">
          Il piano selezionato non è compatibile con il tipo di profilo.
          Aggiorna il profilo o scegli il piano corretto.
        </div>
      ) : null}


      {params.error === "abbonamento-non-trovato" ? (
        <div className="mb-5 rounded-2xl bg-orange-50 p-4 text-sm font-semibold text-orange-800">
          Non ho trovato un abbonamento Stripe attivo per questo profilo. Se il
          pagamento e recente, attendi qualche minuto o controlla la sessione
          Stripe.
        </div>
      ) : null}

      {params.error === "portale-non-configurato" ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Il portale clienti Stripe non e ancora configurato. Attivalo da Stripe
          per permettere agli utenti di annullare l&apos;abbonamento.
        </div>
      ) : null}

      {params.error === "pagamenti-non-configurati" ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Pagamenti Stripe non configurati sul server.
        </div>
      ) : null}
      {params.billing === "cancelled" ? (
        <div className="mb-5 rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-700">
          Checkout annullato. Puoi riprendere quando vuoi.
        </div>
      ) : null}

      {params.active ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
          Hai già un piano premium attivo.
        </div>
      ) : null}

      <SubscriptionPlans
        accountType={profile?.account_type}
        billingStatus={billingStatus}
        currentPlan={profile?.account_plan}
        isLoggedIn={Boolean(user)}
      />
    </main>
  );
}
