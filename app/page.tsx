import Link from "next/link";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import { createPublicClient } from "../lib/supabase/public";
import SearchEvents from "./SearchEvents";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const supabase = createPublicClient();

  const { data: events, error } = await supabase
    .from("public_events")
    .select("*")
    .eq("status", "active")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(20);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 pb-28 pt-8 text-black">
      <AppHeader />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Trova eventi a cui manca qualcuno
        </h1>

        <p className="mt-2 text-gray-600">
          Cerca per città o attività e unisciti a partite, allenamenti e uscite
          condivise.
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      <SearchEvents events={events ?? []} />

      <AppFooter />

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-4">
        <div className="mx-auto max-w-md">
          <Link
            href="/eventi/nuovo"
            className="block w-full rounded-xl bg-black px-4 py-3 text-center font-medium !text-white"
          >
            + Crea evento
          </Link>
        </div>
      </div>
    </main>
  );
}