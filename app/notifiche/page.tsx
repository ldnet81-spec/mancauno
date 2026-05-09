import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import AppHeader from "../../components/AppHeader";


export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(
      `
      id,
      title,
      body,
      type,
      read_at,
      created_at,
      event_id,
      participation_id
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (notifications?.length) {
    await supabase
      .from("notifications")
      .update({
        read_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .is("read_at", null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-8">
      
      
      <div className="mb-8">
        <AppHeader />

        <h1 className="mt-8 text-3xl font-semibold tracking-tight">
          Notifiche
        </h1>

        <p className="mt-2 text-gray-600">
          Richieste, conferme e aggiornamenti sui tuoi eventi.
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      <section className="space-y-3">
        {!notifications?.length ? (
          <div className="rounded-3xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Nessuna notifica</h2>
            <p className="mt-2 text-gray-600">
              Qui vedrai richieste di partecipazione e aggiornamenti.
            </p>
          </div>
        ) : (
          notifications.map((notification: any) => {
            const href =
              notification.type === "join_pending"
                ? "/profilo/eventi"
                : "/profilo/eventi";

            return (
              <Link
                key={notification.id}
                href={href}
                className={`block rounded-3xl border p-5 ${
                  notification.read_at
                    ? "border-gray-200 bg-white"
                    : "border-black bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{notification.title}</h2>

                    <p className="mt-1 text-sm text-gray-600">
                      {notification.body}
                    </p>

                    <p className="mt-3 text-xs text-gray-400">
                      {new Intl.DateTimeFormat("it-IT", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(notification.created_at))}
                    </p>
                  </div>

                  {!notification.read_at ? (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                  ) : null}
                </div>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}