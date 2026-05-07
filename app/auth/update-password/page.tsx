"use client";

import BrandHeader from "../../../components/BrandHeader";
import { createClient } from "../../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function updatePassword() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("La password deve avere almeno 8 caratteri.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Le password non coincidono.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Password aggiornata correttamente.");

    setTimeout(() => {
      router.push("/profilo");
      router.refresh();
    }, 1000);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl border border-gray-200 p-6">
        <div className="mb-6">
          <BrandHeader />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Scegli nuova password
        </h1>

        <p className="mt-2 text-gray-600">
          Inserisci una nuova password per il tuo account.
        </p>

        <div className="mt-6 space-y-3">
          <input
            type="password"
            placeholder="Nuova password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          />

          <input
            type="password"
            placeholder="Conferma password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          />

          {message ? (
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">
              {message}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            onClick={updatePassword}
            disabled={loading || !password || !confirmPassword}
            className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Aggiornamento..." : "Aggiorna password"}
          </button>
        </div>
      </div>
    </main>
  );
}