"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type EventItem = {
  id: string;
  short_code: string;
  sport: string;
  sport_emoji: string;
  title: string;
  starts_at: string;
  location_name: string;
  city: string;
  remaining_spots: number;
  waitlisted_count?: number;
  creator_display_name?: string | null;
  creator_avatar_url?: string | null;
  creator_account_type?: string | null;
  creator_club_name?: string | null;
};

type SearchEventsProps = {
  events: EventItem[];
};

const sportFilters = [
  "Tutti",
  "Calcetto",
  "Padel",
  "Tennis",
  "Running",
  "Basket",
  "MTB",
  "Trekking",
  "Altro evento",
];

function formatEventDate(date: string) {
  const startsAt = new Date(date);

  const day = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(startsAt);

  const time = new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(startsAt);

  return `${day} · ${time}`;
}

function getCreatorName(event: EventItem) {
  if (event.creator_account_type === "circolo" && event.creator_club_name) {
    return event.creator_club_name;
  }

  return event.creator_display_name || "Organizzatore";
}

export default function SearchEvents({ events }: SearchEventsProps) {
  const [query, setQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("Tutti");

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const sortedEvents = [...events].sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    );

    return sortedEvents.filter((event) => {
      const matchesSport =
        selectedSport === "Tutti" || event.sport === selectedSport;

      const searchableText = [
        event.city,
        event.sport,
        event.title,
        event.location_name,
        event.creator_display_name,
        event.creator_club_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesSport && matchesQuery;
    });
  }, [events, query, selectedSport]);

  return (
    <>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
        {sportFilters.map((sport) => {
          const isActive = selectedSport === sport;

          return (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                isActive
                  ? "!bg-black !text-white"
                  : "border border-gray-200 bg-white text-gray-800"
              }`}
            >
              {sport}
            </button>
          );
        })}
      </div>

      <div className="mb-6">
        <label className="block">
          <span className="text-sm font-medium text-black">Cerca eventi</span>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca per città o attività"
            className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black outline-none focus:border-black"
          />
        </label>

        {query || selectedSport !== "Tutti" ? (
          <p className="mt-2 text-sm text-gray-600">
            {filteredEvents.length === 1
              ? "1 evento trovato"
              : `${filteredEvents.length} eventi trovati`}
          </p>
        ) : null}
      </div>

      <section className="space-y-3">
        {!filteredEvents.length ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-black">
            <h2 className="text-xl font-semibold">Nessun evento trovato</h2>

            <p className="mt-2 text-gray-600">
              Prova con un’altra città o attività, oppure crea un nuovo evento.
            </p>

            <Link
              href="/eventi/nuovo"
              className="mt-5 block rounded-xl bg-black px-4 py-3 text-center font-medium !text-white"
            >
              Crea evento
            </Link>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const creatorName = getCreatorName(event);

            return (
              <Link
                key={event.id}
                href={`/e/${event.short_code}`}
                className="block rounded-3xl border border-gray-200 bg-white p-5 text-black"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-4xl">{event.sport_emoji}</div>

                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-black">
                      {event.title}
                    </h2>

                    <p className="mt-2 text-sm text-gray-700">
                      {formatEventDate(event.starts_at)}
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {event.location_name}, {event.city}
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-black">
                        {event.creator_avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.creator_avatar_url}
                            alt={creatorName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          creatorName.slice(0, 1).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-black">
                          {creatorName}
                        </p>

                        <p className="text-xs text-gray-600">
                          {event.creator_account_type === "circolo"
                            ? "Circolo"
                            : "Organizzatore"}
                        </p>
                      </div>
                    </div>

                    {event.waitlisted_count && event.waitlisted_count > 0 ? (
                      <p className="mt-3 text-sm text-orange-700">
                        {event.waitlisted_count}{" "}
                        {event.waitlisted_count === 1
                          ? "persona in coda"
                          : "persone in coda"}
                      </p>
                    ) : null}
                  </div>

                  <span className="shrink-0 rounded-full bg-black px-3 py-1 text-sm font-medium !text-white">
                    {event.remaining_spots <= 0
                      ? "Completo"
                      : `-${event.remaining_spots}`}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </section>
    </>
  );
}