import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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

const trustItems = [
  {
    icon: "people",
    title: "Comunità attiva",
    text: "Migliaia di sportivi",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: "shield",
    title: "Affidabile e sicuro",
    text: "Richieste sotto controllo",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: "pin",
    title: "Vicino a te",
    text: "Eventi nella tua zona",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

const sports = [
  { name: "Calcetto", emoji: "⚽", events: "2.341 eventi", active: true },
  { name: "Padel", emoji: "🎾", events: "1.587 eventi" },
  { name: "Tennis", emoji: "🥎", events: "987 eventi" },
  { name: "Running", emoji: "👟", events: "642 eventi" },
  { name: "Pallavolo", emoji: "🏐", events: "532 eventi" },
  { name: "Basket", emoji: "🏀", events: "476 eventi" },
];

function MiniIcon({ type }: { type: string }) {
  if (type === "shield") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <path d="M12 3 19 6v5c0 4.6-2.8 8.7-7 10-4.2-1.3-7-5.4-7-10V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "pin") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <path d="M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11Z" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="M16 19v-1.4c0-1.7-1.8-3.1-4-3.1s-4 1.4-4 3.1V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M4 18v-1c0-1.4 1.3-2.5 3-2.8M20 18v-1c0-1.4-1.3-2.5-3-2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckItem({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "orange" }) {
  const color = tone === "orange" ? "bg-orange-600" : "bg-blue-600";

  return (
    <li className="flex gap-3 text-[15px] leading-6 text-slate-700 sm:text-base">
      <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${color} text-white`}>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <path d="m4 8 2.2 2.2L12 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}

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
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-4 text-slate-950 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <AppHeaderServer />

      <section className="relative overflow-hidden py-5 sm:py-9">
        <div className="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full border-2 border-dashed border-blue-300/80" />
        <div className="pointer-events-none absolute right-[-4rem] top-80 h-24 w-24 rounded-full bg-blue-200/70" />
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative z-10">
            <p className="text-sm font-extrabold uppercase tracking-[0.06em] text-orange-600 sm:text-base">
              Sport, gruppi e circoli più organizzati
            </p>

            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Trova chi manca per completare il tuo evento sportivo
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl sm:leading-9">
              mancauno.it ti aiuta a riempire l&apos;ultimo posto per una partita,
              un allenamento o un&apos;uscita sportiva. Crea l&apos;evento,
              condividi il link e raccogli richieste da persone interessate nella
              tua zona.
            </p>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              <a
                href="#eventi"
                className="inline-flex min-h-16 items-center justify-center gap-4 rounded-2xl bg-blue-600 px-6 text-lg font-bold !text-white shadow-[0_18px_45px_rgba(37,99,235,0.28)] transition hover:bg-blue-700"
              >
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Cerca eventi
              </a>

              <Link
                href="/eventi/nuovo"
                className="inline-flex min-h-16 items-center justify-center gap-4 rounded-2xl border border-orange-500 bg-white/80 px-6 text-lg font-bold text-slate-950 shadow-sm transition hover:bg-orange-50"
              >
                <span className="text-4xl font-light leading-none text-orange-600">+</span>
                Crea un evento
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px] lg:mr-0">
            <div className="absolute left-[-3rem] top-[45%] h-24 w-40 rounded-full border-2 border-dashed border-blue-300/90" />
            <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] ring-1 ring-slate-200">
              <Image
                src="/hero-soccer.png"
                alt="Partita di calcetto tra sportivi al tramonto"
                width={900}
                height={720}
                priority
                className="aspect-[1.02/1] w-full object-cover"
              />
              <div className="absolute left-[-1.2rem] top-7 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-[0_14px_35px_rgba(15,23,42,0.16)] backdrop-blur sm:left-[-2rem] sm:px-5">
                <div className="flex -space-x-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 ring-2 ring-white">🏃</span>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-100 ring-2 ring-white">⚽</span>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 ring-2 ring-white">🎾</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Posti disponibili</p>
                  <p className="text-xl font-black text-slate-950"><span className="text-orange-600">2</span> /10</p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-[0_14px_35px_rgba(15,23,42,0.16)] backdrop-blur sm:px-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <MiniIcon type="pin" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Zona</p>
                  <p className="font-black text-slate-950">La tua zona</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-[-1.25rem] left-9 grid h-20 w-20 place-items-center rounded-full bg-orange-600 text-4xl text-white shadow-[0_14px_35px_rgba(234,88,12,0.32)] ring-4 ring-white">
              👟
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 sm:grid-cols-3">
        {trustItems.map((item) => (
          <div key={item.title} className="flex items-center gap-4">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${item.bg} ${item.color}`}>
              <MiniIcon type={item.icon} />
            </span>
            <div>
              <p className="font-black text-slate-950">{item.title}</p>
              <p className="text-sm text-slate-600 sm:text-base">{item.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10 space-y-6">
        <article className="relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white/82 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:flex sm:items-center sm:gap-8 sm:p-8">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-blue-50 text-6xl text-blue-600">🏃</div>
          <div className="mt-5 sm:mt-0">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Per chi vuole giocare</h2>
            <ul className="mt-4 space-y-2">
              <CheckItem>Trovi eventi vicini per sport, città e disponibilità.</CheckItem>
              <CheckItem>Capisci subito quanti posti mancano e quando si gioca.</CheckItem>
              <CheckItem>Ti proponi con pochi passaggi, senza chat infinite.</CheckItem>
              <CheckItem>Gestisci richieste, approvazioni e partecipazioni dal profilo.</CheckItem>
            </ul>
          </div>
          <div className="pointer-events-none absolute bottom-[-1.5rem] right-6 text-9xl opacity-[0.055] sm:text-[11rem]">🤾</div>
        </article>

        <article className="relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white/82 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:flex sm:items-center sm:gap-8 sm:p-8">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-orange-50 text-6xl text-orange-600">👥</div>
          <div className="mt-5 sm:mt-0">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Per circoli e organizzatori</h2>
            <ul className="mt-4 space-y-2">
              <CheckItem tone="orange">Pubblicizzi partite e attività con un link condivisibile.</CheckItem>
              <CheckItem tone="orange">Riduci campi vuoti e gruppi incompleti all&apos;ultimo momento.</CheckItem>
              <CheckItem tone="orange">Approvi le richieste e tieni sotto controllo i posti disponibili.</CheckItem>
              <CheckItem tone="orange">Rendi visibile il tuo circolo a sportivi già interessati.</CheckItem>
            </ul>
          </div>
          <div className="pointer-events-none absolute bottom-[-2rem] right-8 text-9xl opacity-[0.06] sm:text-[11rem]">⛳</div>
        </article>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Scegli il tuo sport <span className="text-orange-500">⚡</span>
          </h2>
          <a href="#eventi" className="hidden items-center gap-2 text-sm font-extrabold text-blue-600 sm:inline-flex">
            Vedi tutti gli sport
            <span aria-hidden="true">›</span>
          </a>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {sports.map((sport) => (
            <a
              key={sport.name}
              href={`#eventi`}
              className={`rounded-2xl bg-white p-4 text-center shadow-[0_16px_35px_rgba(15,23,42,0.07)] ring-1 transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.1)] ${
                sport.active ? "ring-blue-500" : "ring-slate-200"
              }`}
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-50 text-4xl shadow-inner">
                {sport.emoji}
              </div>
              <p className="mt-3 font-black text-slate-950">{sport.name}</p>
              <p className="mt-1 text-sm font-medium text-blue-600">{sport.events}</p>
            </a>
          ))}
        </div>
      </section>

      {error ? (
        <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      <section id="eventi" className="mt-12 scroll-mt-8 rounded-[1.75rem] border border-slate-200 bg-white/78 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-7">
        <div className="mb-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">
            Eventi disponibili
          </h2>

          <p className="mt-2 text-slate-600">
            Filtra gli eventi aperti e scegli dove unirti o cosa organizzare.
          </p>
        </div>

        <SearchEvents events={events ?? []} initialQuery={initialQuery} />
      </section>
    </main>
  );
}
