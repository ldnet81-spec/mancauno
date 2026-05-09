import { createClient } from "../../lib/supabase/server";
import AppHeader from "../../components/AppHeader";
import Link from "next/link";
import { redirect } from "next/navigation";

type AdminPageProps = {
  searchParams: Promise<{
    q?: string;
    error?: string;
    banned?: string;
    unbanned?: string;
    event_deleted?: string;
    user_deleted?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const searchQuery = params.q?.trim() ?? "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, banned_at")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.banned_at) {
    redirect("/");
  }

  let usersQuery = supabase
    .from("profiles")
    .select("id, display_name, email, city, role, banned_at, created_at, account_type, club_name, phone")
    .order("created_at", { ascending: false })
    .limit(80);

  if (searchQuery) {
    usersQuery = usersQuery.or(
      `email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,club_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
    );
  }

  const { data: users } = await usersQuery;

  const { data: events } = await supabase
    .from("event_with_counts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: auditLogs } = await supabase
    .from("admin_actions")
    .select(
      `
      id,
      action,
      target_type,
      target_id,
      reason,
      created_at,
      profiles (
        display_name
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-white px-6 py-8 text-black">
      <AppHeader />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>

        <p className="mt-2 text-gray-600">
          Gestisci utenti, eventi e azioni amministrative.
        </p>
      </div>

      {params.error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}

      {params.banned ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
          Utente bannato.
        </div>
      ) : null}

      {params.unbanned ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
          Utente sbannato.
        </div>
      ) : null}

      {params.user_deleted ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
          Utente eliminato.
        </div>
      ) : null}

      {params.event_deleted ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
          Evento eliminato.
        </div>
      ) : null}

      <section className="mb-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Utenti</h2>
            <p className="mt-1 text-sm text-gray-600">
              Cerca utenti per email, nome, telefono o circolo.
            </p>
          </div>

          <form action="/admin" className="w-full md:w-96">
            <label className="block">
              <span className="text-sm font-medium text-black">
                Cerca utente
              </span>

              <div className="mt-2 flex gap-2">
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Email, nome o telefono"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                />

                <button
                  type="submit"
                  className="rounded-xl bg-black px-4 py-3 text-sm font-medium !text-white"
                >
                  Cerca
                </button>
              </div>
            </label>

            {searchQuery ? (
              <Link
                href="/admin"
                className="mt-2 inline-block text-sm text-gray-600 underline"
              >
                Pulisci ricerca
              </Link>
            ) : null}
          </form>
        </div>

        <div className="mt-4 space-y-4">
          {!users?.length ? (
            <p className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
              Nessun utente trovato.
            </p>
          ) : (
            users.map((item: any) => (
              <div
                key={item.id}
                className="rounded-3xl border border-gray-200 bg-white p-5 text-black"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {item.account_type === "circolo" && item.club_name
                        ? item.club_name
                        : item.display_name || "Utente senza nome"}
                    </p>

                    {item.account_type === "circolo" && item.display_name ? (
                      <p className="mt-1 text-sm text-gray-600">
                        Referente: {item.display_name}
                      </p>
                    ) : null}

                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {item.email || "Email non disponibile"}
                    </p>

                    {item.phone ? (
                      <p className="mt-1 text-sm text-gray-600">
                        Tel: {item.phone}
                      </p>
                    ) : null}

                    <p className="mt-1 text-sm text-gray-600">
                      {item.city || "Città non indicata"}
                    </p>

                    <p className="mt-1 break-all text-xs text-gray-400">
                      {item.id}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                        {item.role}
                      </span>

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                        {item.account_type === "circolo"
                          ? "Circolo"
                          : "Utente privato"}
                      </span>

                      {item.banned_at ? (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">
                          Bannato
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                          Attivo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full space-y-3 md:w-80">
                    {item.banned_at ? (
                      <form
                        method="post"
                        action={`/api/admin/users/${item.id}/unban`}
                        className="space-y-2"
                      >
                        <input
                          name="reason"
                          placeholder="Motivo sbannamento"
                          required
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-black"
                        />

                        <button
                          type="submit"
                          className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium !text-white"
                        >
                          Sbanna utente
                        </button>
                      </form>
                    ) : (
                      <form
                        method="post"
                        action={`/api/admin/users/${item.id}/ban`}
                        className="space-y-2"
                      >
                        <input
                          name="reason"
                          placeholder="Motivo ban"
                          required
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-black"
                        />

                        <button
                          type="submit"
                          className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700"
                        >
                          Banna utente
                        </button>
                      </form>
                    )}

                    {item.id !== user.id ? (
                      <form
                        method="post"
                        action={`/api/admin/users/${item.id}/delete`}
                        className="space-y-2 rounded-2xl border border-red-100 bg-red-50 p-3"
                      >
                        <input
                          name="reason"
                          placeholder="Motivo eliminazione utente"
                          required
                          className="w-full rounded-xl border border-red-200 bg-white px-4 py-2 text-sm text-black"
                        />

                        <button
                          type="submit"
                          className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-medium !text-white"
                        >
                          Elimina utente
                        </button>

                        <p className="text-xs text-red-700">
                          Azione definitiva: elimina account, eventi e
                          partecipazioni collegate.
                        </p>
                      </form>
                    ) : (
                      <p className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                        Non puoi eliminare il tuo account admin.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold">Eventi</h2>

        <div className="mt-4 space-y-4">
          {!events?.length ? (
            <p className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
              Nessun evento trovato.
            </p>
          ) : (
            events.map((event: any) => (
              <div
                key={event.id}
                className="rounded-3xl border border-gray-200 bg-white p-5 text-black"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-2xl">{event.sport_emoji}</p>

                    <h3 className="mt-2 font-semibold">{event.title}</h3>

                    <p className="mt-1 text-sm text-gray-600">
                      {event.location_name}, {event.city}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      Status: {event.status} · Mancano {event.remaining_spots} ·
                      Coda {event.waitlisted_count ?? 0}
                    </p>

                    <Link
                      href={`/e/${event.short_code}`}
                      className="mt-3 inline-block text-sm font-medium underline"
                    >
                      Apri evento
                    </Link>
                  </div>

                  <form
                    method="post"
                    action={`/api/admin/events/${event.id}/delete`}
                    className="w-full space-y-2 md:w-80"
                  >
                    <input
                      name="reason"
                      placeholder="Motivo eliminazione"
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-black"
                    />

                    <button
                      type="submit"
                      className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700"
                    >
                      Elimina evento
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Audit log</h2>

        <div className="mt-4 space-y-3">
          {!auditLogs?.length ? (
            <p className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
              Nessuna azione amministrativa.
            </p>
          ) : (
            auditLogs.map((log: any) => (
              <div
                key={log.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 text-black"
              >
                <p className="font-medium">{log.action}</p>

                <p className="mt-1 text-sm text-gray-600">
                  Target: {log.target_type} · {log.target_id}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Motivo: {log.reason}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  {new Intl.DateTimeFormat("it-IT", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(log.created_at))}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}