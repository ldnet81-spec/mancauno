import AppHeader from "../components/AppHeader";
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
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 py-8 text-black">
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
    </main>
  );
}
