"use client";

import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProfileFormProps = {
  profile: {
    id: string;
    display_name: string | null;
    city: string | null;
    bio: string | null;
  };
};

export default function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function saveProfile() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        city: city.trim() || null,
        bio: bio.trim() || null,
      })
      .eq("id", profile.id);

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Profilo salvato.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium">Nome pubblico</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Il tuo nome"
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Città</span>
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Milano"
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Bio</span>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Racconta qualcosa di te."
          rows={4}
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
        />
      </label>

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
        type="button"
        onClick={saveProfile}
        disabled={loading}
        className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Salvataggio..." : "Salva profilo"}
      </button>
    </div>
  );
}