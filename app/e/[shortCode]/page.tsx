import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../../../lib/supabase/server";
import { createPublicClient } from "../../../lib/supabase/public";
import { createAdminClient } from "../../../lib/supabase/admin";

// Resolve l'evento sia da slug (URL parlanti nuovi) sia da short_code
// (legacy, ancora in giro nei link condivisi). Restituisce sempre il
// short_code reale (necessario per query sulla view event_with_counts)
// e lo slug se presente (per costruire la URL canonical).
async function resolveEventRouteParam(
  supabaseClient: SupabaseClient,
  param: string
): Promise<{ shortCode: string; slug: string | null } | null> {
  const lookupColumn = param.includes("-") ? "slug" : "short_code";

  const { data: row } = await supabaseClient
    .from("events")
    .select("short_code, slug")
    .eq(lookupColumn, param)
    .maybeSingle();

  if (row?.short_code) {
    return { shortCode: row.short_code, slug: row.slug ?? null };
  }

  // Fallback sull'altra colonna (raro: short_code che contiene un trattino,
  // o param non-slug che invece e uno slug senza trattino).
  const otherColumn = lookupColumn === "slug" ? "short_code" : "slug";
  const { data: fallbackRow } = await supabaseClient
    .from("events")
    .select("short_code, slug")
    .eq(otherColumn, param)
    .maybeSingle();

  if (fallbackRow?.short_code) {
    return { shortCode: fallbackRow.short_code, slug: fallbackRow.slug ?? null };
  }

  return null;
}
import JoinEventButton from "./JoinEventButton";
import AutoJoinEvent from "./AutoJoinEvent";
import ShareEventButton from "./ShareEventButton";
import BrandHeader from "../../../components/BrandHeader";
import CancelEventButton from "./CancelEventButton";
import UpdateTotalSpotsForm from "./UpdateTotalSpotsForm";
import ClubProBadge from "../../../components/ClubProBadge";
import PrivatePlusBadge from "../../../components/PrivatePlusBadge";
import CancelParticipationButton from "./CancelParticipationButton";
import Link from "next/link";
import {
  formatDateItaly,
  formatDateTimeItaly,
  formatTimeItaly,
} from "../../../lib/date-time";

type EventPageProps = {
  params: Promise<{
    shortCode: string;
  }>;
};

function formatAvailabilityLabel(remainingSpots: number) {
  if (remainingSpots <= 0) {
    return "Evento completo";
  }

  if (remainingSpots === 1) {
    return "Ultimo posto disponibile";
  }

  return `Mancano ${remainingSpots} posti disponibili`;
}

// Un evento e considerato "passato" 24 ore dopo l'orario di inizio:
// finestra di tolleranza per chi cerca info durante o subito dopo l'evento.
const EVENT_PAST_GRACE_MS = 24 * 60 * 60 * 1000;

function isEventPast(startsAt: string | null | undefined): boolean {
  if (!startsAt) {
    return false;
  }
  const startTime = new Date(startsAt).getTime();
  return (
    Number.isFinite(startTime) && Date.now() - startTime > EVENT_PAST_GRACE_MS
  );
}

function getCreatorName(profile: any, event: any) {
  if (profile?.account_type === "circolo" && profile.club_name) {
    return profile.club_name;
  }

  if (event.creator_account_type === "circolo" && event.creator_club_name) {
    return event.creator_club_name;
  }

  return (
    profile?.display_name ||
    event.creator_display_name ||
    "Organizzatore"
  );
}

function getWhatsAppHref(phone: string | null | undefined) {
  if (!phone) {
    return null;
  }

  const normalized = phone.replace(/[^\d+]/g, "");
  const whatsappNumber = normalized.startsWith("+")
    ? normalized.replace("+", "")
    : normalized;

  return whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;
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

function formatParticipationStatus(status: string | null | undefined) {
  if (status === "approved") {
    return "Confermato";
  }

  if (status === "pending") {
    return "Da approvare";
  }

  if (status === "waitlisted") {
    return "In coda";
  }

  if (status === "rejected") {
    return "Rifiutato";
  }

  if (status === "cancelled") {
    return "Cancellato";
  }

  return "Richiesta";
}

function getParticipationStatusClassName(status: string | null | undefined) {
  if (status === "approved") {
    return "bg-green-50 text-green-700";
  }

  if (status === "pending") {
    return "bg-orange-50 text-orange-700";
  }

  if (status === "waitlisted") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-gray-100 text-gray-700";
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { shortCode } = await params;
  const supabase = createPublicClient();

  const resolved = await resolveEventRouteParam(supabase, shortCode);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!resolved) {
    return {
      title: "Evento non trovato - mancauno.it",
      description: "Questo evento non e disponibile.",
    };
  }

  const { data: event } = await supabase
    .from("event_with_counts")
    .select(
      "title, sport, city, starts_at, remaining_spots, waitlisted_count, status"
    )
    .eq("short_code", resolved.shortCode)
    .single();

  if (!event) {
    return {
      title: "Evento non trovato - mancauno.it",
      description: "Questo evento non e disponibile.",
    };
  }

  const canonicalParam = resolved.slug || resolved.shortCode;

  const formattedDate = formatDateTimeItaly(event.starts_at);

  const remainingSpots = event.remaining_spots ?? 0;
  const waitlistedCount = event.waitlisted_count ?? 0;
  const sportLabel = event.sport || "giocare";
  const cityLabel = event.city || "la tua zona";

  const isCancelled = event.status !== "active";
  const isPast = isEventPast(event.starts_at);
  const shouldNoIndex = isCancelled || isPast;

  const title = `Manca uno per ${sportLabel} a ${cityLabel}`;

  const description = isCancelled
    ? "Questo evento non e piu disponibile."
    : isPast
      ? `Evento sportivo a ${cityLabel} svolto il ${formattedDate}.`
      : `Unisciti all'evento sportivo su mancauno.it. ${
          remainingSpots <= 0
            ? `Evento completo${
                waitlistedCount > 0
                  ? `, ${waitlistedCount} ${
                      waitlistedCount === 1
                        ? "persona in coda"
                        : "persone in coda"
                    }`
                  : ""
              }.`
            : remainingSpots === 1
              ? "Manca 1 posto."
              : `Mancano ${remainingSpots} posti.`
        } ${cityLabel} - ${formattedDate}`;

  // OG image: il route handler /e/[shortCode]/opengraph-image conosce gia
  // gli short_code legacy, lo usiamo invariato per generare l'immagine.
  const ogImageUrl = `${siteUrl}/e/${resolved.shortCode}/opengraph-image`;

  return {
    title,
    description,
    alternates: {
      canonical: `/e/${canonicalParam}`,
    },
    ...(shouldNoIndex && {
      robots: { index: false, follow: true },
    }),
    openGraph: {
      title,
      description,
      url: `${siteUrl}/e/${canonicalParam}`,
      siteName: "mancauno.it",
      locale: "it_IT",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { shortCode } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolved = await resolveEventRouteParam(supabase, shortCode);
  if (!resolved) {
    notFound();
  }

  const { data: event, error } = await supabase
    .from("event_with_counts")
    .select("*")
    .eq("short_code", resolved.shortCode)
    .single();

  if (error || !event) {
    notFound();
  }

  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select(
      "id, slug, display_name, city, bio, avatar_url, account_type, account_plan, club_name, phone, created_at"
    )
    .eq("id", event.creator_id)
    .single();

  // Conteggio totale eventi del creator: usa il client admin per bypassare la
  // RLS, altrimenti per un visitatore anonimo (o per il creator stesso se la
  // policy e restrittiva) verrebbero contati solo gli eventi pubblicamente
  // visibili e il totale risulterebbe sottostimato.
  const adminSupabaseForCount = createAdminClient();
  const { count: creatorEventsCount } = adminSupabaseForCount
    ? await adminSupabaseForCount
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", event.creator_id)
    : { count: 0 };

  let currentParticipationStatus: string | null = null;

  if (user) {
    const { data: status } = await supabase.rpc(
      "get_my_event_participation_status",
      {
        p_event_id: event.id,
      }
    );

    currentParticipationStatus = status ?? null;
  }

  const formattedDate = formatDateItaly(event.starts_at);
  const formattedTime = formatTimeItaly(event.starts_at);

  const remainingSpots = event.remaining_spots ?? 0;
  const waitlistedCount = event.waitlisted_count ?? 0;
  const confirmedCount = event.confirmed_count ?? 0;
  const creatorName = getCreatorName(creatorProfile, event);
  const creatorType =
    creatorProfile?.account_type === "circolo" ||
    event.creator_account_type === "circolo"
      ? "Circolo"
      : "Organizzatore";
  const creatorWhatsAppHref =
    creatorType === "Circolo" ? getWhatsAppHref(creatorProfile?.phone) : null;
  const creatorIsClubPro =
    creatorType === "Circolo" && creatorProfile?.account_plan === "pro";
  const creatorIsPrivatePlus =
    creatorType !== "Circolo" && creatorProfile?.account_plan === "pro";

  const isFull = remainingSpots <= 0;
  const isCreator = user?.id === event.creator_id;
  const isCancelled = event.status !== "active";
  const isPast = isEventPast(event.starts_at);
  const isUnavailable = isCancelled || isPast;
  let privateParticipants: any[] = [];

  if (isCreator) {
    const adminSupabase = createAdminClient();

    if (adminSupabase) {
      const { data: participations } = await adminSupabase
        .from("participations")
        .select("id, user_id, status, created_at")
        .eq("event_id", event.id)
        .order("created_at", { ascending: true });

      const participantIds =
        participations
          ?.map((participation: any) => participation.user_id)
          .filter(Boolean) ?? [];

      const { data: participantProfiles } = participantIds.length
        ? await adminSupabase
            .from("profiles")
            .select(
              "id, display_name, email, phone, city, account_type, club_name"
            )
            .in("id", participantIds)
        : { data: [] };

      privateParticipants =
        participations?.map((participation: any) => {
          const profile = participantProfiles?.find(
            (item: any) => item.id === participation.user_id
          );

          return {
            ...participation,
            profile,
          };
        }) ?? [];
    }
  }
  const availabilityLabel = isCancelled
    ? "Evento non disponibile"
    : isPast
      ? "Evento concluso"
      : formatAvailabilityLabel(remainingSpots);
  const availabilityClassName = isUnavailable
    ? "bg-gray-100 text-gray-700"
    : isFull
      ? "bg-gray-100 text-gray-700"
      : remainingSpots === 1
        ? "bg-green-600 text-white"
        : "bg-black text-white";

  const canCancelParticipation =
    !isCreator &&
    event.status === "active" &&
    ["approved", "pending", "waitlisted"].includes(
      currentParticipationStatus ?? ""
    );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  // URL canonica: usiamo lo slug parlante se esiste, altrimenti il short_code.
  const eventUrl = `${siteUrl}/e/${resolved.slug || resolved.shortCode}`;

  const mapsQuery = encodeURIComponent(
    `${event.location_name || ""} ${event.city || ""}`.trim()
  );

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  // Structured data schema.org per l'evento: permette a Google di mostrare
  // rich result (data, sede, organizzatore) e ai social di capirne la natura.
  const eventJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: event.title,
    description:
      event.notes ||
      `${event.sport || "Evento sportivo"}${
        event.city ? ` a ${event.city}` : ""
      } su mancauno.it.`,
    startDate: event.starts_at,
    url: eventUrl,
    eventStatus: isCancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(event.sport ? { sport: event.sport } : {}),
    location: {
      "@type": "Place",
      name: event.location_name || event.city || "Sede da definire",
      ...(event.city || event.location_name
        ? {
            address: {
              "@type": "PostalAddress",
              addressCountry: "IT",
              ...(event.city ? { addressLocality: event.city } : {}),
              ...(event.location_name
                ? { streetAddress: event.location_name }
                : {}),
            },
          }
        : {}),
    },
    organizer: {
      "@type": creatorType === "Circolo" ? "SportsClub" : "Person",
      name: creatorName,
      ...(creatorType === "Circolo"
        ? {
            url: `${siteUrl}/club/${
              creatorProfile?.slug ?? event.creator_id
            }`,
          }
        : {}),
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability:
        remainingSpots > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      url: eventUrl,
      validFrom: event.starts_at,
    },
    ...(event.total_spots
      ? { maximumAttendeeCapacity: event.total_spots }
      : {}),
  };

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 pb-36 pt-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

     <div className="mb-6 flex items-center justify-between gap-4">
  <BrandHeader />

  <Link
    href="/"
    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800"
  >
    Home
  </Link>
</div>

      <AutoJoinEvent
        shortCode={event.short_code}
        isUnavailable={isUnavailable}
      />

      <section className="rounded-3xl border border-gray-200 p-6">
        <div className="text-6xl">{event.sport_emoji}</div>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          {event.title}
        </h1>

        <div
          className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-medium ${availabilityClassName}`}
        >
          {availabilityLabel}
        </div>

        {waitlistedCount > 0 ? (
          <div className="mt-3 inline-flex rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
            {waitlistedCount}{" "}
            {waitlistedCount === 1 ? "persona in coda" : "persone in coda"}
          </div>
        ) : null}

        <div className="mt-6 space-y-3 text-gray-700">
          <p>
            <span className="font-medium text-black">Quando</span>
            <br />
            {formattedDate} · {formattedTime}
          </p>

          <p>
            <span className="font-medium text-black">Dove</span>
            <br />
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-gray-300 underline-offset-4"
            >
              {event.location_name}, {event.city}
            </a>
          </p>

          <p>
            <span className="font-medium text-black">Partecipazione</span>
            <br />
            {event.entry_type === "open"
              ? "Ingresso libero"
              : "Su autorizzazione"}
          </p>

          <p>
            <span className="font-medium text-black">Livello</span>
            <br />
            {formatSkillLevel(event.skill_level)}
          </p>

          <p>
            <span className="font-medium text-black">Partecipanti</span>
            <br />
            {confirmedCount} su {event.total_spots} confermati
          </p>
        </div>
      </section>

      {isUnavailable ? (
        <section className="mt-5 rounded-3xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold">
            {isCancelled ? "Evento non disponibile" : "Evento concluso"}
          </h2>
          <p className="mt-2 text-gray-600">
            {isCancelled
              ? "Questo evento è stato annullato o non è più attivo."
              : `Questo evento si è già svolto il ${formattedDate} alle ${formattedTime}.`}
          </p>
        </section>
      ) : null}

      {!isUnavailable && isFull ? (
        <section className="mt-5 rounded-3xl border border-orange-100 bg-orange-50 p-6">
          <h2 className="text-lg font-semibold text-orange-700">
            Evento completo
          </h2>

          <p className="mt-2 text-sm text-orange-800">
            I posti disponibili sono terminati. Puoi comunque metterti in coda:
            se si libera un posto, l’organizzatore potrà contattarti o
            accettarti.
          </p>

          {waitlistedCount > 0 ? (
            <p className="mt-3 text-sm font-medium text-orange-900">
              Al momento ci sono{" "}
              {waitlistedCount === 1
                ? "1 persona in coda."
                : `${waitlistedCount} persone in coda.`}
            </p>
          ) : (
            <p className="mt-3 text-sm font-medium text-orange-900">
              Al momento non c’è ancora nessuno in coda.
            </p>
          )}
        </section>
      ) : null}

      <div className="mt-5">
        <ShareEventButton
          title={event.title}
          sport={event.sport}
          sportEmoji={event.sport_emoji}
          city={event.city}
          formattedDate={formattedDate}
          formattedTime={formattedTime}
          remainingSpots={remainingSpots}
          url={eventUrl}
        />
      </div>

      <section className="mt-5 rounded-3xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold">Note</h2>
        <p className="mt-2 whitespace-pre-line text-gray-700">
          {event.notes || "Nessuna nota aggiunta dal creatore."}
        </p>
      </section>

      <section className="mt-5 rounded-3xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold">Organizzatore</h2>

        {creatorType === "Circolo" ? (
          <Link
            href={`/club/${creatorProfile?.slug ?? event.creator_id}`}
            aria-label={`Vai alla pagina del club ${creatorName}`}
            className="group mt-4 -mx-2 flex items-start gap-4 rounded-2xl px-2 py-2 transition hover:bg-gray-50"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-xl font-semibold">
              {creatorProfile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={creatorProfile.avatar_url}
                  alt={creatorName}
                  className="h-full w-full object-cover"
                />
              ) : (
                creatorName.slice(0, 1).toUpperCase()
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-black group-hover:underline">
                {creatorName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-600">{creatorType}</p>
                <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold !text-white">
                  Club
                </span>
                {creatorIsClubPro ? <ClubProBadge compact /> : null}
              </div>

              {creatorProfile?.city ? (
                <p className="mt-1 text-sm text-gray-600">
                  {creatorProfile.city}
                </p>
              ) : null}

              <p className="mt-2 text-xs font-semibold text-blue-600">
                Apri pagina club →
              </p>
            </div>

            <span
              aria-hidden
              className="self-center text-3xl text-gray-300 transition group-hover:text-blue-600"
            >
              ›
            </span>
          </Link>
        ) : (
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-xl font-semibold">
              {creatorProfile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={creatorProfile.avatar_url}
                  alt={creatorName}
                  className="h-full w-full object-cover"
                />
              ) : (
                creatorName.slice(0, 1).toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-black">{creatorName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-600">{creatorType}</p>
                {creatorIsPrivatePlus ? <PrivatePlusBadge compact /> : null}
              </div>

              {creatorProfile?.city ? (
                <p className="mt-1 text-sm text-gray-600">
                  {creatorProfile.city}
                </p>
              ) : null}
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-2xl font-semibold">
              {creatorEventsCount ?? 0}
            </p>
            <p className="mt-1 text-sm text-gray-600">Eventi creati</p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-2xl font-semibold">{confirmedCount}</p>
            <p className="mt-1 text-sm text-gray-600">Partecipanti qui</p>
          </div>
        </div>

        {creatorProfile?.bio ? (
          <p className="mt-4 whitespace-pre-line text-sm text-gray-700">
            {creatorProfile.bio}
          </p>
        ) : null}

        {creatorType === "Circolo" ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/club/${creatorProfile?.slug ?? event.creator_id}`}
              className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-black"
            >
              Vedi pagina club
            </Link>

            {creatorWhatsAppHref ? (
              <a
                href={creatorWhatsAppHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold !text-white"
              >
                WhatsApp club
              </a>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
            I contatti personali non sono pubblici nella pagina evento. Usa la
            richiesta di partecipazione per far sapere all'organizzatore che
            vuoi unirti.
          </p>
        )}
      </section>

      {isCreator && event.status === "active" ? (
        <section className="mt-5 rounded-3xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold">Gestione evento</h2>

          <p className="mt-2 text-sm text-gray-600">
            Sei il creatore di questo evento. Puoi modificare i posti
            disponibili o annullare l’evento.
          </p>

          <div className="mt-5">
            <UpdateTotalSpotsForm
              eventId={event.id}
              initialTotalSpots={event.total_spots}
              confirmedCount={confirmedCount}
            />
          </div>

          <div className="mt-5 border-t border-gray-100 pt-5">
            <CancelEventButton eventId={event.id} />
          </div>
        </section>
      ) : null}

      {isCreator ? (
        <section className="mt-5 rounded-3xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                Partecipanti del tuo evento
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Questo elenco e visibile solo a te come organizzatore.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-black px-3 py-1 text-xs font-semibold !text-white">
              {privateParticipants.length}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {!privateParticipants.length ? (
              <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                Non ci sono ancora richieste o partecipanti per questo evento.
              </p>
            ) : (
              privateParticipants.map((participation: any) => {
                const profile = participation.profile;
                const participantName =
                  profile?.account_type === "circolo" && profile?.club_name
                    ? profile.club_name
                    : profile?.display_name || "Partecipante";

                return (
                  <div
                    key={participation.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-black">
                          {participantName}
                        </p>

                        {profile?.city ? (
                          <p className="mt-1 text-sm text-gray-600">
                            {profile.city}
                          </p>
                        ) : null}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getParticipationStatusClassName(
                          participation.status
                        )}`}
                      >
                        {formatParticipationStatus(participation.status)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      {profile?.email ? (
                        <p>
                          Email:{" "}
                          <a
                            href={`mailto:${profile.email}`}
                            className="underline decoration-gray-300 underline-offset-4"
                          >
                            {profile.email}
                          </a>
                        </p>
                      ) : null}

                      {profile?.phone ? (
                        <p>
                          Telefono:{" "}
                          <a
                            href={`tel:${profile.phone}`}
                            className="underline decoration-gray-300 underline-offset-4"
                          >
                            {profile.phone}
                          </a>
                        </p>
                      ) : null}

                      <p className="text-xs text-gray-400">
                        Richiesta: {formatDateTimeItaly(participation.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-4">
        <div className="mx-auto max-w-md">
          {canCancelParticipation ? (
            <CancelParticipationButton eventId={event.id} />
          ) : (
            <JoinEventButton
              shortCode={event.short_code}
              isFull={isFull}
              isUnavailable={isUnavailable}
              initialStatus={currentParticipationStatus}
            />
          )}
        </div>
      </div>
    </main>
  );
}
