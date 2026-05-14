import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeaderServer from "../../../components/AppHeaderServer";
import BrandHeader from "../../../components/BrandHeader";
import ClubProBadge from "../../../components/ClubProBadge";
import PrivatePlusBadge from "../../../components/PrivatePlusBadge";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";
import { billingPlans, isBillingPlan } from "../../../lib/stripe";

type ConfermaPagamentoPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

type StripeCheckoutSession = {
  client_reference_id?: string | null;
  customer_email?: string | null;
  metadata?: Record<string, string>;
  payment_status?: string | null;
  status?: string | null;
};

async function getCheckoutSession(sessionId: string) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return null;
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(
      sessionId
    )}`,
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

  return (await response.json()) as StripeCheckoutSession;
}

function getPlanName(plan: string | null | undefined) {
  if (plan && isBillingPlan(plan)) {
    return billingPlans[plan].name;
  }

  return "Piano Pro";
}

export default async function ConfermaPagamentoPage({
  searchParams,
}: ConfermaPagamentoPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup?next=/abbonamenti/conferma");
  }

  const { data: initialProfile } = await supabase
    .from("profiles")
    .select("id, display_name, account_type, account_plan, club_name")
    .eq("id", user.id)
    .single();

  let profile = initialProfile;

  const session = params.session_id
    ? await getCheckoutSession(params.session_id)
    : null;

  const paidUserId =
    session?.metadata?.user_id || session?.client_reference_id || null;
  const paidPlan = session?.metadata?.billing_plan || null;
  // Se esiste una sessione Stripe deve appartenere proprio a questo utente:
  // niente fallback "se manca lo user id va bene".
  const isSameUser = !session || paidUserId === user.id;
  const isPaid =
    session?.status === "complete" || session?.payment_status === "paid";
  const canActivatePlan =
    isSameUser &&
    isPaid &&
    paidPlan &&
    isBillingPlan(paidPlan) &&
    profile?.account_type === billingPlans[paidPlan].accountType;

  let activationError = "";

  if (canActivatePlan && profile?.account_plan !== "pro") {
    const adminSupabase = createAdminClient();

    if (adminSupabase) {
      const { error } = await adminSupabase
        .from("profiles")
        .update({ account_plan: "pro" })
        .eq("id", user.id);

      if (error) {
        activationError = error.message;
      } else if (profile) {
        profile = {
          ...profile,
          account_plan: "pro",
        };
      }
    } else {
      activationError = "Supabase admin non configurato.";
    }
  }

  const planName = getPlanName(paidPlan);
  const profileName =
    profile?.account_type === "circolo" && profile.club_name
      ? profile.club_name
      : profile?.display_name || user.email || "Il tuo profilo";
  const isActive = profile?.account_plan === "pro";

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-8">
      <AppHeaderServer />

      <div className="mb-8">
        <BrandHeader />
      </div>

      <section
        className={`rounded-3xl border p-6 shadow-sm ${
          isSameUser
            ? "border-green-200 bg-green-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        {isSameUser ? (
          <>
            <p className="text-sm font-black uppercase tracking-[0.06em] text-green-700">
              Pagamento completato
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {isActive ? "Piano attivo" : "Pagamento ricevuto"}
            </h1>
            <p className="mt-3 text-slate-700">
              Il pagamento e stato collegato al profilo:
            </p>

            <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-green-100">
              <p className="text-sm text-slate-500">Profilo</p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {profileName}
              </p>
              <p className="mt-1 text-sm text-slate-600">{user.email}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {paidPlan === "club_pro" ? <ClubProBadge compact /> : null}
                {paidPlan === "private_plus" ? (
                  <PrivatePlusBadge compact />
                ) : null}
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black !text-white">
                  {planName}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {isActive ? "Attivo" : "Attivazione in corso"}
                </span>
              </div>
            </div>

            {!isActive ? (
              <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm leading-6 text-orange-800">
                {activationError
                  ? `Pagamento confermato, ma non sono riuscito ad aggiornare il piano: ${activationError}`
                  : "Stripe ha confermato il pagamento, ma il webhook potrebbe impiegare qualche secondo ad aggiornare il piano. Ricarica la pagina tra poco se non lo vedi ancora attivo."}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-sm font-black uppercase tracking-[0.06em] text-red-700">
              Sessione browser diversa
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Attenzione: profilo non corrispondente
            </h1>
            <p className="mt-3 text-sm leading-6 text-red-800">
              Il pagamento risulta collegato a un altro account rispetto alla
              sessione attualmente aperta in questo browser. Succede spesso
              quando si fanno prove con piu account nella stessa finestra o in
              tab diverse.
            </p>
            <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
              Esci, rientra con l&apos;account corretto e controlla il profilo.
              Il pagamento non viene assegnato dal browser: viene collegato allo
              user id salvato nel checkout Stripe.
            </p>
          </>
        )}

        <div className="mt-6 grid gap-3">
          <Link
            href="/profilo"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-center font-black !text-white"
          >
            Vai al profilo
          </Link>
          <Link
            href="/abbonamenti"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center font-bold text-slate-950"
          >
            Torna agli abbonamenti
          </Link>
        </div>
      </section>
    </main>
  );
}
