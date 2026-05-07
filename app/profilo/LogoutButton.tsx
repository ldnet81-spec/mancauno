"use client";

import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);

    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-black disabled:opacity-50"
    >
      {loading ? "Uscita in corso..." : "Esci"}
    </button>
  );
}