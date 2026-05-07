"use client";

import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UpdateTotalSpotsFormProps = {
  eventId: string;
  initialTotalSpots: number;
  confirmedCount: number;
};

export default function UpdateTotalSpotsForm({
  eventId,
  initialTotalSpots,
  confirmedCount,
}: UpdateTotalSpotsFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [totalSpots, setTotalSpots] = useState(initialTotalSpots);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function updateTotalSpots() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    if (totalSpots < confirmedCount) {
      setErrorMessage(
        `Non puoi scendere sotto ${confirmedCount}, perché ci sono già ${confirmedCount} partecipanti confermati.`
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.rpc("update_event_total_spots", {
      p_event_id: eventId,
      p_total_spots: totalSpots,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Posti aggiornati.");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium">Posti totali</span>

        <input
          type="number"
          min={confirmedCount}
          max={50}
          value={totalSpots}
          onChange={(event) => setTotalSpots(Number(event.target.value))}
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
        />
      </label>

      <p className="text-xs text-gray-500">
        Partecipanti confermati: {confirmedCount}. Non puoi impostare un numero
        inferiore.
      </p>

      {message ? (
        <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={updateTotalSpots}
        disabled={loading}
        className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Aggiornamento..." : "Aggiorna posti"}
      </button>
    </div>
  );
}