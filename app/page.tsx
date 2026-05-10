import type { Metadata } from "next";
import AppHeaderServer from "../components/AppHeaderServer";
import { createPublicClient } from "../lib/supabase/public";
import SearchEvents from "./SearchEvents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Eventi sportivi vicino a te",
  description:
    "Trova persone per completare partite di calcetto, padel, tennis, basket, running e altri eventi sportivi. Crea un evento, condividi il link e gestisci le richieste.",
  alternates: {
    canonical: "/",
  },
};

type HomePageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";
  const supabase = createPublicClient();

  const { data: events, error } = await supabase
    .from("public_events")
    .select("*")
    .eq("status", "active")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(20);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mancauno.it";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "mancauno.it",
    url: siteUrl,
    description:
      "Web app italiana per creare eventi sportivi, trovare giocatori e aiutare i circoli a completare partite e attivita.",
    inLanguage: "it-IT",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-white px-6 py-8 text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <AppHeaderServer />

      <section className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
          Sport, gruppi e circoli piu organizzati
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Trova chi manca per completare il tuo evento sportivo
        </h1>

        <p className="mt-4 text-lg leading-8 text-gray-700">
          mancauno.it ti aiuta a riempire l&apos;ultimo posto per una partita,
          un allenamento o un&apos;uscita sportiva. Crei l&apos;evento,
          condividi il link e raccogli richieste da persone interessate nella
          tua zona.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href="#eventi"
            className="rounded-xl bg-black px-5 py-3 text-center font-semibold !text-white"
          >
            Cerca eventi
          </a>

          <a
            href="/eventi/nuovo"
            className="rounded-xl border border-gray-300 px-5 py-3 text-center font-semibold text-black"
          >
            Crea un evento
          </a>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 p-5">
          <h2 className="text-xl font-semibold">Per chi vuole giocare</h2>

          <ul className="mt-4 space-y-3 text-gray-700">
            <li>Trovi eventi vicini per sport, citta e disponibilita.</li>
            <li>Capisci subito quanti posti mancano e quando si gioca.</li>
            <li>Ti proponi con pochi passaggi, senza chat infinite.</li>
            <li>Gestisci richieste, approvazioni e partecipazioni dal profilo.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-gray-200 p-5">
          <h2 className="text-xl font-semibold">Per circoli e organizzatori</h2>

          <ul className="mt-4 space-y-3 text-gray-700">
            <li>Pubblicizzi partite e attivita con un link condivisibile.</li>
            <li>Riduci campi vuoti e gruppi incompleti all&apos;ultimo momento.</li>
            <li>Approvi le richieste e tieni sotto controllo i posti disponibili.</li>
            <li>Rendi visibile il tuo circolo a sportivi gia interessati.</li>
          </ul>
        </div>
      </section>

      <section className="mb-8 rounded-3xl bg-gray-50 p-5">
        <h2 className="text-xl font-semibold">
          Perche usare mancauno.it invece dei soliti messaggi?
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-semibold">1 link</p>
            <p className="mt-1 text-sm text-gray-600">
              Lo mandi nel gruppo e chi e interessato si propone.
            </p>
          </div>

          <div>
            <p className="text-2xl font-semibold">0 confusione</p>
            <p className="mt-1 text-sm text-gray-600">
              Posti, orario, luogo e stato delle richieste sono chiari.
            </p>
          </div>

          <div>
            <p className="text-2xl font-semibold">piu continuita</p>
            <p className="mt-1 text-sm text-gray-600">
              Ogni evento puo far nascere nuove partecipazioni ricorrenti.
            </p>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      <section id="eventi" className="scroll-mt-6">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold tracking-tight">
            Eventi disponibili
          </h2>

          <p className="mt-2 text-gray-600">
            Filtra gli eventi aperti e scegli dove unirti o cosa organizzare.
          </p>
        </div>

        <SearchEvents events={events ?? []} initialQuery={initialQuery} />
      </section>
    </main>
  );
}
