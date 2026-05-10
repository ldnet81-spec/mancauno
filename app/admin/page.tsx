import { createClient } from "../../lib/supabase/server";
import AppHeader from "../../components/AppHeader";
import Link from "next/link";
import { redirect } from "next/navigation";

type AdminPageProps = {
  searchParams: Promise<{
    section?: string;
    q?: string;
    error?: string;
    banned?: string;
    unbanned?: string;
    event_deleted?: string;
    user_deleted?: string;
    role_updated?: string;
  }>;
};

function formatRemainingSpots(remainingSpots: number) {
  if (remainingSpots <= 0) {
    return "Completo";
  }

  if (remainingSpots === 1) {
    return "Ultimo posto";
  }

  return `Mancano ${remainingSpots} posti`;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const section = params.section === "events" ? "events" : "users";
  const searchQuery = params.q?.trim() ?? "";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, banned_at")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.banned_at) {
    redirect("/");
  }

  let usersQuery = supabase
    .from("profiles")
    .select(
      "id, display_name, email, city, role, banned_at, created_at, account_type, club_name, phone"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (searchQuery && section === "users") {
    usersQuery = usersQuery.or(
      `email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,club_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
    );
  }

  const { data: users } = await usersQuery;

  let eventsQuery = supabase
    .from("event_with_counts")
    .select("*")
    .order("starts_at", { ascending: true })
    .limit(100);

  if (searchQuery && section === "events") {
    eventsQuery = eventsQuery.or(
      `title.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,sport.ilike.%${searchQuery}%,location_name.ilike.%${searchQuery}%`
    );
  }

  const { data: events } = await eventsQuery;

  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-white px-6 py-8 text-black">
      <AppHeader />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>

        <p className="mt-2 text-gray-600">
          Gestisci utenti ed eventi della piattaforma.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
        <Link
          href="/admin?section=users"