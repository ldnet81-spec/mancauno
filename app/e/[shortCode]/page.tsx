import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { createPublicClient } from "../../../lib/supabase/public";
import JoinEventButton from "./JoinEventButton";
import AutoJoinEvent from "./AutoJoinEvent";
import ShareEventButton from "./ShareEventButton";
import BrandHeader from "../../../components/BrandHeader";
import CancelEventButton from "./CancelEventButton";
import UpdateTotalSpotsForm from "./UpdateTotalSpotsForm";
import CancelParticipationButton from "./CancelParticipationButton";
import Link from "next/link";

type EventPageProps = {
  params: Promise<{
    shortCode: string;
  }>;
};

function formatAvailabilityLabel(remainingSpots: number) {
  if (remainingSpots <= 0) {
    return "Evento completo";
  }

  if (remainingSpots === 1) {
    return "Ultimo posto disponibile";
  }

  return `Mancano ${remainingSpots} posti disponibili`;
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { shortCode } = await params;
  const supabase = createPublicClient();

  const { data: event } = await supabase
    .from("event_with_counts")
    .select("title, city, starts_at, remaining_spots, waitlisted_count, status")
    .eq("short_code", shortCode)
    .single();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!event) {
    return {
      title: "Evento non trovato • mancauno.it",
      description: "Questo evento non è disponibile.",
    };
  }

  const startsAt = new Date(event.starts_at);

  const formattedDate = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(startsAt);

  const remainingSpots = event.remaining_spots ?? 0;
  const waitlistedCount = event.waitlisted_count ?? 0;

  const title = `${event.title} • mancauno.it`;

  const description =
    event.status !== "active"
      ? "Questo evento non è più disponibile."
      : `${
          remainingSpots <= 0
            ? `Evento completo${
                waitlistedCount > 0
                  ? ` • ${waitlistedCount} ${
                      waitlistedCount === 1
                        ? "persona in coda"
                        : "persone in coda"
                }`
                  : ""
              }`
            : formatAvailabilityLabel(remainingSpots)
        } • ${formattedDate} • ${event.city}`;

  const ogImageUrl = `${siteUrl}/e/${shortCode}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/e/${shortCode}`,
      siteName: "mancauno.it",
      locale: "it_IT",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,