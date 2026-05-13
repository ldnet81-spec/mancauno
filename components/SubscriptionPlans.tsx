import ClubProBadge from "./ClubProBadge";
import PrivatePlusBadge from "./PrivatePlusBadge";

type SubscriptionPlansProps = {
  accountType?: string | null;
  currentPlan?: string | null;
  isLoggedIn?: boolean;
};

const planCards = [
  {
    id: "private_plus",
    accountType: "privato",
    badge: <PrivatePlusBadge />,
    cta: "Attiva Privato Plus",
    description:
      "Per privati che organizzano spesso partite e vogliono piu liberta nel creare link evento.",
    highlights: [
      "Partecipa agli eventi",
      "Condividi il link evento",
      "Eventi mensili illimitati",
      "Badge Privato Plus premium",
    ],
    name: "Privato Plus",
    price: "9,90 EUR",
  },
  {
    id: "club_pro",
    accountType: "circolo",
    badge: <ClubProBadge />,
    cta: "Attiva Club Pro",
    description:
      "Riempi i campi vuoti e trova nuovi giocatori nella tua zona.",
    highlights: [
      "Eventi mensili illimitati",
      "Badge Club Pro verificato",
      "Maggiore visibilita negli eventi organizzati",
      "Gestione richieste e posti disponibili",
      "Possibilita futura di pagamenti online",
    ],
    name: "Club Pro",
    price: "19,90 EUR",
  },
];

export default function SubscriptionPlans({
  accountType,
  currentPlan,
  isLoggedIn = false,
}: SubscriptionPlansProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:p-7">
      <div className="max-w-2xl">
        <p className="text-sm font-black uppercase tracking-[0.06em] text-orange-600">
          Piani per chi organizza spesso
        </p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Prima crea e condividi. Poi scala.
        </h2>
        <p className="mt-3 text-slate-600">
          La registrazione resta gratuita. I piani servono quando vuoi creare piu eventi ogni mese, dare piu fiducia ai partecipanti e, per i club, riempire slot vuoti con un link facile da condividere.
        </p>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        {planCards.map((plan) => {
          const isCurrent =
            currentPlan === "pro" && accountType === plan.accountType;
          const isCompatible = !accountType || accountType === plan.accountType;

          return (
            <article
              key={plan.id}
              className={`rounded-3xl border p-5 ${
                plan.id === "club_pro"
                  ? "border-cyan-200 bg-cyan-50/45"
                  : "border-orange-200 bg-orange-50/45"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  {plan.badge}
                  <h3 className="mt-4 text-2xl font-black text-slate-950">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {plan.description}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-white">
                  <p className="text-3xl font-black text-slate-950">
                    {plan.price}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    al mese
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-2">
                {plan.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm font-semibold text-slate-700"
                  >
                    <span className="text-blue-600">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {isLoggedIn ? (
                isCurrent ? (
                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl bg-green-50 px-4 py-3 text-center text-sm font-black text-green-800">
                      Piano attivo
                    </div>

                    <form action="/api/billing/portal" method="POST">
                      <button
                        type="submit"
                        className="w-full rounded-2xl border border-red-200 bg-white px-5 py-3 font-black text-red-700 transition hover:bg-red-50"
                      >
                        Gestisci o annulla abbonamento
                      </button>
                    </form>
                  </div>
                ) : (
                  <form
                    action="/api/billing/checkout"
                    method="POST"
                    className="mt-6"
                  >
                    <input type="hidden" name="plan" value={plan.id} />
                    <button
                      type="submit"
                      disabled={!isCompatible}
                      className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-black !text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {!isCompatible
                        ? "Non disponibile per questo profilo"
                        : plan.cta}
                    </button>
                  </form>
                )
              ) : (
                <a
                  href="/auth/quick-signup?next=/abbonamenti"
                  className="mt-6 block rounded-2xl bg-slate-950 px-5 py-3 text-center font-black !text-white transition hover:bg-blue-700"
                >
                  Accedi per attivare
                </a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
