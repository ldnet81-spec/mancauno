"use client";

import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type JoinEventButtonProps = {
  shortCode: string;
  isFull: boolean;
  isUnavailable: boolean;
  initialStatus?: string | null;
};

function CreateEventCta() {
  return (
    <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
      <p className="font-black text-slate-950">
        Vuoi creare anche tu un evento?
      </p>
      <p className="mt-1 text-sm leading-5 text-slate-600">
        Ti bastano 30 secondi per creare un link e condividerlo con i tuoi
        amici.
      </p>
      <Link
        href="/eventi/nuovo"
        className="mt-3 block rounded-xl bg-blue-600 px-4 py-3 font-black !text-white"
      >
        Crea il tuo evento
      </Link>
    </div>
  );
}

export default function JoinEventButton({
  shortCode,
  isFull,
  isUnavailable,
  initialStatus,
}: JoinEventButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(initialStatus ?? null);
  const [errorMessage, setErrorMessage] = useState("");

  async function joinEvent() {
    if (isUnavailable) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/auth/quick-signup?event=${shortCode}`);
      return;
    }

    const { data, error } = await supabase.rpc("join_event_by_short_code", {
      p_short_code: shortCode,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setStatus(data.status);
    router.refresh();
  }

  if (isUnavailable) {
    return (
      <div className="space-y-2">
        <button
          disabled
          className="w-full rounded-xl bg-gray-200 px-4 py-3 font-medium text-gray-500"
        >
          Evento non disponibile
        </button>

        <p className="text-center text-xs text-gray-500">
          Non è possibile unirsi o mettersi in coda.
        </p>
      </div>
    );
  }

  if (status === "creator") {
    return (
      <button
        disabled
        className="w-full rounded-xl bg-gray-200 px-4 py-3 font-medium text-gray-500"
      >
        Sei tu il creatore
      </button>
    );
  }

  if (status === "approved") {
    return (
      <div>
        <button
          disabled
          className="w-full rounded-xl bg-green-600 px-4 py-3 font-medium text-white"
        >
          Partecipi
        </button>
        <CreateEventCta />
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div>
        <button
          disabled
          className="w-full rounded-xl bg-gray-900 px-4 py-3 font-medium text-white"
        >
          Richiesta inviata
        </button>
        <CreateEventCta />
      </div>
    );
  }

  if (status === "waitlisted") {
    return (
      <div>
        <button
          disabled
          className="w-full rounded-xl bg-orange-500 px-4 py-3 font-medium text-white"
        >
          Sei in coda
        </button>
        <CreateEventCta />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errorMessage ? (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        onClick={joinEvent}
        disabled={loading}
        className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading
          ? "Invio richiesta..."
          : isFull
            ? "Mettimi in coda"
            : "Voglio unirmi"}
      </button>

      {isFull ? (
        <p className="text-center text-xs text-gray-500">
          L’evento è completo, ma puoi metterti in coda.
        </p>
      ) : null}
    </div>
  );
}
