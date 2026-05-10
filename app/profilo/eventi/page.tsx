import { createClient } from "../../../lib/supabase/server";
import BrandHeader from "../../../components/BrandHeader";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "../../../components/AppHeader";

type MyEventsPageProps = {
  searchParams: Promise<{
    approved?: string;
    rejected?: string;
    error?: string;
  }>;
};

function formatDate(date: string) {
  const startsAt = new Date(date);

  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(startsAt);
}

function getParticipationLabel(status: string) {
  if (status === "approved") {
    return "Partecipi";
  }

  if (status === "pending") {
    return "In attesa";
  }

  if (status === "waitlisted") {
    return "In coda";
  }

  if (status === "rejected") {
    return "Rifiutata";
  }

  if (status === "cancelled") {
    return "Cancellata";
  }

  return status;
}

function getAvailabilityBadge(remainingSpots: number) {
  if (remainingSpots <= 0) {
    return {
      label: "Completo",
      className: "bg-gray-100 text-gray-700",
    };
  }

  if (remainingSpots === 1) {
    return {
      label: "Ultimo posto",
      className: "bg-green-600 text-white",
    };
  }

  return {
    label: `Mancano ${remainingSpots} posti`,
    className: "bg-black text-white",
  };
}

export default async function MyEventsPage({
  searchParams,
}: MyEventsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/quick-signup");
  }

  const { data: organizedEvents } = await supabase
    .from("event_with_counts")
    .select("*")
    .eq("creator_id", user.id)
    .order("starts_at", { ascending: true });

  const { data: pendingRequests, error: pendingRequestsError } =
    await supabase.rpc("get_pending_requests_for_my_events");

  const { data: myParticipations, error: myParticipationsError } =
    await supabase.rpc("get_my_participations");

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-8">
      