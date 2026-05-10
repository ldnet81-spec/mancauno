import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeaderServer from "../../../components/AppHeaderServer";
import { createAdminClient } from "../../../lib/supabase/admin";
import { formatDateItaly, formatTimeItaly } from "../../../lib/date-time";

type ClubPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getClubName(profile: any) {
  return profile.club_name || profile.display_name || "Club mancauno";
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

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("display_name, club_name, city, bio, account_type")
    .eq("id", id)
    .single();

  if (!profile || profile.account_type !== "circolo") {
    return {
      title: "Club non trovato",
    };
  }

  const clubName = getClubName(profile);

  return {
    title: clubName,
    description:
      profile.bio ||
      `Scopri eventi sportivi, contatti e attivita di ${clubName} su mancauno.it.`,
    alternates: {
      canonical: `/club/${id}`,
    },
  };
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { id } = await params;
  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    notFound();
  }

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select(
      "id, display_name, city, bio, avatar_url, account_type, phone, club_name"
    )
    .eq("id", id)
    .single();

  if (!profile || profile.account_type !== "circolo") {
    notFound();
  }

  const { data: events } = await adminSupabase
    .from("event_with_counts")
    .select("*")
    .eq("creator_id", id)
    .eq("status", "active")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(20);

  const clubName = getClubName(profile);
  const whatsappHref = getWhatsAppHref(profile.phone);

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-white px-6 py-8 text-black">
      <AppHeaderServer />

      <section className="overflow-hidden rounded-3xl border border-gray-200">
        <div className="h-36 bg-gray-100 sm:h-44">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={clubName}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold !text-white">
              Club
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              Pagina pubblica
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {clubName}
          </h1>

          {profile.city ? (
            <p className="mt-2 text-gray-600">{profile.city}</p>
          ) : null}

          {profile.bio ? (
            <p className="mt-5 leading-7 text-gray-700">{profile.bio}</p>
          ) : (
            <p className="mt-5 leading-7 text-gray-700">
              Questo club usa mancauno.it per pubblicare eventi sportivi e
              trovare partecipanti interessati.
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
        </div>
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
            href="/eventi/nuovo"
            className="hidden rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-black sm:block"
          >
            Crea evento
          </Link>
        </div>

        <div className="mt-5 space-y-3">
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
                href={`/e/${event.short_code}`}
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
