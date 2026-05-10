"use client";

import { createClient } from "../../../lib/supabase/client";
import AppHeader from "../../../components/AppHeader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

type EntryType = "open" | "approval";

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
  const [entryType, setEntryType] = useState<EntryType>("approval");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [restoreMessage, setRestoreMessage] = useState("");

  useEffect(() => {
    const savedEvent = localStorage.getItem("mancauno_pending_event");

    if (!savedEvent) {
      return;
    }

    try {
      const parsed = JSON.parse(savedEvent);

      setSport(parsed.sport ?? "Calcetto");
      setSportEmoji(parsed.sportEmoji ?? "⚽");
      setTitle(parsed.title ?? "");
      setDate(parsed.date ?? "");
      setTime(parsed.time ?? "");
      setLocationName(parsed.locationName ?? "");
      setCity(parsed.city ?? "");
      setTotalSpots(parsed.totalSpots ?? 10);
      setEntryType(parsed.entryType ?? "approval");
      setNotes(parsed.notes ?? "");

      setRestoreMessage(
        "Abbiamo recuperato l’evento che stavi creando. Controlla i dati e clicca di nuovo su Crea evento."
      );

      localStorage.removeItem("mancauno_pending_event");
    } catch {
      localStorage.removeItem("mancauno_pending_event");
    }
  }, []);

  function handleSportChange(value: string) {
    const selected = sports.find((item) => item.label === value);

    if (!selected) {
      return;
    }

    setSport(selected.label);
    setSportEmoji(selected.emoji);
  }

  function savePendingEventBeforeLogin() {
    localStorage.setItem(
      "mancauno_pending_event",
      JSON.stringify({
        sport,
        sportEmoji,
        title,
        date,
        time,
        locationName,
        city,
        totalSpots,
        entryType,
        notes,
      })
    );
  }

  async function createEvent() {
    setLoading(true);
    setErrorMessage("");
    setRestoreMessage("");

    if (!title || !date || !time || !locationName || !city || !totalSpots) {
      setErrorMessage("Compila tutti i campi obbligatori.");
      setLoading(false);
      return;
    }

    if (totalSpots < 2 || totalSpots > 100) {
      setErrorMessage("Il numero di partecipanti deve essere tra 2 e 100.");
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
      savePendingEventBeforeLogin();

      router.push("/auth/quick-signup?next=/eventi/nuovo&restoreEvent=1");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("create_event", {
      p_sport: sport,
      p_sport_emoji: sportEmoji,
      p_title: title.trim(),
      p_starts_at: startsAt.toISOString(),
      p_location_name: locationName.trim(),
      p_city: city.trim(),
      p_total_spots: totalSpots,
      p_entry_type: entryType,
      p_address: locationName.trim(),
      p_lat: null,
      p_lng: null,
      p_notes: notes.trim() || "",
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
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 pb-28 pt-8 text-black sm:pb-8">
      <AppHeader />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Crea evento
        </h1>

        <p className="mt-2 text-gray-600">
          Crea un link da condividere quando ti manca qualcuno.
        </p>
      </div>

      {restoreMessage ? (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
          {restoreMessage}
        </div>
      ) : null}

      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-black">Sport</span>

          <select
            value={sport}
            onChange={(event) => handleSportChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          >
            {sports.map((item) => (
              <option key={item.label} value={item.label}>
                {item.emoji} {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">Titolo</span>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Calcetto venerdì sera"
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-black">Data</span>

            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-black">Ora</span>

            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-black">
            Indirizzo o luogo
          </span>

          <input
            value={locationName}
            onChange={(event) => setLocationName(event.target.value)}
            placeholder="Via Monte Amaro 10"
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">Città</span>

          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Avezzano"
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">
            Numero partecipanti
          </span>

          <input
            type="number"
            min={2}
            max={100}
            value={totalSpots}
            onChange={(event) => setTotalSpots(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />

          <p className="mt-2 text-xs text-gray-600">
            Puoi creare eventi da 2 fino a 100 partecipanti.
          </p>
        </label>

        <div>
          <span className="text-sm font-medium text-black">
            Tipo partecipazione
          </span>

          <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setEntryType("open")}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                entryType === "open"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-700"
              }`}
            >
              Ingresso libero
            </button>

            <button
              type="button"
              onClick={() => setEntryType("approval")}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                entryType === "approval"
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-700"
              }`}
            >
              Su autorizzazione
            </button>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-black">Note</span>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Campo prenotato, quota 5€ a persona, portare maglia chiara e scura."
            rows={4}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        {errorMessage ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={createEvent}
          disabled={loading}
          className="w-full rounded-xl bg-black px-4 py-3 font-medium !text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creazione in corso..." : "Crea evento"}
        </button>
      </div>
    </main>
  );
}
