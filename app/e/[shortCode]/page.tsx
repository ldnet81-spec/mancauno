import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { createPublicClient } from "../../../lib/supabase/public";
import JoinEventButton from "./JoinEventButton";
import AutoJoinEvent from "./AutoJoinEvent";
import ShareEventButton from "./ShareEventButton";
import BrandHeader from "../../../components/BrandHeader";
import CancelEventButton from "./CancelEventButton";
import UpdateTotalSpotsForm from "./UpdateTotalSpotsForm";
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

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { shortCode } = await params;
  const supabase = createPublicClient();

  const { data: event } = await supabase
    .from("event_with_counts")
    .select("title, city, starts_at, remaining_spots, waitlisted_count, status")
    .eq("short_code", shortCode)
    .single();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!event) {
    return {
      title: "Evento non trovato • mancauno.it",
      description: "Questo evento non è disponibile.",
    };
  }

  const formattedDate = formatDateTimeItaly(event.starts_at);

  const remainingSpots = event.remaining_spots ?? 0;
  const waitlistedCount = event.waitlisted_count ?? 0;

  const title = `${event.title} • mancauno.it`;

  const description =
    event.status !== "active"
      ? "Questo evento non è più disponibile."
      : `${
          remainingSpots <= 0
            ? `Evento completo${
                waitlistedCount > 0
                  ? ` • ${waitlistedCount} ${
                      waitlistedCount === 1
                        ? "persona in coda"
                        : "persone in coda"
                }`
                  : ""
              }`
            : formatAvailabilityLabel(remainingSpots)
        } • ${formattedDate} • ${event.city}`;

  const ogImageUrl = `${siteUrl}/e/${shortCode}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/e/${shortCode}`,
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

  const { data: event, error } = await supabase
    .from("event_with_counts")
    .select("*")
    .eq("short_code", shortCode)
    .single();

  if (error || !event) {
    notFound();
  }

  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, city, bio, avatar_url, account_type, club_name, phone, created_at"
    )
    .eq("id", event.creator_id)
    .single();

  const { count: creatorEventsCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", event.creator_id);

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

  const isFull = remainingSpots <= 0;
  const isCreator = user?.id === event.creator_id;
  const isUnavailable = event.status !== "active";
  const availabilityLabel = isUnavailable
    ? "Evento non disponibile"
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
  const eventUrl = `${siteUrl}/e/${event.short_code}`;

  const mapsQuery = encodeURIComponent(
    `${event.location_name || ""} ${event.city || ""}`.trim()
  );

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 pb-36 pt-8">
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
          <h2 className="text-lg font-semibold">Evento non disponibile</h2>
          <p className="mt-2 text-gray-600">
            Questo evento è stato annullato o non è più attivo.
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

      <section className="mt-5 rounded-3xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold">Note</h2>
        <p className="mt-2 whitespace-pre-line text-gray-700">
          {event.notes || "Nessuna nota aggiunta dal creatore."}
        </p>
      </section>

      <section className="mt-5 rounded-3xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold">Organizzatore</h2>

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

              {creatorType === "Circolo" ? (
                <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold !text-white">
                  Club
                </span>
              ) : null}
            </div>

            {creatorProfile?.city ? (
              <p className="mt-1 text-sm text-gray-600">
                {creatorProfile.city}
              </p>
            ) : null}
          </div>
        </div>

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
              href={`/club/${event.creator_id}`}
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

      <section className="mt-5">
        <ShareEventButton title={event.title} url={eventUrl} />
      </section>

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
