import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeaderServer from "../../../components/AppHeaderServer";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { formatDateTimeItaly } from "../../../lib/date-time";

type RivendicazioniPageProps = {
  searchParams: Promise<{
    approved?: string;
    rejected?: string;
    error?: string;
  }>;
};

type ClaimRow = {
  id: string;
  club_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  website_or_social: string | null;
  message: string | null;
  created_at: string;
};

export default async function RivendicazioniPage({
  searchParams,
}: RivendicazioniPageProps) {
  const params = await searchParams;
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
    redirect("/admin?error=admin-non-configurato");
  }

  const { data: claimsData } = await adminSupabase
    .from("club_claims")
    .select(
      "id, club_id, full_name, email, phone, role, website_or_social, message, created_at"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const claims = (claimsData as ClaimRow[] | null) ?? [];

  // Carica i club collegati in un'unica query.
  const clubIds = Array.from(new Set(claims.map((claim) => claim.club_id)));
  const { data: clubsData } = clubIds.length
    ? await adminSupabase
        .from("profiles")
        .select("id, slug, club_name, display_name, city")
        .in("id", clubIds)
    : { data: [] };

  const clubsById = new Map(
    (clubsData ?? []).map((club: any) => [club.id, club])
  );

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-8 text-black">
      <AppHeaderServer />

      <div className="mb-6">
        <Link
          href="/admin?section=clubs"
          className="text-sm font-semibold text-blue-600 underline"
        >
          ← Torna ai club
        </Link>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Richieste di rivendicazione
        </h1>
        <p className="mt-2 text-gray-600">
          Verifica i dati e approva o rifiuta le richieste dei gestori dei club.
        </p>
      </div>

      {params.approved ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
          Richiesta approvata. Il club e ora verificato e gestibile dall&apos;utente.
        </div>
      ) : null}

      {params.rejected ? (
        <div className="mb-5 rounded-2xl bg-gray-100 p-4 text-sm font-semibold text-gray-700">
          Richiesta rifiutata.
        </div>
      ) : null}

      {params.error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {params.error}
        </div>
      ) : null}

      <div className="space-y-4">
        {!claims.length ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
            Nessuna richiesta in attesa.
          </p>
        ) : (
          claims.map((claim) => {
            const club = clubsById.get(claim.club_id);
            const clubName =
              club?.club_name || club?.display_name || "Club sconosciuto";
            const clubHref = `/club/${club?.slug || claim.club_id}`;

            return (
              <div
                key={claim.id}
                className="rounded-3xl border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={clubHref}
                      className="text-lg font-black text-black underline decoration-gray-300 underline-offset-4"
                    >
                      {clubName}
                    </Link>
                    {club?.city ? (
                      <p className="text-sm text-gray-600">{club.city}</p>
                    ) : null}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateTimeItaly(claim.created_at)}
                  </span>
                </div>

                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-gray-500">Richiedente</dt>
                    <dd className="font-semibold">{claim.full_name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Ruolo</dt>
                    <dd className="font-semibold">{claim.role || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd className="font-semibold break-all">
                      {claim.email || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Telefono</dt>
                    <dd className="font-semibold">{claim.phone || "—"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500">Sito / social</dt>
                    <dd className="font-semibold break-all">
                      {claim.website_or_social || "—"}
                    </dd>
                  </div>
                  {claim.message ? (
                    <div className="sm:col-span-2">
                      <dt className="text-gray-500">Messaggio</dt>
                      <dd className="whitespace-pre-line">{claim.message}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <form
                    method="post"
                    action={`/api/admin/claims/${claim.id}/approve`}
                  >
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-black !text-white"
                    >
                      Approva
                    </button>
                  </form>
                  <form
                    method="post"
                    action={`/api/admin/claims/${claim.id}/reject`}
                  >
                    <button
                      type="submit"
                      className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700"
                    >
                      Rifiuta
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
