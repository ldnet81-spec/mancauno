"use client";

import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CancelParticipationButtonProps = {
  eventId: string;
};

export default function CancelParticipationButton({
  eventId,
}: CancelParticipationButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function cancelParticipation() {
    const confirmed = window.confirm(
      "Vuoi davvero annullare la tua partecipazione?"
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.rpc("cancel_my_participation", {
      p_event_id: eventId,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      {errorMessage ? (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={cancelParticipation}
        disabled={loading}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
      >
        {loading ? "Annullamento..." : "Annulla partecipazione"}
      </button>
    </div>
  );
}