"use client";

import { useState } from "react";

type ShareEventButtonProps = {
  city?: string | null;
  formattedDate: string;
  formattedTime: string;
  remainingSpots: number;
  sport?: string | null;
  sportEmoji?: string | null;
  title: string;
  url: string;
};

export default function ShareEventButton({
  city,
  formattedDate,
  formattedTime,
  remainingSpots,
  sport,
  sportEmoji,
  title,
  url,
}: ShareEventButtonProps) {
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const shareUrl =
    typeof window === "undefined"
      ? url
      : url || window.location.href || `${window.location.origin}${window.location.pathname}`;

  const safeSport = sport || title || "giocare";
  const safeEmoji = sportEmoji || "🏃";
  const safeCity = city || "Zona da confermare";
  const safeDate = formattedDate || "Data da confermare";
  const safeTime = formattedTime || "orario da confermare";
  const spotsText =
    remainingSpots <= 0
      ? "Evento completo, puoi metterti in coda"
      : remainingSpots === 1
        ? "Manca 1 posto"
        : `Mancano ${remainingSpots} posti`;

  const shareText = `${safeEmoji} Manca uno per ${safeSport}!
📍 ${safeCity}
🗓 ${safeDate} ${safeTime}
👥 ${spotsText}
Unisciti qui: ${shareUrl}`;

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  async function copyLink() {
    setMessage("");
    setErrorMessage("");

    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Link copiato!");
    } catch {
      setErrorMessage("Non riesco a copiare il link da questo browser.");
    }

    setTimeout(() => {
      setMessage("");
      setErrorMessage("");
    }, 2500);
  }

  return (
    <section className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.06em] text-green-700">
          Passaparola veloce
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
          Condividi questo evento
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Invia il link nel tuo gruppo WhatsApp e trova chi manca.
        </p>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-800 ring-1 ring-green-100">
        <p className="whitespace-pre-line">{shareText}</p>
      </div>

      <div className="mt-4 grid gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-14 items-center justify-center rounded-2xl bg-green-600 px-5 text-center text-base font-black !text-white shadow-[0_14px_30px_rgba(22,163,74,0.22)] transition hover:bg-green-700"
        >
          Condividi su WhatsApp
        </a>

        <button
          type="button"
          onClick={copyLink}
          className="min-h-12 rounded-2xl border border-green-300 bg-white px-5 text-base font-bold text-green-800"
        >
          Copia link
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-center text-sm font-semibold text-green-700">
          {message}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
