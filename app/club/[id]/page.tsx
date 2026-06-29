import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppHeaderServer from "../../../components/AppHeaderServer";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { formatDateItaly, formatTimeItaly } from "../../../lib/date-time";
import FollowClubButton from "./FollowClubButton";
import ClubProBadge from "../../../components/ClubProBadge";
import { UUID_REGEX } from "../../../lib/slug";
import { isClubVerified } from "../../../lib/club-status";

type ClubPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    claim?: string;
  }>;
};

function getClubName(profile: any) {
  return profile.club_name || profile.display_name || "Club mancauno";
}

function getExternalHref(value: string | null) {
  if (!value) {
    return null;
  }

  return value.startsWith("http") ? value : `https://${value}`;
}

function getWhatsAppHref(phone: string | null) {
  if (!phone) {
    return null;
  }

  const normalized = phone.replace(/[^\d+]/g, "");
  const whatsappNumber = normalized.startsWith("+")
    ? normalized.replace("+", "")
    : normalized;

  if (!whatsappNumber) {
    return null;
  }

  return `https://wa.me/${whatsappNumber}`;
}

function formatSkillLevel(level: string | null | undefined) {
  if (level === "intermedio") {
    return "Intermedio";
  }

  if (level === "esperto") {
    return "Esperto";
  }

  return "Amatoriale";
}

export async function generateMetadata({
  params,
}: ClubPageProps): Promise<Metadata> {
  const { id } = await params;
  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    return {
      title: "Club mancauno",
    };
  }

  const lookupColumn = UUID_REGEX.test(id) ? "id" : "slug";

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select(
      "id, slug, display_name, club_name, city, bio, account_type, avatar_url, club_sports, claim_status, is_verified"
    )
    .eq(lookupColumn, id)
    .maybeSingle();

  if (!profile || profile.account_type !== "circolo") {
    return {
      title: "Club non trovato",
      robots: { index: false, follow: true },
    };
  }

  const clubName = getClubName(profile);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://mancauno.it";
  // Il canonical punta sempre allo slug se esiste, cosi le vecchie URL
  // con UUID si consolidano sulla nuova URL parlante.
  const canonicalParam = profile.slug || profile.id;
  const canonical = `/club/${canonicalParam}`;

  // Title ottimizzato per le ricerche locali: "{club} — {sport} a {citta}".
  const primarySport = profile.club_sports?.[0];
  let pageTitle = clubName;
  if (primarySport && profile.city) {
    pageTitle = `${clubName} — ${primarySport} a ${profile.city}`;
  } else if (profile.city) {
    pageTitle = `${clubName} — Club sportivo a ${profile.city}`;
  } else if (primarySport) {
    pageTitle = `${clubName} — ${primarySport}`;
  }

  const verified =
    Boolean(profile.is_verified) && profile.claim_status === "approved";

  const description =
    profile.bio ||
    `Scopri ${clubName}${
      profile.city ? ` a ${profile.city}` : ""
    }: sport disponibili, eventi collegati e attivita sportive nella zona.${
      verified ? "" : " Sei il gestore? Rivendica gratuitamente la scheda su MancaUno."
    }`;

  const ogImages = profile.avatar_url
    ? [{ url: profile.avatar_url as string, alt: clubName }]
    : [
        {
          url: `${siteUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: clubName,
        },
      ];

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: pageTitle,
      description,
      url: `${siteUrl}${canonical}`,
      siteName: "mancauno.it",
      locale: "it_IT",
      type: "profile",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: ogImages.map((image) => image.url),
    },
  };
}

export default async function ClubPage({
  params,
  searchParams,
}: ClubPageProps) {
  const { id } = await params;
  const { claim } = (await searchParams) ?? {};
  const adminSupabase = createAdminClient();
  const supabase = await createClient();

  if (!adminSupabase) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const lookupColumn = UUID_REGEX.test(id) ? "id" : "slug";

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select(
      "id, slug, display_name, city, bio, avatar_url, account_type, phone, club_name, club_address, club_whatsapp, club_email, club_website, club_instagram, club_sports, club_services, account_plan, claim_status, is_verified, owner_id"
    )
    .eq(lookupColumn, id)
    .maybeSingle();

  if (!profile || profile.account_type !== "circolo") {
    notFound();
  }

  // Vecchia URL con UUID → 301 alla URL parlante con slug (canonical SEO).
  if (lookupColumn === "id" && profile.slug && profile.slug !== id) {
    redirect(`/club/${profile.slug}`);
  }

  // Da qui in poi usiamo SEMPRE profile.id: il param di route puo' essere lo
  // slug, quindi confrontarlo con creator_id/club_id (che sono UUID) darebbe
  // zero risultati.
  const clubId = profile.id;

  const { data: events } = await adminSupabase
    .from("event_with_counts")
    .select("*")
    .eq("creator_id", clubId)
    .eq("status", "active")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(20);

  const clubName = getClubName(profile);
  const whatsappHref = getWhatsAppHref(profile.club_whatsapp || profile.phone);
  const websiteHref = getExternalHref(profile.club_website);
  const instagramHref = getExternalHref(profile.club_instagram);
  const isClubPro = profile.account_plan === "pro";

  // Query Maps: nome club + via + citta per il match piu preciso possibile.
  const mapsQuery = [clubName, profile.club_address, profile.city]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    mapsQuery
  )}`;
  const { count: followerCount } = await adminSupabase
    .from("club_followers")
    .select("club_id", { count: "exact", head: true })
    .eq("club_id", clubId);
  const { data: existingFollow } =
    user && user.id !== clubId
      ? await adminSupabase
          .from("club_followers")
          .select("club_id")
          .eq("club_id", clubId)
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };

  const verified = isClubVerified(profile);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://mancauno.it";
  // URL canonica del club (slug se disponibile): usata in JSON-LD e breadcrumb.
  const canonicalParam = profile.slug || profile.id;
  const clubUrl = `${siteUrl}/club/${canonicalParam}`;

  const externalLinks = [
    getExternalHref(profile.club_website),
    getExternalHref(profile.club_instagram),
  ].filter((value): value is string => Boolean(value));

  // Structured data schema.org per il club: aiuta Google a mostrare
  // snippet ricchi (foto, indirizzo, telefono) nelle SERP locali.
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsClub",
    "@id": clubUrl,
    name: clubName,
    url: clubUrl,
    description:
      profile.bio ||
      `${clubName}${profile.city ? ` a ${profile.city}` : ""} su mancauno.it.`,
    ...(profile.avatar_url ? { image: profile.avatar_url } : {}),
    ...(profile.city || profile.club_address
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: "IT",
            ...(profile.city ? { addressLocality: profile.city } : {}),
            ...(profile.club_address
              ? { streetAddress: profile.club_address }
              : {}),
          },
        }
      : {}),
    ...(profile.phone ? { telephone: profile.phone } : {}),
    ...(profile.club_email ? { email: profile.club_email } : {}),
    ...(externalLinks.length ? { sameAs: externalLinks } : {}),
    ...(profile.club_sports?.length ? { sport: profile.club_sports } : {}),
  };

  // Breadcrumb per le SERP: Home › Club › {nome club}.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Club",
        item: `${siteUrl}/club`,
      },
      { "@type": "ListItem", position: 3, name: clubName, item: clubUrl },
    ],
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-white px-6 py-8 text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <AppHeaderServer />

      {claim === "sent" ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-800 ring-1 ring-green-100">
          La richiesta di rivendicazione e stata inviata. Il team MancaUno
          verifichera i dati e ti contattera appena possibile.
        </div>
      ) : null}

      <section className="rounded-3xl border border-gray-200 p-6">
        <div className="grid gap-5 sm:grid-cols-[132px_1fr] sm:items-start">
          <div className="aspect-square w-32 overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 p-3">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={clubName}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white text-4xl font-semibold text-gray-400">
                {clubName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold !text-white">
                Club
              </span>
              {verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                    <path d="M12 2 4 5v6c0 5 3.4 9.3 8 10 4.6-.7 8-5 8-10V5l-8-3Zm-1.2 13.2L7.5 12l1.4-1.4 1.9 1.9 4-4L16.2 10l-5.4 5.2Z" />
                  </svg>
                  Club verificato
                </span>
              ) : (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                  Scheda informativa
                </span>
              )}
              {isClubPro ? <ClubProBadge compact /> : null}
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              {clubName}
            </h1>

            {isClubPro ? <ClubProBadge className="mt-4" /> : null}
          </div>
        </div>

          {profile.city || profile.club_address ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-gray-600 underline decoration-gray-300 underline-offset-4 transition hover:text-blue-600"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11Z" />
                <circle cx="12" cy="10" r="2.4" />
              </svg>
              <span>
                {[profile.city, profile.club_address]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </a>
          ) : null}

          {profile.bio ? (
            <p className="mt-5 leading-7 text-gray-700">{profile.bio}</p>
          ) : (
            <p className="mt-5 leading-7 text-gray-700">
              Questo club usa mancauno.it per pubblicare eventi sportivi e
              trovare partecipanti interessati.
            </p>
          )}

          {verified ? (
            <div className="mt-5 rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
              <p className="text-sm leading-6 text-blue-900">
                Questo club gestisce direttamente la propria scheda su MancaUno.
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
              <p className="text-sm leading-6 text-amber-900">
                Questa scheda e stata creata da MancaUno per aiutare gli
                sportivi a trovare club, eventi e attivita nella propria zona.
                Al momento non e ancora gestita direttamente dal club.
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-amber-900">
                Sei il gestore di questo club? Rivendica gratuitamente la scheda
                e trasformala in una pagina ufficiale.
              </p>
              <Link
                href={`/club/${canonicalParam}/rivendica`}
                className="mt-3 inline-flex rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-black !text-white transition hover:bg-amber-700"
              >
                Rivendica questo club
              </Link>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <FollowClubButton
              clubId={clubId}
              initialFollowing={Boolean(existingFollow)}
              isLoggedIn={Boolean(user)}
            />

            {profile.phone ? (
              <a
                href={`tel:${profile.phone}`}
                className="rounded-xl bg-black px-4 py-3 text-center font-semibold !text-white"
              >
                Chiama il club
              </a>
            ) : null}

            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-gray-300 px-4 py-3 text-center font-semibold text-black"
              >
                Scrivi su WhatsApp
              </a>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700 sm:grid-cols-2">
            {profile.club_email ? (
              <a href={`mailto:${profile.club_email}`}>
                Email: {profile.club_email}
              </a>
            ) : null}

            {websiteHref ? (
              <a href={websiteHref} target="_blank" rel="noreferrer">
                Sito web
              </a>
            ) : null}

            {instagramHref ? (
              <a href={instagramHref} target="_blank" rel="noreferrer">
                Instagram
              </a>
            ) : null}

            <span>{followerCount ?? 0} follower</span>
          </div>

          {profile.club_sports?.length ? (
            <div className="mt-6">
              <h2 className="font-semibold">Sport disponibili</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.club_sports.map((sport: string) => (
                  <span
                    key={sport}
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                  >
                    {sport}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {profile.club_services?.length ? (
            <div className="mt-6">
              <h2 className="font-semibold">Servizi</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.club_services.map((service: string) => (
                  <span
                    key={service}
                    className="rounded-full border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Eventi del club
            </h2>
            <p className="mt-2 text-gray-600">
              Partite, lezioni e attivita aperte alla partecipazione.
            </p>
          </div>

          <Link
            href={`/eventi/nuovo?club=${id}`}
            className="hidden rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-black sm:block"
          >
            Crea evento presso questo club
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="#eventi-club"
              className="rounded-xl bg-black px-4 py-3 text-center font-semibold !text-white"
            >
              Vedi eventi disponibili
            </a>
            <Link
              href={`/eventi/nuovo?club=${id}`}
              className="rounded-xl border border-gray-300 px-4 py-3 text-center font-semibold text-black"
            >
              Crea evento presso questo club
            </Link>
          </div>

          <div id="eventi-club" className="h-1" />

          {!events?.length ? (
            <div className="rounded-3xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold">
                Nessun evento disponibile
              </h3>
              <p className="mt-2 text-gray-600">
                Torna presto: qui compariranno i prossimi eventi pubblicati dal
                club.
              </p>
            </div>
          ) : (
            events.map((event: any) => (
              <Link
                key={event.id}
                href={`/e/${event.slug ?? event.short_code}`}
                className="block rounded-3xl border border-gray-200 p-5 text-black"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-3xl">{event.sport_emoji}</p>
                    <h3 className="mt-3 text-xl font-semibold">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-700">
                      {formatDateItaly(event.starts_at)} ·{" "}
                      {formatTimeItaly(event.starts_at)}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      {event.location_name}, {event.city}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        Livello {formatSkillLevel(event.skill_level)}
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-black px-3 py-1 text-xs font-semibold !text-white">
                    {event.remaining_spots > 0
                      ? `Mancano ${event.remaining_spots}`
                      : "Completo"}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
