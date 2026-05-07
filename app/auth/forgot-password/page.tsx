"use client";

import BrandHeader from "../../../components/BrandHeader";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function sendResetEmail() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      "Ti abbiamo inviato un link per reimpostare la password. Controlla la tua email."
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl border border-gray-200 p-6">
        <div className="mb-6">
          <BrandHeader />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Recupera password
        </h1>

        <p className="mt-2 text-gray-600">
          Inserisci la tua email. Ti manderemo un link per scegliere una nuova
          password.
        </p>

        <div className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="La tua email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            onClick={sendResetEmail}
            disabled={loading || !email}
            className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Invio in corso..." : "Invia link di recupero"}
          </button>

          <Link
            href="/auth/quick-signup"
            className="block text-center text-sm text-gray-600 underline"
          >
            Torna al login
          </Link>
        </div>
      </div>
    </main>
  );
}