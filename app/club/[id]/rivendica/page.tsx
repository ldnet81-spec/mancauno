import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AppHeaderServer from "../../../../components/AppHeaderServer";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { UUID_REGEX } from "../../../../lib/slug";

type RivendicaPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

function getClubName(club: {
  club_name?: string | null;
  display_name?: string | null;
}): string {
  return club.club_name || club.display_name || "questo club";
}

const ROLES = [
  "Titolare",
  "Responsabile",
  "Segreteria",
  "Istruttore",
  "Altro",
];

export default async function RivendicaPage({
  params,
  searchParams,
}: RivendicaPageProps) {
  const { id } = await params;
  const { error } = await searchParams;

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Per rivendicare bisogna essere loggati.
  if (!user) {
    redirect(`/auth/quick-signup?next=${encodeURIComponent(`/club/${id}/rivendica`)}`);
  }

  const lookupColumn = UUID_REGEX.test(id) ? "id" : "slug";
  const { data: club } = await adminSupabase
    .from("profiles")
    .select("id, slug, account_type, club_name, display_name, city, claim_status, is_verified")
    .eq(lookupColumn, id)
    .maybeSingle();

  if (!club || club.account_type !== "circolo") {
    notFound();
  }

  const slugOrId = club.slug || club.id;

  // Gia' verificato → niente rivendicazione.
  if (club.is_verified && club.claim_status === "approved") {
    redirect(`/club/${slugOrId}`);
  }

  const clubName = getClubName(club);

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-8 text-black">
      <AppHeaderServer />

      <div className="mb-6">
        <Link
          href={`/club/${slugOrId}`}
          className="text-sm font-semibold text-blue-600 underline"
        >
          ← Torna alla scheda
        </Link>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Rivendica {clubName}
        </h1>
        <p className="mt-2 text-gray-600">
          Compila i dati: il team MancaUno verifichera la richiesta e, una volta
          approvata, potrai gestire direttamente la scheda del club.
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <form
        method="post"
        action={`/api/clubs/${club.id}/claim`}
        className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6"
      >
        <label className="block">
          <span className="text-sm font-semibold">Nome e cognome *</span>
          <input
            name="full_name"
            required
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Email *</span>
            <input
              name="email"
              type="email"
              required
              defaultValue={user.email ?? ""}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Telefono</span>
            <input
              name="phone"
              type="tel"
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Ruolo nel club</span>
          <select
            name="role"
            defaultValue="Titolare"
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold">
            Sito web o pagina social ufficiale
          </span>
          <input
            name="website_or_social"
            placeholder="https://..."
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Messaggio (opzionale)</span>
          <textarea
            name="message"
            rows={3}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-black px-4 py-3 font-black !text-white"
        >
          Invia richiesta di rivendicazione
        </button>
      </form>
    </main>
  );
}
