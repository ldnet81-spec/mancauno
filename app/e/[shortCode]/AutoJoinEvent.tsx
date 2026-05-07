"use client";

import { createClient } from "../../../lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type AutoJoinEventProps = {
  shortCode: string;
};

export default function AutoJoinEvent({ shortCode }: AutoJoinEventProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function autoJoin() {
      const shouldJoin = searchParams.get("join") === "1";

      if (!shouldJoin) {
        return;
      }

      setMessage("Sto inviando la tua richiesta...");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/auth/quick-signup?event=${shortCode}`);
        return;
      }

      const { error } = await supabase.rpc("join_event_by_short_code", {
        p_short_code: shortCode,
      });

      if (error) {
        setMessage(error.message);
        router.replace(`/e/${shortCode}`);
        router.refresh();
        return;
      }

      setMessage("Richiesta inviata.");
      router.replace(`/e/${shortCode}`);
      router.refresh();
    }

    autoJoin();
  }, [searchParams, shortCode, supabase, router]);

  if (!message) {
    return null;
  }

  return (
    <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
      {message}
    </div>
  );
}