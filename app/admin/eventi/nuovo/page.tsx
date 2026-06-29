import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import AppHeaderServer from "../../../../components/AppHeaderServer";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { SPORTS } from "../../../../lib/sports";

type NuovoEventoAdminProps = {
  searchParams: Promise<{ club?: string; error?: string }>;
};

export default async function NuovoEventoAdminPage({
  searchParams,
}: NuovoEventoAdminProps) {
  const { club: clubId, error } = await searchParams;
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
  if (!adminSupabase || !clubId) {
    notFound();
  }

  const { data: club } = await adminSupabase
    .from("profiles")
    .select("id, club_name, display_name, city, account_type")
    .eq("id", clubId)
    .maybeSingle();

  if (!club || club.account_type !== "circolo") {
    notFound();
  }

  const clubName = club.club_name || club.display_name || "Club";

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
          Evento segnalato
        </h1>
        <p className="mt-2 text-gray-600">
          Crea un evento per <strong>{clubName}</strong>
          {club.city ? ` (${club.city})` : ""}. Apparira sulla scheda del club
          con il badge <strong>&quot;Evento segnalato da MancaUno&quot;</strong>.
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <form
        method="post"
        action="/api/admin/events/create"
        className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6"
      >
        <input type="hidden" name="club_id" value={club.id} />

        <label className="block">
          <span className="text-sm font-semibold">Sport *</span>
          <select
            name="sport"
            defaultValue={SPORTS[0].label}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          >
            {SPORTS.map((sport) => (
              <option key={sport.label} value={sport.label}>
                {sport.emoji} {sport.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Data *</span>
            <input
              name="date"
              type="date"
              required
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Ora *</span>
            <input
              name="time"
              type="time"
              required
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Posti totali *</span>
          <input
            name="total_spots"
            type="number"
            min={2}
            max={100}
            defaultValue={10}
            required
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Partecipazione</span>
            <select
              name="entry_type"
              defaultValue="approval"
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            >
              <option value="approval">Su autorizzazione</option>
              <option value="open">Ingresso libero</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Livello</span>
            <select
              name="skill_level"
              defaultValue="amatoriale"
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            >
              <option value="amatoriale">Amatoriale</option>
              <option value="intermedio">Intermedio</option>
              <option value="esperto">Esperto</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Note</span>
          <textarea
            name="notes"
            rows={3}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-black px-4 py-3 font-black !text-white"
        >
          Crea evento segnalato
        </button>
      </form>
    </main>
  );
}
