import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppHeaderServer from "../../../../components/AppHeaderServer";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import EditEventForm from "./EditEventForm";

type EditEventPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function EditEventPage({
  params,
  searchParams,
}: EditEventPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    redirect(
      "/profilo/eventi?error=Modifica evento non configurata: manca SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const { data: event } = await adminSupabase
    .from("events")
    .select(
      "id, creator_id, short_code, sport, sport_emoji, title, starts_at, location_name, city, total_spots, entry_type, notes, status"
    )
    .eq("id", id)
    .single();

  if (!event) {
    notFound();
  }

  if (event.creator_id !== user.id) {
    redirect("/profilo/eventi?error=Non puoi modificare questo evento.");
  }

  const { count: approvedCount } = await adminSupabase
    .from("participations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("status", "approved");

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 py-8 text-black">
      <AppHeaderServer />

      <div className="mb-8">
        <Link
          href="/profilo/eventi"
          className="text-sm font-medium text-gray-600 underline underline-offset-4"
        >
          Torna ai miei eventi
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Modifica evento
        </h1>

        <p className="mt-2 text-gray-600">
          Se cambi data, ora, luogo o dettagli importanti, i partecipanti
          approvati riceveranno una notifica.
        </p>
      </div>

      {query.error ? (
        <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {query.error}
        </div>
      ) : null}

      <EditEventForm event={event} approvedCount={approvedCount ?? 0} />
    </main>
  );
}
