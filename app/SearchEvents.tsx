"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDateItaly, formatTimeItaly } from "../lib/date-time";

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
  skill_level?: string | null;
  waitlisted_count?: number;
  creator_display_name?: string | null;
  creator_avatar_url?: string | null;
  creator_account_type?: string | null;
  creator_club_name?: string | null;
  creator_id?: string | null;
};

type SearchEventsProps = {
  events: EventItem[];
  initialQuery?: string;
};

type DateFilter = "all" | "today" | "tomorrow" | "weekend";
type SortFilter = "date" | "spots";

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

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function matchesDateFilter(date: string, filter: DateFilter) {
  if (filter === "all") {
    return true;
  }

  const startsAt = new Date(date);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (filter === "today") {
    return isSameDay(startsAt, today);
  }

  if (filter === "tomorrow") {
    return isSameDay(startsAt, tomorrow);
  }

  const day = startsAt.getDay();
  return day === 0 || day === 6;
}

function getCreatorName(event: EventItem) {
  if (event.creator_account_type === "circolo" && event.creator_club_name) {
    return event.creator_club_name;
  }

  return event.creator_display_name || "Organizzatore";
}

function getAvailabilityBadge(remainingSpots: number) {
  if (remainingSpots <= 0) {
    return {
      label: "Completo",
      className: "bg-gray-100 text-gray-700",
    };
  }

  if (remainingSpots === 1) {
    return {
      label: "Ultimo posto",
      className: "bg-green-600 !text-white",
    };
  }

  return {
    label: `Mancano ${remainingSpots} posti`,
    className: "bg-black !text-white",
  };
}

function formatSkillLevel(level: string | null | undefined) {
  if (level === "intermedio") {
    return "Intermedio";
  }

  if (level === "esperto") {
    return "Esperto";
  }

  return "Amatoriale";
}

export default function SearchEvents({
  events,
  initialQuery = "",
}: SearchEventsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedSport, setSelectedSport] = useState("Tutti");
  const [selectedCity, setSelectedCity] = useState("Tutte");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<SortFilter>("date");

  const cityOptions = useMemo(() => {
    return Array.from(
      new Set(events.map((event) => event.city).filter(Boolean))
    ).sort((firstCity, secondCity) =>
      firstCity.localeCompare(secondCity, "it")
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const sortedEvents = [...events].sort((a, b) => {
      if (sortBy === "spots") {
        const spotsDifference = b.remaining_spots - a.remaining_spots;

        if (spotsDifference !== 0) {
          return spotsDifference;
        }
      }

      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    });

    return sortedEvents.filter((event) => {
      const matchesSport =
        selectedSport === "Tutti" || event.sport === selectedSport;
      const matchesCity =
        selectedCity === "Tutte" || event.city === selectedCity;
      const matchesDate = matchesDateFilter(event.starts_at, dateFilter);
      const matchesAvailability = !onlyAvailable || event.remaining_spots > 0;

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

      return (
        matchesSport &&
        matchesCity &&
        matchesDate &&
        matchesAvailability &&
        matchesQuery
      );
    });
  }, [
    dateFilter,
    events,
    onlyAvailable,
    query,
    selectedCity,
    selectedSport,
    sortBy,
  ]);

  const hasActiveFilters =
    query ||
    selectedSport !== "Tutti" ||
    selectedCity !== "Tutte" ||
    dateFilter !== "all" ||
    onlyAvailable ||
    sortBy !== "date";

  function resetFilters() {
    setQuery("");
    setSelectedSport("Tutti");
    setSelectedCity("Tutte");
    setDateFilter("all");
    setOnlyAvailable(false);
    setSortBy("date");
  }

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

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-600">Citta</span>

            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
            >
              <option value="Tutte">Tutte</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">Quando</span>

            <select
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value as DateFilter)
              }
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
            >
              <option value="all">Qualsiasi data</option>
              <option value="today">Oggi</option>
              <option value="tomorrow">Domani</option>
              <option value="weekend">Weekend</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">Ordina</span>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortFilter)}
              className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black"
            >
              <option value="date">Prima i prossimi</option>
              <option value="spots">Prima con piu posti</option>
            </select>
          </label>

          <label className="mt-5 flex min-h-10 items-center rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(event) => setOnlyAvailable(event.target.checked)}
              className="mr-2 h-4 w-4"
            />
            Solo con posti
          </label>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {hasActiveFilters
              ? filteredEvents.length === 1
                ? "1 evento trovato"
                : `${filteredEvents.length} eventi trovati`
              : `${events.length} eventi disponibili`}
          </p>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-black underline underline-offset-4"
            >
              Azzera
            </button>
          ) : null}
        </div>
      </div>

      <section className="space-y-3">
        {!filteredEvents.length ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-black">
            <h2 className="text-xl font-semibold">Nessun evento trovato</h2>

            <p className="mt-2 text-gray-600">
              Prova con un’altra città o attività, oppure crea un nuovo evento.
            </p>

            {cityOptions.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {cityOptions.slice(0, 4).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setSelectedCity(city)}
                    className="rounded-full border border-gray-200 px-3 py-1 text-sm font-medium text-gray-700"
                  >
                    {city}
                  </button>
                ))}
              </div>
            ) : null}

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
            const availabilityBadge = getAvailabilityBadge(
              event.remaining_spots
            );

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
                      {formatDateItaly(event.starts_at)} ·{" "}
                      {formatTimeItaly(event.starts_at)}
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {event.location_name}, {event.city}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        Livello {formatSkillLevel(event.skill_level)}
                      </span>
                    </div>

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
                            ? "Club"
                            : "Organizzatore"}
                        </p>
                      </div>
                    </div>

                    {event.creator_account_type === "circolo" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold !text-white">
                          Club
                        </span>

                        {event.creator_id ? (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            Pagina club disponibile
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {event.waitlisted_count && event.waitlisted_count > 0 ? (
                      <p className="mt-3 text-sm text-orange-700">
                        {event.waitlisted_count}{" "}
                        {event.waitlisted_count === 1
                          ? "persona in coda"
                          : "persone in coda"}
                      </p>
                    ) : null}
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${availabilityBadge.className}`}
                  >
                    {availabilityBadge.label}
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
