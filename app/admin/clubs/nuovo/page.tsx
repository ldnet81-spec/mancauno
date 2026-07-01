import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeaderServer from "../../../../components/AppHeaderServer";
import { createClient } from "../../../../lib/supabase/server";
import { SPORTS } from "../../../../lib/sports";

type NuovoClubPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const clubSports = SPORTS.filter((sport) => sport.label !== "Altro evento");

export default async function NuovoClubPage({
  searchParams,
}: NuovoClubPageProps) {
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
    .select("role, banned_at")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.banned_at) {
    redirect("/");
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-8 text-black">
      <AppHeaderServer />

      <div className="mb-6">
        <Link
          href="/admin?section=clubs"
          className="text-sm font-semibold text-blue-600 underline"
        >
          ← Torna ai club
        </Link>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Nuova scheda club
        </h1>
        <p className="mt-2 text-gray-600">
          Crea una scheda pubblica indicizzabile per un club che non si e ancora
          registrato. La scheda sara visibile come{" "}
          <strong>&quot;Scheda informativa&quot;</strong> e il vero gestore potra
          rivendicarla.
        </p>
      </div>

      {params.error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {params.error}
        </div>
      ) : null}

      <form
        method="post"
        action="/api/admin/clubs/create"
        encType="multipart/form-data"
        className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6"
      >
        <label className="block">
          <span className="text-sm font-semibold">Nome club *</span>
          <input
            name="club_name"
            required
            placeholder="Es. Moscardino Padel Center"
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <label className="block rounded-xl border border-dashed border-gray-300 bg-white p-4">
          <span className="text-sm font-semibold">Logo / immagine</span>
          <input
            type="file"
            name="logo"
            accept="image/*"
            className="mt-2 block w-full text-sm text-gray-600"
          />
          <span className="mt-1 block text-xs text-gray-400">
            Formato immagine, max 3 MB.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Citta</span>
            <input
              name="city"
              placeholder="Avezzano"
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Indirizzo</span>
            <input
              name="club_address"
              placeholder="Via Roma 10"
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Telefono</span>
            <input
              name="phone"
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Email</span>
            <input
              name="club_email"
              type="email"
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Sito web</span>
            <input
              name="club_website"
              type="url"
              placeholder="https://..."
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Instagram</span>
            <input
              name="club_instagram"
              placeholder="https://instagram.com/..."
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
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-sm"
              >
                <input
                  type="checkbox"
                  name="club_sports"
                  value={sport.label}
                  className="h-4 w-4"
                />
                {sport.label}
              </label>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Descrizione</span>
          <textarea
            name="bio"
            rows={4}
            placeholder="Descrivi il club, gli sport e i servizi offerti."
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-black px-4 py-3 font-black !text-white"
        >
          Crea scheda club
        </button>
      </form>
    </main>
  );
}
