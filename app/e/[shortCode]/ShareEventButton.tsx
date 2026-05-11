"use client";

import { useState } from "react";

type ShareEventButtonProps = {
  title: string;
  url: string;
};

export default function ShareEventButton({
  title,
  url,
}: ShareEventButtonProps) {
  const [message, setMessage] = useState("");

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: "Unisciti a questo evento",
          url,
        });

        setMessage("Link condiviso.");
        return;
      }

      await navigator.clipboard.writeText(url);
      setMessage("Link copiato negli appunti.");
    } catch {
      setMessage("Impossibile condividere il link.");
    }

    setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleShare}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-black"
      >
        Condividi evento
      </button>

      {message ? (
        <p className="text-center text-sm text-gray-600">{message}</p>
      ) : null}
    </div>
  );
}
