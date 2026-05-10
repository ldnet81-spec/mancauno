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
            >
              Cerca altri eventi sportivi su mancauno.it
            </div>
          </div>

          <div
            style={{
              fontSize: 28,
              color: "#111111",
              fontWeight: 600,
            }}
          >
            Crea il gruppo. Condividi il link. Trova chi manca.
          </div>
        </div>
      ),
      size
    );
  }

  const startsAt = new Date(event.starts_at);

  const formattedDate = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(startsAt);

  const formattedTime = new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(startsAt);

  const remainingSpots = event.remaining_spots ?? 0;
  const waitlistedCount = event.waitlisted_count ?? 0;

  const isUnavailable = event.status !== "active";
  const isFull = remainingSpots <= 0;

  const title = truncateText(event.title, 54);
  const locationText = truncateText(
    [event.location_name, event.city].filter(Boolean).join(", "),
    46
  );

  const mainBadgeText = isUnavailable
    ? "Evento non disponibile"
    : formatAvailabilityLabel(remainingSpots);

  const secondaryBadgeText =
    !isUnavailable && isFull && waitlistedCount > 0
      ? `${waitlistedCount} ${
          waitlistedCount === 1 ? "persona in coda" : "persone in coda"
        }`
      : null;

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
          padding: "46px 56px",
          color: "#111111",
          fontFamily: "Arial, sans-serif",
          border: "1px solid #eeeeee",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <img
              src={logoUrl}
              width={236}
              height={68}
              alt="mancauno.it"
              style={{ objectFit: "contain" }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                alignSelf: "flex-start",
                borderRadius: 999,
                background: "#f4f4f5",
                padding: "10px 18px",
                fontSize: 24,
                color: "#333333",
                fontWeight: 600,
              }}
            >
              Link evento condiviso
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: 126,
              height: 126,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 34,
              background: "#f4f4f5",
              fontSize: 76,
              lineHeight: 1,
            }}
          >
            {event.sport_emoji}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: title.length > 34 ? 58 : 68,
              fontWeight: 850,
              lineHeight: 1.03,
              letterSpacing: "-2.4px",
              maxWidth: 940,
            }}
          >
            {title}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                alignSelf: "flex-start",
                background: "#111111",
                color: "#ffffff",
                borderRadius: 999,
                padding: "16px 26px",
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: "-0.5px",
              }}
            >
              {mainBadgeText}
            </div>

            {secondaryBadgeText ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  background: "#fff7ed",
                  color: "#9a3412",
                  borderRadius: 999,
                  padding: "14px 22px",
                  fontSize: 25,
                  fontWeight: 700,
                }}
              >
                {secondaryBadgeText}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              gap: 18,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                borderRadius: 26,
                background: "#f7f7f8",
                padding: "22px 26px",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  color: "#666666",
                  fontWeight: 700,
                }}
              >
                Quando
              </div>

              <div
                style={{
                  fontSize: 30,
                  color: "#111111",
                  fontWeight: 800,
                  lineHeight: 1.15,
                }}
              >
                {formattedDate}
              </div>

              <div
                style={{
                  fontSize: 28,
                  color: "#111111",
                  fontWeight: 700,
                }}
              >
                {formattedTime}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                borderRadius: 26,
                background: "#f7f7f8",
                padding: "22px 26px",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  color: "#666666",
                  fontWeight: 700,
                }}
              >
                Dove
              </div>

              <div
                style={{
                  fontSize: 30,
                  color: "#111111",
                  fontWeight: 800,
                  lineHeight: 1.15,
                }}
              >
                {locationText || event.city || "Luogo da confermare"}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid #eeeeee",
            paddingTop: 22,
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: "#111111",
              fontWeight: 750,
              letterSpacing: "-0.3px",
            }}
          >
            Crea il gruppo. Condividi il link. Trova chi manca.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: 999,
              border: "2px solid #111111",
              padding: "10px 18px",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            mancauno.it
          </div>
        </div>
      </div>
    ),
    size
  );
}
