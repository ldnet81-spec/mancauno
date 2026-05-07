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

export default async function Image({ params }: OgImageProps) {
  const { shortCode } = await params;
  const supabase = createPublicClient();

  const { data: event } = await supabase
    .from("event_with_counts")
    .select("title, sport_emoji, starts_at, city, remaining_spots")
    .eq("short_code", shortCode)
    .single();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
            padding: "48px 56px",
            color: "#111111",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={logoUrl}
              width={220}
              height={60}
              alt="mancauno.it"
              style={{ objectFit: "contain" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 64, fontWeight: 700 }}>
              Evento sportivo
            </div>
            <div style={{ fontSize: 30, color: "#555" }}>
              mancauno.it
            </div>
          </div>
        </div>
      ),
      size
    );
  }

  const startsAt = new Date(event.starts_at);

  const formattedDate = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
  }).format(startsAt);

  const formattedTime = new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(startsAt);

  const remainingSpots = event.remaining_spots ?? 0;

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
          padding: "48px 56px",
          color: "#111111",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <img
            src={logoUrl}
            width={220}
            height={60}
            alt="mancauno.it"
            style={{ objectFit: "contain" }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 72,
              width: 120,
              height: 120,
              borderRadius: 24,
              background: "#f5f5f5",
            }}
          >
            {event.sport_emoji}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            {event.title}
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              alignSelf: "flex-start",
              background: "#111111",
              color: "#ffffff",
              borderRadius: 999,
              padding: "14px 24px",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            {remainingSpots <= 0
              ? "Evento completo"
              : `Mancano ${remainingSpots} ${
                  remainingSpots === 1 ? "persona" : "persone"
                }`}
          </div>

          <div
            style={{
              display: "flex",
              gap: 28,
              fontSize: 28,
              color: "#555555",
            }}
          >
            <div>
              {formattedDate} · {formattedTime}
            </div>
            <div>{event.city}</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}