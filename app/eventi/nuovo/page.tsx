"use client";

import { createClient } from "../../../lib/supabase/client";
import BrandHeader from "../../../components/BrandHeader";
import { useRouter } from "next/navigation";
import { useState } from "react";


const sports = [
  { label: "Calcetto", emoji: "⚽" },
  { label: "Padel", emoji: "🎾" },
  { label: "Tennis", emoji: "🎾" },
  { label: "Beach volley", emoji: "🏐" },
  { label: "Basket", emoji: "🏀" },
  { label: "Running", emoji: "🏃" },
  { label: "MTB", emoji: "🚴" },
  { label: "Trekking", emoji: "🥾" },
  { label: "Nuoto", emoji: "🏊" },
  { label: "Allenamento", emoji: "⛹️" },
  { label: "Altro evento", emoji: "✨" },
];

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();

  const [sport, setSport] = useState("Calcetto");
  const [sportEmoji, setSportEmoji] = useState("⚽");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [city, setCity] = useState("");
  const [totalSpots, setTotalSpots] = useState(10);
  const [entryType, setEntryType] = useState<"open" | "approval">("approval");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleSportChange(value: string) {
    const selected = sports.find((item) => item.label === value);

    if (!selected) {
      return;
    }

    setSport(selected.label);
    setSportEmoji(selected.emoji);
  }

  async function createEvent() {
    setLoading(true);
    setErrorMessage("");

    if (!title || !date || !time || !locationName || !city || !totalSpots) {
      setErrorMessage("Compila tutti i campi obbligatori.");
      setLoading(false);
      return;
    }

    const startsAt = new Date(`${date}T${time}`);

    if (Number.isNaN(startsAt.getTime())) {
      setErrorMessage("Data o ora non valide.");
      setLoading(false);
      return;
    }

    if (startsAt <= new Date()) {
      setErrorMessage("La data dell’evento non può essere nel passato.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/auth/quick-signup");
      return;
    }

    const { data, error } = await supabase.rpc("create_event", {
      p_sport: sport,
      p_sport_emoji: sportEmoji,
      p_title: title,
      p_starts_at: startsAt.toISOString(),
      p_location_name: locationName,
      p_city: city,
      p_total_spots: totalSpots,
      p_entry_type: entryType,
      p_address: locationName || "",
      p_lat: null,
      p_lng: null,
      p_notes: notes || "",
    });

    setLoading(false);

    if (error) {
      setErrorMessage(
        `${error.message}${error.details ? ` — ${error.details}` : ""}`
      );
      return;
    }

    if (!data?.short_code) {
      setErrorMessage("Evento creato, ma short code mancante.");
      return;
    }

    router.push(`/e/${data.short_code}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-8">
      <div className="mb-8">
        <BrandHeader />

        <h1 className="mt-8 text-3xl font-semibold tracking-tight">
          Crea evento
        </h1>

        <p className="mt-2 text-gray-600">
          Crea un link da condividere quando ti manca qualcuno.
        </p>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium">Sport</span>
          <select
            value={sport}
            onChange={(event) => handleSportChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3"
          >
            {sports.map((item) => (
              <option key={item.label} value={item.label}>
                {item.emoji} {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Titolo</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Calcetto venerdì sera"
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium">Data</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Ora</span>
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Luogo</span>
          <input
            value={locationName}
            onChange={(event) => setLocationName(event.target.value)}
            placeholder="Centro sportivo Kennedy"
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
          <span className="text-sm font-medium">Posti totali</span>
          <input
            type="number"
            min={2}
            max={50}
            value={totalSpots}
            onChange={(event) => setTotalSpots(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </label>

        <div>
          <span className="text-sm font-medium">Tipo partecipazione</span>

          <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setEntryType("open")}
              className={`rounded-lg px-3 py-2 text-sm ${
                entryType === "open" ? "bg-white shadow-sm" : "text-gray-600"
              }`}
            >
              Ingresso libero
            </button>

            <button
              type="button"
              onClick={() => setEntryType("approval")}
              className={`rounded-lg px-3 py-2 text-sm ${
                entryType === "approval" ? "bg-white shadow-sm" : "text-gray-600"
              }`}
            >
              Su autorizzazione
            </button>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Note</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Portare maglia chiara e scura. Campo già prenotato."
            rows={4}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </label>

        {errorMessage ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          onClick={createEvent}
          disabled={loading}
          className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creazione in corso..." : "Crea evento"}
        </button>
      </div>
    </main>
  );
}