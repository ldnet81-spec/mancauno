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
    avatar_url: string | null;
    account_type: string | null;
    phone: string | null;
    club_name: string | null;
  };
};

export default function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [accountType, setAccountType] = useState<"privato" | "circolo">(
    profile.account_type === "circolo" ? "circolo" : "privato"
  );
  const [clubName, setClubName] = useState(profile.club_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

async function uploadAvatar() {
  if (!avatarFile) {
    return avatarUrl || null;
  }

  if (!avatarFile.type.startsWith("image/")) {
    throw new Error("Carica un file immagine valido.");
  }

  if (avatarFile.size > 3 * 1024 * 1024) {
    throw new Error("L'immagine non può superare 3 MB.");
  }

  const fileExt = avatarFile.name.split(".").pop() || "jpg";
  const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, avatarFile, {
      upsert: false,
      cacheControl: "0",
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

  return `${data.publicUrl}?v=${Date.now()}`;
  }

  async function saveProfile() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (accountType === "circolo" && !clubName.trim()) {
        setErrorMessage("Inserisci il nome del circolo.");
        setLoading(false);
        return;
      }

      const uploadedAvatarUrl = await uploadAvatar();

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          city: city.trim() || null,
          bio: bio.trim() || null,
          phone: phone.trim() || null,
          account_type: accountType,
          club_name: accountType === "circolo" ? clubName.trim() : null,
          avatar_url: uploadedAvatarUrl,
        })
        .eq("id", profile.id);

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setAvatarUrl(uploadedAvatarUrl ?? "");
      setMessage("Profilo salvato.");
      router.refresh();
    } catch (error: any) {
      setErrorMessage(error.message || "Errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <span className="text-sm font-medium">Foto profilo</span>

        <div className="mt-3 flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gray-100 text-2xl font-semibold">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Foto profilo"
                className="h-full w-full object-cover"
              />
            ) : (
              (displayName || "U").slice(0, 1).toUpperCase()
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600"
          />
        </div>
      </div>

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

      {accountType === "circolo" ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Pagina club inclusa</p>
              <p className="mt-1 text-sm text-gray-600">
                Piano Free: fino a 8 eventi al mese. Il piano Pro con eventi
                illimitati sara disponibile piu avanti.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-black px-3 py-1 text-xs font-semibold !text-white">
              Club
            </span>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium">Nome circolo</span>
            <input
              value={clubName}
              onChange={(event) => setClubName(event.target.value)}
              placeholder="Nome del circolo"
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
            />
          </label>
        </div>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium">Nome pubblico</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Il tuo nome"
          className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Telefono</span>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder={
            accountType === "circolo"
              ? "Telefono o WhatsApp del circolo"
              : "Telefono opzionale"
          }
          className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Città</span>
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Milano"
          className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Bio</span>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder={
            accountType === "circolo"
              ? "Descrivi il circolo, gli sport disponibili, i servizi e perche partecipare ai vostri eventi."
              : "Racconta qualcosa di te."
          }
          rows={4}
          className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black"
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
