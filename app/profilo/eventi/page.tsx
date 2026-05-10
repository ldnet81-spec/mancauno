import { createClient } from "../../../lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeaderServer from "../../../components/AppHeaderServer";

type MyEventsPageProps = {
  searchParams: Promise<{
    approved?: string;
    rejected?: string;
    error?: string;
  }>;
};

function formatDate(date: string) {
  const startsAt = new Date(date);

  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(startsAt);
}

function getParticipationLabel(status: string) {
  if (status === "approved") {
    return "Partecipi";
  }

  if (status === "pending") {
    return "In attesa";
  }

  if (status === "waitlisted") {
    return "In coda";
  }

  if (status === "rejected") {
    return "Rifiutata";
  }

  if (status === "cancelled") {
    return "Cancellata";
  }

  return status;
}

function getAvailabilityBadge(remainingSpots: number) {
  if (remainingSpots <= 0) {
    return {
      label: "Completo",
      className: "bg-gray-100 text-gray-700",
    };
  }

  if (remainingSpots === 1) {
    return {
      label: "Ultimo posto",
      className: "bg-green-600 text-white",
    };
  }

  return {
    label: `Mancano ${remainingSpots} posti`,
    className: "bg-black text-white",
  };
}

export default async function MyEventsPage({
  searchParams,
}: MyEventsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const { data: organizedEvents } = await supabase
    .from("event_with_counts")
    .select("*")
    .eq("creator_id", user.id)
    .order("starts_at", { ascending: true });

  const { data: pendingRequests, error: pendingRequestsError } =
    await supabase.rpc("get_pending_requests_for_my_events");

  const { data: myParticipations, error: myParticipationsError } =
    await supabase.rpc("get_my_participations");

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-8">
      <AppHeaderServer />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          I miei eventi
        </h1>

        <p className="mt-2 text-gray-600">
          Gestisci gli eventi che hai creato e le richieste di partecipazione.
        </p>
      </div>

      {params.approved ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
          Richiesta accettata. Il partecipante è stato notificato.
        </div>
      ) : null}

      {params.rejected ? (
        <div className="mb-5 rounded-2xl bg-gray-100 p-4 text-sm text-gray-700">
          Richiesta rifiutata. Il partecipante è stato notificato.
        </div>
      ) : null}

      {params.error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      {pendingRequestsError ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {pendingRequestsError.message}
        </div>
      ) : null}

      {myParticipationsError ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {myParticipationsError.message}
        </div>
      ) : null}

      <section className="mb-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Richieste da approvare</h2>

          {pendingRequests?.length ? (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
              {pendingRequests.length}
            </span>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          {!pendingRequests?.length ? (
            <p className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-600">
              Non ci sono richieste in attesa.
            </p>
          ) : (
            pendingRequests.map((request: any) => (
              <div
                key={request.participation_id}
                className="rounded-2xl border border-gray-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 font-semibold">
                    {(request.participant_name || "U")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium">{request.participant_name}</p>

                    <p className="mt-1 text-sm text-gray-600">
                      Vuole partecipare a{" "}
                      <Link
                        href={`/e/${request.event_short_code}`}
                        className="font-medium text-black underline"
                      >
                        {request.event_title}
                      </Link>
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(request.requested_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <form
                    method="post"
                    action={`/api/participations/${request.participation_id}/approve`}
                  >
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                    >
                      Accetta
                    </button>
                  </form>

                  <form
                    method="post"
                    action={`/api/participations/${request.participation_id}/reject`}
                  >
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
                    >
                      Rifiuta
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">Organizzati</h2>

        <div className="mt-4 space-y-3">
          {!organizedEvents?.length ? (
            <p className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-600">
              Non hai ancora creato eventi.
            </p>
          ) : (
            organizedEvents.map((event: any) => {
              const availabilityBadge = getAvailabilityBadge(
                event.remaining_spots
              );

              return (
                <Link
                  key={event.id}
                  href={`/e/${event.short_code}`}
                  className="block rounded-2xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-2xl">{event.sport_emoji}</p>

                      <h3 className="mt-2 font-semibold">{event.title}</h3>

                      <p className="mt-1 text-sm text-gray-600">
                        {event.location_name}, {event.city}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(event.starts_at)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${availabilityBadge.className}`}
                    >
                      {availabilityBadge.label}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Partecipo</h2>

        <div className="mt-4 space-y-3">
          {!myParticipations?.length ? (
            <p className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-600">
              Non partecipi ancora a eventi.
            </p>
          ) : (
            myParticipations.map((participation: any) => (
              <Link
                key={participation.participation_id}
                href={`/e/${participation.event_short_code}`}
                className="block rounded-2xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl">
                      {participation.event_sport_emoji}
                    </p>

                    <h3 className="mt-2 font-semibold">
                      {participation.event_title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      {participation.event_location_name},{" "}
                      {participation.event_city}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(participation.event_starts_at)}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {getParticipationLabel(
                      participation.participation_status
                    )}
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
