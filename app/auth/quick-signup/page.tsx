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
  const nextParam = searchParams.get("next");

  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [accountType, setAccountType] = useState<"privato" | "circolo">(
    "privato"
  );
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [clubName, setClubName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function uploadAvatar(userId: string) {
    if (!avatarFile) {
      return null;
    }

    const fileExt = avatarFile.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function continueWithEmailPassword() {
    setLoading(true);
    setErrorMessage("");

    const next = event ? `/e/${event}?join=1` : nextParam || "/profilo";

    try {
      if (mode === "signup") {
        if (!email || !password) {
          setErrorMessage("Inserisci email e password.");
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setErrorMessage("La password deve avere almeno 8 caratteri.");
          setLoading(false);
          return;
        }

        if (!displayName.trim()) {
          setErrorMessage("Inserisci il tuo nome.");
          setLoading(false);
          return;
        }

        if (accountType === "circolo" && !clubName.trim()) {
          setErrorMessage("Inserisci il nome del circolo.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName.trim(),
              account_type: accountType,
              phone: phone.trim() || null,
              club_name:
                accountType === "circolo" ? clubName.trim() : null,
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        const user = data.user;

        if (!user) {
          setErrorMessage("Account creato. Controlla la tua email per confermare l'accesso.");
          setLoading(false);
          return;
        }

        let avatarUrl: string | null = null;

        if (data.session) {
          avatarUrl = await uploadAvatar(user.id);

          await supabase
            .from("profiles")
            .update({
              display_name: displayName.trim(),
              account_type: accountType,
              phone: phone.trim() || null,
              club_name:
                accountType === "circolo" ? clubName.trim() : null,
              avatar_url: avatarUrl,
            })
            .eq("id", user.id);
        }

        router.push(next);
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (error: any) {
      setErrorMessage(error.message || "Si è verificato un errore.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-white px-6 text-black">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
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
          {mode === "signup" ? (
            <>
              <label className="block">
                <span className="text-sm font-medium">Tipo account</span>

                <select
                  value={accountType}
                  onChange={(event) =>
                    setAccountType(event.target.value as "privato" | "circolo")
                  }
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
                >
                  <option value="privato">Utente privato</option>
                  <option value="circolo">Circolo</option>
                </select>
              </label>

              <input
                type="text"
                placeholder="Nome"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
              />

              {accountType === "circolo" ? (
                <input
                  type="text"
                  placeholder="Nome circolo"
                  value={clubName}
                  onChange={(event) => setClubName(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
                />
              ) : null}

              <input
                type="tel"
                placeholder="Telefono opzionale"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
              />

              <label className="block rounded-xl border border-dashed border-gray-300 bg-white p-4">
                <span className="text-sm font-medium">Foto profilo</span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setAvatarFile(event.target.files?.[0] ?? null)
                  }
                  className="mt-3 block w-full text-sm text-gray-600"
                />

                {avatarFile ? (
                  <p className="mt-2 text-xs text-gray-500">
                    File selezionato: {avatarFile.name}
                  </p>
                ) : null}
              </label>
            </>
          ) : null}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
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