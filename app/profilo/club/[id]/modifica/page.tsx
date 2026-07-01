import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import AppHeaderServer from "../../../../../components/AppHeaderServer";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { SPORTS } from "../../../../../lib/sports";
import { CLUB_SERVICES } from "../../../../../lib/club-services";

type EditClubPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
};

const clubSports = SPORTS.filter((sport) => sport.label !== "Altro evento");

export default async function EditClubPage({
  params,
  searchParams,
}: EditClubPageProps) {
  const { id } = await params;
  const { updated, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    notFound();
  }

  const { data: club } = await adminSupabase
    .from("profiles")
    .select(
      "id, slug, owner_id, account_type, club_name, display_name, city, club_address, phone, club_whatsapp, club_email, club_website, club_instagram, bio, club_sports, club_services, avatar_url"
    )
    .eq("id", id)
    .maybeSingle();

  if (!club || club.account_type !== "circolo") {
    notFound();
  }

  // Solo l'owner (o un admin) puo' modificare.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (club.owner_id !== user.id && me?.role !== "admin") {
    redirect("/profilo/club?error=non-autorizzato");
  }

  const selectedSports: string[] = club.club_sports ?? [];
  const selectedServices: string[] = club.club_services ?? [];
  const slugOrId = club.slug || club.id;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-8 text-black">
      <AppHeaderServer />

      <div className="mb-6">
        <Link
          href="/profilo/club"
          className="text-sm font-semibold text-blue-600 underline"
        >
          ← I miei club
        </Link>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Modifica club
        </h1>
        <Link
          href={`/club/${slugOrId}`}
          className="mt-1 inline-block text-sm text-gray-600 underline"
        >
          Vedi pagina pubblica
        </Link>
      </div>

      {updated ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
          Modifiche salvate.
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <form
        method="post"
        action={`/api/clubs/${club.id}/update`}
        encType="multipart/form-data"
        className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6"
      >
        <div>
          <span className="text-sm font-semibold">Logo / immagine</span>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-2xl font-black text-gray-400">
              {club.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={club.avatar_url}
                  alt="Logo club"
                  className="h-full w-full object-cover"
                />
              ) : (
                (club.club_name || "C").slice(0, 1).toUpperCase()
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
                Carica una nuova immagine per sostituire quella attuale (max 3 MB).
              </span>
            </div>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Nome club *</span>
          <input
            name="club_name"
            required
            defaultValue={club.club_name ?? ""}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Nome pubblico / referente</span>
          <input
            name="display_name"
            defaultValue={club.display_name ?? ""}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Citta</span>
            <input
              name="city"
              defaultValue={club.city ?? ""}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Indirizzo</span>
            <input
              name="club_address"
              defaultValue={club.club_address ?? ""}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Telefono</span>
            <input
              name="phone"
              defaultValue={club.phone ?? ""}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">WhatsApp</span>
            <input
              name="club_whatsapp"
              defaultValue={club.club_whatsapp ?? ""}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Email</span>
            <input
              name="club_email"
              type="email"
              defaultValue={club.club_email ?? ""}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Sito web</span>
            <input
              name="club_website"
              defaultValue={club.club_website ?? ""}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Instagram</span>
          <input
            name="club_instagram"
            defaultValue={club.club_instagram ?? ""}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <div>
          <span className="text-sm font-semibold">Sport disponibili</span>
          <div className="mt-2 flex flex-wrap gap-3">
            {clubSports.map((sport) => (
              <label
                key={sport.label}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm"
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
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm"
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

        <label className="block">
          <span className="text-sm font-semibold">Descrizione</span>
          <textarea
            name="bio"
            rows={4}
            defaultValue={club.bio ?? ""}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

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
