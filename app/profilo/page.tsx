import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import BrandHeader from "../../components/BrandHeader";
import ProfileForm from "./ProfileForm";
import LogoutButton from "./LogoutButton";
import AppHeaderServer from "../../components/AppHeaderServer";
import GdprRightsForm from "./GdprRightsForm";

type ProfiloPageProps = {
  searchParams: Promise<{
    gdpr?: string;
    gdpr_error?: string;
  }>;
};

export default async function ProfiloPage({ searchParams }: ProfiloPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, city, bio, avatar_url, role, created_at, account_type, phone, club_name")
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
      <AppHeaderServer />
      <div className="mb-8">
      

        <h1 className="mt-8 text-3xl font-semibold tracking-tight">
          Profilo
        </h1>

        <p className="mt-2 text-gray-600">
          Gestisci le informazioni visibili quando partecipi agli eventi.
        </p>
      </div>

      <section className="mb-6 rounded-3xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-2xl font-semibold">
  {profile.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={profile.avatar_url}
      alt="Foto profilo"
      className="h-full w-full object-cover"
    />
  ) : (
    (profile.display_name || user.email || "U")
      .slice(0, 1)
      .toUpperCase()
  )}
</div>
{profile.account_type === "circolo" && profile.club_name ? (
  <p className="mt-1 text-sm font-medium text-black">
    {profile.club_name}
  </p>
) : null}

<p className="mt-1 text-xs text-gray-500">
  {profile.account_type === "circolo" ? "Circolo" : "Utente privato"}
</p>

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

        <div className="mb-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
          Nome, foto, citta e bio possono aiutare gli altri utenti a capire chi
          organizza o partecipa. Il telefono resta un dato di contatto e non
          viene mostrato pubblicamente nella scheda evento.
        </div>

        <ProfileForm
  profile={{
    id: profile.id,
    display_name: profile.display_name,
    city: profile.city,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    account_type: profile.account_type,
    phone: profile.phone,
    club_name: profile.club_name,
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

      <section className="mt-6 rounded-3xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold">Privacy e diritti GDPR</h2>

        <p className="mt-2 text-sm text-gray-600">
          Puoi esercitare i diritti previsti dal GDPR o richiedere la
          cancellazione dell'account direttamente da qui.
        </p>

        {params.gdpr ? (
          <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
            {params.gdpr}
          </div>
        ) : null}

        {params.gdpr_error ? (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {params.gdpr_error}
          </div>
        ) : null}

        <div className="mt-5">
          <GdprRightsForm />
        </div>
      </section>
    </main>
  );
}
