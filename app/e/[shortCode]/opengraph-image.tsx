import { ImageResponse } from "next/og";
import { createPublicClient } from "../../../lib/supabase/public";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type OgImageProps = {
  params: Promise<{
    shortCode: string;
  }>;
};

function truncateText(text: string, maxLength: number) {
  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

function formatAvailabilityLabel(remainingSpots: number) {
  if (remainingSpots <= 0) {
    return "Evento completo";
  }

  if (remainingSpots === 1) {
    return "Ultimo posto disponibile";
  }

  return `Mancano ${remainingSpots} posti disponibili`;
}

export default async function Image({ params }: OgImageProps) {
  const { shortCode } = await params;
  const supabase = createPublicClient();

  const { data: event } = await supabase
    .from("event_with_counts")
    .select(
      "title, sport_emoji, starts_at, city, location_name, remaining_spots, waitlisted_count, status"
    )
    .eq("short_code", shortCode)
    .single();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const logoUrl = new URL("/logo-full.png", siteUrl).toString();

  if (!event) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 60px",
            color: "#111111",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={logoUrl}
              width={240}
              height={70}
              alt="mancauno.it"
              style={{ objectFit: "contain" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: "-2px",
              }}
            >
              Evento non disponibile
            </div>

            <div
              style={{
                fontSize: 34,
                color: "#555555",
                lineHeight: 1.25,
              }}
            ></div>