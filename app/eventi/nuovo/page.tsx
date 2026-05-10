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

  function setQuickDate(daysFromToday: number) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysFromToday);

    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, "0");
    const day = String(nextDate.getDate()).padStart(2, "0");

    setDate(`${year}-${month}-${day}`);
  }

  function updateTotalSpots(nextValue: number) {
    const safeValue = Number.isFinite(nextValue) ? nextValue : 2;
    const clampedValue = Math.min(100, Math.max(2, safeValue));
    setTotalSpots(clampedValue);
  }

  function getPreviewDate() {
    if (!date || !time) {
      return "Data e ora da scegliere";
    }

    const startsAt = new Date(`${date}T${time}`);

    if (Number.isNaN(startsAt.getTime())) {
      return "Data e ora non valide";
    }

    return new Intl.DateTimeFormat("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(startsAt);
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

  const completedRequiredFields = [
    title.trim(),
    date,
    time,
    locationName.trim(),
    city.trim(),
    totalSpots >= 2 ? String(totalSpots) : "",
  ].filter(Boolean).length;

  const isEventReady = completedRequiredFields === 6;
  const previewTitle = title.trim() || `${sport} da organizzare`;
  const previewLocation =
    [locationName.trim(), city.trim()].filter(Boolean).join(", ") ||
    "Luogo da indicare";

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-6 py-8 text-black">
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
        <div className="rounded-2xl bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-black">
              Dati essenziali
            </p>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
              {completedRequiredFields}/6 completati
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-black transition-all"
              style={{ width: `${(completedRequiredFields / 6) * 100}%` }}
            />
          </div>
        </div>

        <section className="space-y-5 rounded-3xl border border-gray-200 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Cosa
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              Che evento vuoi creare?
            </h2>
          </div>

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
        </section>

        <section className="space-y-5 rounded-3xl border border-gray-200 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Quando e dove
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              Aiuta le persone a capire subito se possono esserci.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
            >
              Oggi
            </button>

            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
            >
              Domani
            </button>

            <button
              type="button"
              onClick={() => setTime(time || "20:00")}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
            >
              Sera
            </button>
          </div>

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
        </section>

        <section className="space-y-5 rounded-3xl border border-gray-200 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Posti e regole
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              Decidi quanti posti ci sono e come gestire le richieste.
            </h2>
          </div>

          <div>
            <span className="text-sm font-medium text-black">
              Numero partecipanti
            </span>

            <div className="mt-2 grid grid-cols-[48px_1fr_48px] gap-2">
              <button
                type="button"
                onClick={() => updateTotalSpots(totalSpots - 1)}
                className="rounded-xl border border-gray-300 text-xl font-semibold"
              >
                -
              </button>

              <input
                type="number"
                min={2}
                max={100}
                value={totalSpots}
                onChange={(event) =>
                  updateTotalSpots(Number(event.target.value))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-black outline-none focus:border-black"
              />

              <button
                type="button"
                onClick={() => updateTotalSpots(totalSpots + 1)}
                className="rounded-xl border border-gray-300 text-xl font-semibold"
              >
                +
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-600">
              Puoi creare eventi da 2 fino a 100 partecipanti.
            </p>
          </div>

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
        </section>

        <section className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{sportEmoji}</div>

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Anteprima
              </p>

              <h2 className="mt-1 text-lg font-semibold text-black">
                {previewTitle}
              </h2>

              <p className="mt-2 text-sm text-gray-700">
                {getPreviewDate()}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {previewLocation}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                  {totalSpots} posti
                </span>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700">
                  {entryType === "open"
                    ? "Ingresso libero"
                    : "Su autorizzazione"}
                </span>
              </div>
            </div>
          </div>

          {!isEventReady ? (
            <p className="mt-4 text-sm text-gray-600">
              Completa i dati essenziali per pubblicare l'evento.
            </p>
          ) : null}
        </section>

        {errorMessage ? (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={createEvent}
          disabled={loading || !isEventReady}
          className="w-full rounded-xl bg-black px-4 py-3 font-medium !text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creazione in corso..." : "Crea evento"}
        </button>
      </div>
    </main>
  );
}
