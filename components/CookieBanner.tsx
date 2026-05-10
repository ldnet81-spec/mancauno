"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "mancauno_cookie_notice_accepted";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(localStorage.getItem(COOKIE_CONSENT_KEY) !== "1");
  }, []);

  function acceptNotice() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "1");
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200 bg-white p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
      <div className="mx-auto max-w-md">
        <p className="text-sm font-medium text-black">Informativa cookie</p>

        <p className="mt-1 text-xs leading-5 text-gray-600">
          Usiamo cookie tecnici e strumenti necessari al funzionamento del
          servizio, inclusi quelli di autenticazione forniti da Supabase. Non
          usiamo cookie di profilazione senza consenso.
        </p>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={acceptNotice}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium !text-white"
          >
            Ho capito
          </button>

          <Link
            href="/privacy"
            className="text-sm font-medium text-gray-700 underline underline-offset-4"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
