"use client";

import { useState } from "react";
import {
  toItalyDateInputValue,
  toItalyTimeInputValue,
} from "../../../../lib/date-time";

type EntryType = "open" | "approval";
type SkillLevel = "amatoriale" | "intermedio" | "esperto";

type EditEventFormProps = {
  event: {
    id: string;
    sport: string;
    sport_emoji: string;
    title: string;
    starts_at: string;
    location_name: string;
    city: string;
    total_spots: number;
    entry_type: EntryType;
    skill_level?: SkillLevel | null;
    notes: string | null;
  };
  approvedCount: number;
};

const sports = [
  { label: "Calcio/calcetto", emoji: "⚽" },
  { label: "Padel", emoji: "🎾" },
  { label: "Tennis", emoji: "🎾" },
  { label: "Beach volley", emoji: "🏐" },
  { label: "Basket", emoji: "🏀" },
  { label: "Running", emoji: "🏃" },
  { label: "MTB", emoji: "🚴" },
  { label: "Trekking", emoji: "🥾" },
  { label: "Nuoto", emoji: "🏊" },
  { label: "Allenamento", emoji: "🏋️" },
  { label: "Lezione privata", emoji: "🎯" },
  { label: "Altro evento", emoji: "✨" },
];

const skillLevels: Array<{
  value: SkillLevel;
  label: string;
  description: string;
}> = [
  {
    value: "amatoriale",
    label: "Amatoriale",
    description: "Per chi vuole divertirsi senza troppa competizione.",
  },
  {
    value: "intermedio",
    label: "Intermedio",
    description: "Per chi gioca gia con buona continuita.",
  },
  {
    value: "esperto",
    label: "Esperto",
    description: "Per partite o allenamenti piu intensi.",
  },
];

export default function EditEventForm({
  event,
  approvedCount,
}: EditEventFormProps) {
  const [sport, setSport] = useState(event.sport);
  const [sportEmoji, setSportEmoji] = useState(event.sport_emoji);
  const [date, setDate] = useState(toItalyDateInputValue(event.starts_at));
  const [time, setTime] = useState(toItalyTimeInputValue(event.starts_at));
  const [totalSpots, setTotalSpots] = useState(event.total_spots);

  function handleSportChange(value: string) {
    const selected = sports.find((item) => item.label === value);

    if (!selected) {
      return;
    }

    setSport(selected.label);
    setSportEmoji(selected.emoji);
  }

  const minSpots = Math.max(2, approvedCount || 0);

  return (
    <form
      method="post"
      action={`/api/events/${event.id}/update`}
      className="space-y-5"
    >
      <input type="hidden" name="sport_emoji" value={sportEmoji} />

      <section className="space-y-5 rounded-3xl border border-gray-200 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Cosa
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            Dettagli principali
          </h2>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-black">Sport</span>

          <select
            name="sport"
            value={sport}
            onChange={(changeEvent) => handleSportChange(changeEvent.target.value)}
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
            name="title"
            defaultValue={event.title}
            required
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
            Avvisa i partecipanti se cambi orario o luogo.
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-medium text-black">Data</span>

            <input
              type="date"
              name="date"
              value={date}
              onChange={(changeEvent) => setDate(changeEvent.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-black">Ora</span>

            <input
              type="time"
              name="time"
              value={time}
              onChange={(changeEvent) => setTime(changeEvent.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-black">Luogo</span>

          <input
            name="location_name"
            defaultValue={event.location_name}
            required
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">Citta</span>

          <input
            name="city"
            defaultValue={event.city}
            required
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>
      </section>

      <section className="space-y-5 rounded-3xl border border-gray-200 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Partecipazione
          </p>
          <h2 className="mt-1 text-xl font-semibold">Posti e richieste</h2>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-black">
            Posti totali
          </span>

          <input
            type="number"
            name="total_spots"
            min={minSpots}
            max={100}
            value={totalSpots}
            onChange={(changeEvent) =>
              setTotalSpots(Number(changeEvent.target.value))
            }
            required
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />

          {approvedCount > 0 ? (
            <span className="mt-2 block text-xs text-gray-500">
              Hai gia {approvedCount} partecipanti approvati: non puoi scendere
              sotto questo numero.
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">Ingresso</span>

          <select
            name="entry_type"
            defaultValue={event.entry_type}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          >
            <option value="approval">Richieste da approvare</option>
            <option value="open">Ingresso automatico finche ci sono posti</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">
            Livello dell'evento
          </span>

          <select
            name="skill_level"
            defaultValue={event.skill_level || "amatoriale"}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          >
            {skillLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label} - {level.description}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-black">Note</span>

          <textarea
            name="notes"
            defaultValue={event.notes ?? ""}
            rows={4}
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>
      </section>

      <button
        type="submit"
        className="w-full rounded-xl bg-black px-5 py-3 font-semibold !text-white"
      >
        Salva modifiche e avvisa i partecipanti
      </button>
    </form>
  );
}
