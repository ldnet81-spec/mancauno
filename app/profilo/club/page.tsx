import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeaderServer from "../../../components/AppHeaderServer";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

type MyClubsRow = {
  id: string;
  slug: string | null;
  club_name: string | null;
  display_name: string | null;
  city: string | null;
  is_verified: boolean | null;
};

export default async function MyClubsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    redirect("/profilo");
  }

  // Club gestiti dall'utente come owner ma che NON coincidono col suo profilo
  // personale (quelli rivendicati). Il proprio profilo circolo si modifica
  // dalla pagina profilo classica.
  const { data } = await adminSupabase
    .from("profiles")
    .select("id, slug, club_name, display_name, city, is_verified")
    .eq("owner_id", user.id)
    .eq("account_type", "circolo")
    .neq("id", user.id)
    .order("club_name", { ascending: true });

  const clubs = (data as MyClubsRow[] | null) ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-8 text-black">
      <AppHeaderServer />

      <div className="mb-6">
        <Link href="/profilo" className="text-sm font-semibold text-blue-600 underline">
          ← Torna al profilo
        </Link>
        <h1 className="mt-3 text-3xl font-black tracking-tight">I miei club</h1>
        <p className="mt-2 text-gray-600">
          I club che gestisci su MancaUno. Puoi modificarne i dati e pubblicare
          eventi ufficiali.
        </p>
      </div>

      {!clubs.length ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Non gestisci ancora nessun club. Se sei il gestore di un club presente
          su MancaUno, cercalo nella{" "}
          <Link href="/club" className="font-semibold underline">
            directory dei club
          </Link>{" "}
          e rivendica la scheda.
        </div>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => {
            const name = club.club_name || club.display_name || "Club";
            const slugOrId = club.slug || club.id;

            return (
              <div
                key={club.id}
                className="rounded-3xl border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black">{name}</h2>
                      {club.is_verified ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                          Verificato
                        </span>
                      ) : null}
                    </div>
                    {club.city ? (
                      <p className="text-sm text-gray-600">{club.city}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/profilo/club/${club.id}/modifica`}
                    className="rounded-xl bg-black px-4 py-2 text-center text-sm font-bold !text-white"
                  >
                    Modifica
                  </Link>
                  <Link
                    href={`/club/${slugOrId}`}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-center text-sm font-bold text-black"
                  >
                    Vedi pagina
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
