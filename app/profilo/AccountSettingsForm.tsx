"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

type AccountSettingsFormProps = {
  currentEmail: string;
};

export default function AccountSettingsForm({
  currentEmail,
}: AccountSettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState(currentEmail);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function updateEmail() {
    const nextEmail = email.trim().toLowerCase();

    setEmailLoading(true);
    setEmailMessage("");
    setEmailError("");

    if (!nextEmail) {
      setEmailError("Inserisci un indirizzo email valido.");
      setEmailLoading(false);
      return;
    }

    if (nextEmail === currentEmail.toLowerCase()) {
      setEmailError("Questo indirizzo email e gia quello attuale.");
      setEmailLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser(
      { email: nextEmail },
      { emailRedirectTo: `${window.location.origin}/profilo` }
    );

    setEmailLoading(false);

    if (error) {
      setEmailError(error.message);
      return;
    }

    setEmailMessage(
      "Ti abbiamo inviato un link di conferma. L'email cambiera dopo la conferma."
    );
  }

  async function updatePassword() {
    setPasswordLoading(true);
    setPasswordMessage("");
    setPasswordError("");

    if (password.length < 8) {
      setPasswordError("La password deve avere almeno 8 caratteri.");
      setPasswordLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Le password non coincidono.");
      setPasswordLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    setPasswordLoading(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password aggiornata correttamente.");
    router.refresh();
  }

  return (
    <div className="mt-5 space-y-6">
      <div className="rounded-2xl bg-gray-50 p-4">
        <h3 className="font-semibold">Email di accesso</h3>
        <p className="mt-1 text-sm text-gray-600">
          Userai questa email per entrare nel tuo profilo e ricevere le
          comunicazioni dell&apos;account.
        </p>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Nuova email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
          />
        </label>

        {emailMessage ? (
          <div className="mt-3 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            {emailMessage}
          </div>
        ) : null}

        {emailError ? (
          <div className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {emailError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={updateEmail}
          disabled={emailLoading}
          className="mt-4 w-full rounded-xl border border-blue-600 px-4 py-3 font-semibold text-blue-700 disabled:opacity-50"
        >
          {emailLoading ? "Invio conferma..." : "Aggiorna email"}
        </button>
      </div>

      <div className="rounded-2xl bg-gray-50 p-4">
        <h3 className="font-semibold">Password</h3>
        <p className="mt-1 text-sm text-gray-600">
          Scegli una password di almeno 8 caratteri.
        </p>

        <div className="mt-4 grid gap-3">
          <label className="block">
            <span className="text-sm font-medium">Nuova password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Conferma password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </label>
        </div>

        {passwordMessage ? (
          <div className="mt-3 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            {passwordMessage}
          </div>
        ) : null}

        {passwordError ? (
          <div className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {passwordError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={updatePassword}
          disabled={passwordLoading || !password || !confirmPassword}
          className="mt-4 w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {passwordLoading ? "Aggiornamento..." : "Aggiorna password"}
        </button>
      </div>
    </div>
  );
}
