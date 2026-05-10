import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
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
          padding: "56px 64px",
          color: "#111111",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 34,
            fontWeight: 800,
          }}
        >
          <span style={{ color: "#111111" }}>MANCA</span>
          <span style={{ color: "#f97316" }}>UNO</span>
          <span style={{ color: "#0ea5e9", fontSize: 24 }}>.it</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.02,
            }}
          >
            Trova chi manca per completare il tuo evento sportivo
          </div>

          <div
            style={{
              maxWidth: 900,
              fontSize: 34,
              color: "#555555",
              lineHeight: 1.25,
            }}
          >
            Crea eventi, condividi il link e raccogli richieste da giocatori
            interessati nella tua zona.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          <span>Calcetto</span>
          <span>Padel</span>
          <span>Tennis</span>
          <span>Basket</span>
          <span>Running</span>
        </div>
      </div>
    ),
    size
  );
}
