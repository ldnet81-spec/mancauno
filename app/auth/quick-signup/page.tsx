"use client";

import BrandHeader from "../../../components/BrandHeader";
import { createClient } from "../../../lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function QuickSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const event = searchParams.get("event");

  const supabase = createClient();

  const [email, setEmail] = useState("test@mancauno.local");
  const [password, setPassword] = useState("test123456");
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function continueWithEmailPassword() {
    setLoading(true);
    setErrorMessage("");

    const next = event ? `/e/${event}?join=1` : "/profilo";

    const authResponse =
      mode === "login"
        ? await supabase.auth.signInWithPassword({
            email,
            password,
          })
        : await supabase.auth.signUp({
            email,
            password,
          });

    setLoading(false);

    if (authResponse.error) {
      setErrorMessage(authResponse.error.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl border border-gray-200 p-6">
        <div className="mb-6">
          <BrandHeader />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Accedi per unirti
        </h1>

        <p className="mt-2 text-gray-600">
          Accedi o crea un account per partecipare agli eventi.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg px-3 py-2 text-sm ${
              mode === "login" ? "bg-white shadow-sm" : "text-gray-600"
            }`}
          >
            Accedi
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg px-3 py-2 text-sm ${
              mode === "signup" ? "bg-white shadow-sm" : "text-gray-600"
            }`}
          >
            Registrati
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          />

          {errorMessage ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            onClick={continueWithEmailPassword}
            disabled={loading || !email || !password}
            className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Attendi..."
              : mode === "login"
                ? "Accedi"
                : "Crea account"}
          </button>

          {mode === "login" ? (
            <Link
              href="/auth/forgot-password"
              className="block text-center text-sm text-gray-600 underline"
            >
              Hai dimenticato la password?
            </Link>
          ) : null}

          <Link
            href="/"
            className="block text-center text-sm text-gray-500 underline"
          >
            Torna alla homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function QuickSignupPage() {
  return (
    <Suspense>
      <QuickSignupContent />
    </Suspense>
  );
}