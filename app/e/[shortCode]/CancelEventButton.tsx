"use client";

import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CancelEventButtonProps = {
  eventId: string;
};

export default function CancelEventButton({ eventId }: CancelEventButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function cancelEvent() {
    const confirmed = window.confirm(
      "Vuoi davvero annullare questo evento? I partecipanti non potranno più unirsi."
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.rpc("cancel_event", {
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
        onClick={cancelEvent}
        disabled={loading}
        className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700 disabled:opacity-50"
      >
        {loading ? "Annullamento..." : "Annulla evento"}
      </button>
    </div>
  );
}