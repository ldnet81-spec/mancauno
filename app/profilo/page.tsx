import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import BrandHeader from "../../components/BrandHeader";
import ProfileForm from "./ProfileForm";
import LogoutButton from "./LogoutButton";

export default async function ProfiloPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, city, bio, avatar_url, role, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/quick-signup");
  }

  const { count: organizedCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", user.id);

  const { data: myParticipationsForCount } = await supabase.rpc(
  "get_my_participations"
);

const participationCount =
  myParticipationsForCount?.filter((item: any) =>
    ["approved", "pending"].includes(item.participation_status)
  ).length ?? 0;

  const { count: unreadNotificationsCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-8">
      <div className="mb-8">
        <BrandHeader />

        <h1 className="mt-8 text-3xl font-semibold tracking-tight">
          Profilo
        </h1>

        <p className="mt-2 text-gray-600">
          Gestisci le informazioni visibili quando partecipi agli eventi.
        </p>
      </div>

      <section className="mb-6 rounded-3xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl font-semibold">
            {(profile.display_name || user.email || "U")
              .slice(0, 1)
              .toUpperCase()}
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              {profile.display_name || "Utente mancauno"}
            </h2>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-2xl font-semibold">{organizedCount ?? 0}</p>
            <p className="mt-1 text-sm text-gray-600">Organizzati</p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-2xl font-semibold">
              {participationCount ?? 0}
            </p>
            <p className="mt-1 text-sm text-gray-600">Partecipazioni</p>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-3xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Scorciatoie</h2>

        <div className="mt-5 space-y-3">
          <Link
            href="/profilo/eventi"
            className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 font-medium"
          >
            <span>I miei eventi</span>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            href="/notifiche"
            className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 font-medium"
          >
            <span>Notifiche</span>

            {unreadNotificationsCount ? (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                {unreadNotificationsCount}
              </span>
            ) : (
              <span className="text-gray-400">→</span>
            )}
          </Link>
        </div>
      </section>

      <section className="mb-6 rounded-3xl border border-gray-200 p-6">
        <h2 className="mb-5 text-xl font-semibold">I tuoi dati</h2>

        <ProfileForm
          profile={{
            id: profile.id,
            display_name: profile.display_name,
            city: profile.city,
            bio: profile.bio,
          }}
        />
      </section>

      <section className="rounded-3xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Esci da questo dispositivo.
        </p>

        <div className="mt-5">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}