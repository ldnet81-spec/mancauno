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
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const xHref = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}`;

  function flashMessage(text: string, isError = false) {
    setMessage(isError ? "" : text);
    setErrorMessage(isError ? text : "");
    setTimeout(() => {
      setMessage("");
      setErrorMessage("");
    }, 3500);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flashMessage("Link copiato!");
    } catch {
      flashMessage("Non riesco a copiare il link da questo browser.", true);
    }
  }

  async function copyForInstagram() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flashMessage(
        "Link copiato! Apri Instagram e incollalo in DM o nelle Storie."
      );
    } catch {
      flashMessage("Non riesco a copiare il link da questo browser.", true);
    }
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
          Invia il link nei tuoi gruppi WhatsApp o sui social e trova chi manca.
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

        <div className="grid grid-cols-4 gap-2">
          <a
            href={facebookHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Condividi su Facebook"
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#1877F2] px-3 text-sm font-bold !text-white transition hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.99 22 12Z" />
            </svg>
            <span className="hidden sm:inline">Facebook</span>
          </a>

          <a
            href={xHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Condividi su X"
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-black px-3 text-sm font-bold !text-white transition hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2H21.5l-7.5 8.57L22.75 22h-6.79l-5.32-6.96L4.79 22H1.53l8.02-9.165L1.25 2h6.96l4.81 6.36L18.244 2Zm-2.38 18.05h1.88L7.27 3.86H5.26l10.604 16.19Z" />
            </svg>
            <span className="hidden sm:inline">X</span>
          </a>

          <button
            type="button"
            onClick={copyForInstagram}
            aria-label="Copia link per Instagram"
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 px-3 text-sm font-bold !text-white transition hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M12 2.16c3.2 0 3.584.012 4.85.07 1.17.053 1.805.249 2.227.413.56.218.96.479 1.38.9.42.42.682.82.9 1.38.164.422.36 1.057.413 2.227.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.053 1.17-.249 1.805-.413 2.227a3.72 3.72 0 0 1-.9 1.38 3.72 3.72 0 0 1-1.38.9c-.422.164-1.057.36-2.227.413-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.053-1.805-.249-2.227-.413a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.164-.422-.36-1.057-.413-2.227-.058-1.266-.07-1.65-.07-4.85s.012-3.584.07-4.85c.053-1.17.249-1.805.413-2.227.218-.56.479-.96.9-1.38.42-.42.82-.682 1.38-.9.422-.164 1.057-.36 2.227-.413 1.266-.058 1.65-.07 4.85-.07Zm0-2.16C8.74 0 8.333.014 7.053.072 5.775.13 4.903.333 4.14.63a5.88 5.88 0 0 0-2.126 1.384A5.88 5.88 0 0 0 .63 4.14C.333 4.903.13 5.775.072 7.053.014 8.333 0 8.74 0 12s.014 3.667.072 4.947c.058 1.278.261 2.15.558 2.913.308.793.72 1.467 1.384 2.126a5.88 5.88 0 0 0 2.126 1.384c.763.297 1.635.5 2.913.558C8.333 23.986 8.74 24 12 24s3.667-.014 4.947-.072c1.278-.058 2.15-.261 2.913-.558a5.88 5.88 0 0 0 2.126-1.384 5.88 5.88 0 0 0 1.384-2.126c.297-.763.5-1.635.558-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.058-1.278-.261-2.15-.558-2.913a5.88 5.88 0 0 0-1.384-2.126A5.88 5.88 0 0 0 19.86.63C19.097.333 18.225.13 16.947.072 15.667.014 15.26 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324Zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
            </svg>
            <span className="hidden sm:inline">Instagram</span>
          </button>

          <button
            type="button"
            onClick={copyLink}
            aria-label="Copia link"
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-300 bg-white px-3 text-sm font-bold text-green-800 transition hover:bg-green-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">Copia</span>
          </button>
        </div>
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
