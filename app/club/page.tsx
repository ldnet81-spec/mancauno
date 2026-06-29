import type { Metadata } from "next";
import Link from "next/link";
import AppHeaderServer from "../../components/AppHeaderServer";
import ClubProBadge from "../../components/ClubProBadge";
import { createAdminClient } from "../../lib/supabase/admin";
import { SPORTS } from "../../lib/sports";
import { isClubVerified } from "../../lib/club-status";

type ClubsPageProps = {
  searchParams: Promise<{
    city?: string;
    sport?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Tutti i club sportivi",
  description:
    "Esplora i circoli sportivi presenti su mancauno.it. Filtra per citta e per sport per trovare il club piu vicino a te o specializzato nella tua disciplina.",
  alternates: {
    canonical: "/club",
  },
  openGraph: {
    title: "Tutti i club sportivi su mancauno.it",
    description:
      "Esplora i circoli sportivi presenti su mancauno.it: filtra per citta e per sport.",
    url: "/club",
    siteName: "mancauno.it",
    locale: "it_IT",
    type: "website",
  },
};

type ClubRow = {
  id: string;
  slug: string | null;
  display_name: string | null;
  club_name: string | null;
  city: string | null;
  avatar_url: string | null;
  club_sports: string[] | null;
  bio: string | null;
  account_plan: string | null;
  created_at: string | null;
  claim_status: string | null;
  is_verified: boolean | null;
};

function getClubName(profile: ClubRow): string {
  return profile.club_name || profile.display_name || "Club mancauno";
}

export default async function ClubsListPage({ searchParams }: ClubsPageProps) {
  const params = await searchParams;
  const cityFilter = params.city?.trim() || "";
  const sportFilter = params.sport?.trim() || "";

  const adminSupabase = createAdminClient();

  let clubs: ClubRow[] = [];

  if (adminSupabase) {
    let query = adminSupabase
      .from("profiles")
      .select(
        "id, slug, display_name, club_name, city, avatar_url, club_sports, bio, account_plan, created_at, claim_status, is_verified"
      )
      .eq("account_type", "circolo")
      .is("banned_at", null)
      .order("account_plan", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);

    if (cityFilter) {
      query = query.ilike("city", `%${cityFilter}%`);
    }

    if (sportFilter) {
      query = query.contains("club_sports", [sportFilter]);
    }

    const { data } = await query;
    clubs = (data as ClubRow[] | null) ?? [];
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://mancauno.it";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListUnordered",
    numberOfItems: clubs.length,
    itemListElement: clubs.map((club, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SportsClub",
        name: getClubName(club),
        url: `${siteUrl}/club/${club.slug ?? club.id}`,
        ...(club.city
          ? {
              address: {
                "@type": "PostalAddress",
                addressLocality: club.city,
                addressCountry: "IT",
              },
            }
          : {}),
      },
    })),
  };

  const hasFilters = Boolean(cityFilter || sportFilter);
  const resultsLabel =
    clubs.length === 0
      ? "Nessun club trovato"
      : clubs.length === 1
        ? "1 club trovato"
        : `${clubs.length} club trovati`;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-28 pt-4 text-slate-950 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <AppHeaderServer />

      <section className="mb-8">
        <p className="text-sm font-black uppercase tracking-[0.06em] text-orange-600">
          Directory dei club
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Circoli sportivi su mancauno.it
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Esplora i club presenti sulla piattaforma. Filtra per citta e per
          sport per trovare quello piu vicino a te o specializzato nella tua
          disciplina.
        </p>
      </section>

      <form className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Citta</span>
            <input
              type="text"
              name="city"
              defaultValue={cityFilter}
              placeholder="Es. Milano, Roma, Bari"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Sport</span>
            <select
              name="sport"
              defaultValue={sportFilter}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600"
            >
              <option value="">Tutti gli sport</option>
              {SPORTS.map((sport) => (
                <option key={sport.label} value={sport.label}>
                  {sport.emoji} {sport.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-6 py-3 font-bold !text-white transition hover:bg-blue-700"
          >
            Filtra
          </button>
        </div>

        {hasFilters ? (
          <Link
            href="/club"
            className="mt-3 inline-block text-sm font-semibold text-slate-600 underline"
          >
            Pulisci filtri
          </Link>
        ) : null}
      </form>

      <p className="mb-6 text-sm font-semibold text-slate-500">
        {resultsLabel}
        {hasFilters && cityFilter && sportFilter
          ? ` per ${sportFilter} a ${cityFilter}`
          : hasFilters && cityFilter
            ? ` a ${cityFilter}`
            : hasFilters && sportFilter
              ? ` per ${sportFilter}`
              : ""}
      </p>

      {clubs.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-lg font-bold text-slate-700">
            Nessun club trovato
          </h2>
          <p className="mt-2 text-slate-600">
            Prova con un&apos;altra citta o un altro sport, oppure{" "}
            <Link
              href="/club"
              className="font-semibold underline decoration-slate-400 underline-offset-4"
            >
              visualizza tutti i club
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => {
            const clubName = getClubName(club);
            const isPro = club.account_plan === "pro";
            const verified = isClubVerified(club);

            return (
              <Link
                key={club.id}
                href={`/club/${club.slug ?? club.id}`}
                className={`group flex flex-col rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${
                  isPro
                    ? "border-orange-300 bg-gradient-to-br from-orange-50 via-white to-white ring-1 ring-orange-100"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-2xl font-black text-slate-400">
                    {club.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={club.avatar_url}
                        alt={clubName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      clubName.slice(0, 1).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isPro ? (
                        <ClubProBadge compact />
                      ) : (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-black !text-white">
                          Club
                        </span>
                      )}
                      {verified ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                          Verificato
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                          Scheda informativa
                        </span>
                      )}
                    </div>

                    <h2 className="mt-2 text-lg font-black text-slate-900 group-hover:underline">
                      {clubName}
                    </h2>

                    {club.city ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {club.city}
                      </p>
                    ) : null}
                  </div>
                </div>

                {club.club_sports?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {club.club_sports.slice(0, 5).map((sport: string) => (
                      <span
                        key={sport}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                      >
                        {sport}
                      </span>
                    ))}
                    {club.club_sports.length > 5 ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-400 ring-1 ring-slate-200">
                        +{club.club_sports.length - 5}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {club.bio ? (
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                    {club.bio}
                  </p>
                ) : null}

                <p className="mt-auto pt-4 text-sm font-bold text-blue-600 group-hover:text-blue-700">
                  Apri pagina club →
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
