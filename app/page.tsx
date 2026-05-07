import Link from "next/link";
import AppHeader from "../components/AppHeader";
import AppFooter from "../components/AppFooter";
import { createPublicClient } from "../lib/supabase/public";
import SearchEvents from "./SearchEvents";

export default async function HomePage() {
  const supabase = createPublicClient();

  const { data: events } = await supabase
    .from("event_with_counts")
    .select("*")
    .eq("status", "active")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(50);

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 pb-28 pt-8">
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

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <span className="rounded-full bg-black px-4 py-2 text-sm text-white">
          Tutti
        </span>

        <span className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700">
          Calcetto
        </span>

        <span className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700">
          Padel
        </span>

        <span className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700">
          Tennis
        </span>

        <span className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700">
          Running
        </span>
      </div>

      <SearchEvents events={events ?? []} />

      <AppFooter />

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-4">
        <div className="mx-auto max-w-md">
          <Link
            href="/eventi/nuovo"
            className="block w-full rounded-xl bg-black px-4 py-3 text-center font-medium text-white"
          >
            + Crea evento
          </Link>
        </div>
      </div>
    </main>
  );
}