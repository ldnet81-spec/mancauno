import type { MetadataRoute } from "next";
import { createAdminClient } from "../lib/supabase/admin";

// Sitemap rigenerata al massimo ogni ora.
export const revalidate = 3600;

// Data di ultima modifica delle pagine statiche/legali: cambiala a mano quando
// aggiorni davvero quei contenuti. NON usare "now()" qui: direbbe a Google che
// cambiano ogni ora, rendendo il lastmod inaffidabile per tutto il sito.
const STATIC_PAGE_DATE = new Date("2026-05-01T00:00:00Z");

function toDate(value: string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function maxDate(dates: Date[], fallback: Date): Date {
  if (!dates.length) return fallback;
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

// Tutti i contenuti pubblici e indicizzabili del sito:
// - pagine fisse (home, legali, supporto)
// - profili dei club: pagine durature, senza scadenza
// - eventi attivi non ancora iniziati: i passati e i cancellati restano
//   accessibili via URL diretto ma non finiscono in sitemap (e la pagina
//   evento li mette in noindex tramite generateMetadata).
//
// lastmod: ogni URL riporta la propria data reale (created_at), non la data di
// generazione della sitemap. Un lastmod veritiero e' cio' che Google usa per
// decidere cosa ri-scansionare: se e' sempre "oggi" per tutto, lo ignora.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mancauno.it";
  const now = new Date();

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    return [
      { url: siteUrl, changeFrequency: "daily", priority: 1 },
      { url: `${siteUrl}/club`, changeFrequency: "daily", priority: 0.8 },
    ];
  }

  // Preferiamo updated_at (riflette le modifiche reali). Se la colonna non
  // esiste ancora (deploy prima della migrazione SQL) ripieghiamo su
  // created_at senza rompere la sitemap.
  type ClubRow = {
    id: string;
    slug: string | null;
    created_at: string | null;
    updated_at?: string | null;
  };
  type EventRow = {
    short_code: string;
    slug: string | null;
    created_at: string | null;
    updated_at?: string | null;
  };

  let clubs: ClubRow[] = [];
  {
    const withUpdated = await adminSupabase
      .from("profiles")
      .select("id, slug, created_at, updated_at")
      .eq("account_type", "circolo")
      .is("banned_at", null);
    if (withUpdated.error) {
      const fallback = await adminSupabase
        .from("profiles")
        .select("id, slug, created_at")
        .eq("account_type", "circolo")
        .is("banned_at", null);
      clubs = (fallback.data as ClubRow[] | null) ?? [];
    } else {
      clubs = (withUpdated.data as ClubRow[] | null) ?? [];
    }
  }

  let events: EventRow[] = [];
  {
    const withUpdated = await adminSupabase
      .from("events")
      .select("short_code, slug, created_at, updated_at")
      .eq("status", "active")
      .gte("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(5000);
    if (withUpdated.error) {
      const fallback = await adminSupabase
        .from("events")
        .select("short_code, slug, created_at")
        .eq("status", "active")
        .gte("starts_at", now.toISOString())
        .order("starts_at", { ascending: true })
        .limit(5000);
      events = (fallback.data as EventRow[] | null) ?? [];
    } else {
      events = (withUpdated.data as EventRow[] | null) ?? [];
    }
  }

  // lastmod per riga: updated_at se disponibile, altrimenti created_at.
  const clubLastMod = (c: ClubRow) =>
    toDate(c.updated_at ?? c.created_at, STATIC_PAGE_DATE);
  const eventLastMod = (e: EventRow) =>
    toDate(e.updated_at ?? e.created_at, STATIC_PAGE_DATE);

  const clubDates = clubs.map(clubLastMod);
  const eventDates = events.map(eventLastMod);

  // Home e directory cambiano quando compaiono nuovi contenuti: usiamo la data
  // del contenuto piu' recente, non "now".
  const latestClub = maxDate(clubDates, STATIC_PAGE_DATE);
  const latestContent = maxDate([...clubDates, ...eventDates], STATIC_PAGE_DATE);

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: latestContent,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/club`,
      lastModified: latestClub,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: STATIC_PAGE_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/termini`,
      lastModified: STATIC_PAGE_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/supporto`,
      lastModified: STATIC_PAGE_DATE,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Priorita alta (0.9) per i club: sono il fulcro della monetizzazione.
  const clubEntries: MetadataRoute.Sitemap = clubs.map((club) => ({
    url: `${siteUrl}/club/${club.slug ?? club.id}`,
    lastModified: clubLastMod(club),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${siteUrl}/e/${event.slug ?? event.short_code}`,
    lastModified: eventLastMod(event),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...clubEntries, ...eventEntries];
}
