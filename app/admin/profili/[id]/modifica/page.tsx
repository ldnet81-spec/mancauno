import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import AppHeaderServer from "../../../../../components/AppHeaderServer";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { SPORTS } from "../../../../../lib/sports";
import { CLUB_SERVICES } from "../../../../../lib/club-services";

type AdminEditProfileProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
};

const clubSports = SPORTS.filter((sport) => sport.label !== "Altro evento");

export default async function AdminEditProfilePage({
  params,
  searchParams,
}: AdminEditProfileProps) {
  const { id } = await params;
  const { updated, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, banned_at")
    .eq("id", user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin" || adminProfile.banned_at) {
    redirect("/");
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    notFound();
  }

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select(
      "id, slug, email, avatar_url, display_name, city, phone, bio, account_type, account_plan, club_name, club_address, club_whatsapp, club_email, club_website, club_instagram, club_sports, club_services, claim_status, is_verified, owner_id"
    )
    .eq("id", id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const isCircolo = profile.account_type === "circolo";
  const selectedSports: string[] = profile.club_sports ?? [];
  const selectedServices: string[] = profile.club_services ?? [];
  const backSection = isCircolo ? "clubs" : "users";
  const name =
    profile.club_name || profile.display_name || profile.email || "Profilo";

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-8 text-black">
      <AppHeaderServer />

      <div className="mb-6">
        <Link
          href={`/admin?section=${backSection}`}
          className="text-sm font-semibold text-blue-600 underline"
        >
          ← Torna all&apos;amministrazione
        </Link>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Modifica profilo
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {name}
          {profile.email ? ` · ${profile.email}` : ""}
        </p>
        {isCircolo ? (
          <Link
            href={`/club/${profile.slug || profile.id}`}
            className="mt-1 inline-block text-sm text-gray-600 underline"
          >
            Vedi scheda pubblica
          </Link>
        ) : null}
      </div>

      {updated ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
          Profilo aggiornato.
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-5 rounded-2xl bg-gray-50 p-4 text-xs leading-5 text-gray-600">
        Piano, limite eventi, ruolo admin e ban si gestiscono dalle rispettive
        azioni nella pagina di amministrazione. La verifica del club avviene
        tramite l&apos;approvazione della rivendicazione.
      </div>

      <form
        method="post"
        action={`/api/admin/profiles/${profile.id}/update`}
        encType="multipart/form-data"
        className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6"
      >
        <div>
          <span className="text-sm font-semibold">Immagine / logo</span>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-2xl font-black text-gray-400">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                name.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <input
                type="file"
                name="logo"
                accept="image/*"
                className="block w-full text-sm text-gray-600"
              />
              <span className="mt-1 block text-xs text-gray-400">
                Carica per sostituire l&apos;immagine attuale (max 3 MB).
              </span>
            </div>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Tipo account</span>
          <select
            name="account_type"
            defaultValue={profile.account_type ?? "privato"}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          >
            <option value="privato">Utente privato</option>
            <option value="circolo">Circolo</option>
          </select>
          <span className="mt-1 block text-xs text-gray-400">
            Se lo porti su &quot;Privato&quot;, i dati del club vengono azzerati.
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Nome pubblico</span>
          <input
            name="display_name"
            defaultValue={profile.display_name ?? ""}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Citta</span>
            <input
              name="city"
              defaultValue={profile.city ?? ""}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Telefono</span>
            <input
              name="phone"
              defaultValue={profile.phone ?? ""}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Bio / descrizione</span>
          <textarea
            name="bio"
            rows={4}
            defaultValue={profile.bio ?? ""}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-bold text-black">Dati del club</p>
          <p className="mt-1 text-xs text-gray-600">
            Compilati solo se il tipo account e &quot;Circolo&quot;.
          </p>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold">Nome club</span>
              <input
                name="club_name"
                defaultValue={profile.club_name ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold">Indirizzo</span>
              <input
                name="club_address"
                defaultValue={profile.club_address ?? ""}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">WhatsApp</span>
                <input
                  name="club_whatsapp"
                  defaultValue={profile.club_whatsapp ?? ""}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Email club</span>
                <input
                  name="club_email"
                  type="email"
                  defaultValue={profile.club_email ?? ""}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Sito web</span>
                <input
                  name="club_website"
                  defaultValue={profile.club_website ?? ""}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Instagram</span>
                <input
                  name="club_instagram"
                  defaultValue={profile.club_instagram ?? ""}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
                />
              </label>
            </div>

            <div>
              <span className="text-sm font-semibold">Sport disponibili</span>
              <div className="mt-2 flex flex-wrap gap-3">
                {clubSports.map((sport) => (
                  <label
                    key={sport.label}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="club_sports"
                      value={sport.label}
                      defaultChecked={selectedSports.includes(sport.label)}
                      className="h-4 w-4"
                    />
                    {sport.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm font-semibold">Servizi</span>
              <div className="mt-2 flex flex-wrap gap-3">
                {CLUB_SERVICES.map((service) => (
                  <label
                    key={service}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="club_services"
                      value={service}
                      defaultChecked={selectedServices.includes(service)}
                      className="h-4 w-4"
                    />
                    {service}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-black px-4 py-3 font-black !text-white"
        >
          Salva modifiche
        </button>
      </form>
    </main>
  );
}
