import type { MetadataRoute } from "next";
import { createAdminClient } from "../lib/supabase/admin";

// Sitemap rigenerata al massimo ogni ora.
export const revalidate = 3600;

// Tutti i contenuti pubblici e indicizzabili del sito:
// - pagine fisse (home, legali, supporto)
// - profili dei club: pagine durature, senza scadenza
// - eventi attivi non ancora iniziati: i passati e i cancellati
//   restano accessibili via URL diretto ma non finiscono in sitemap
//   (e la pagina evento li mette in noindex tramite generateMetadata).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mancauno.it";
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/club`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/termini`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/supporto`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    return staticEntries;
  }

  const { data: clubs } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("account_type", "circolo")
    .is("banned_at", null);

  const clubEntries: MetadataRoute.Sitemap = (clubs ?? []).map(
    (club: { id: string }) => ({
      url: `${siteUrl}/club/${club.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  const { data: events } = await adminSupabase
    .from("events")
    .select("short_code")
    .eq("status", "active")
    .gte("starts_at", now.toISOString())
    .order("starts_at", { ascending: true })
    .limit(5000);

  const eventEntries: MetadataRoute.Sitemap = (events ?? []).map(
    (event: { short_code: string }) => ({
      url: `${siteUrl}/e/${event.short_code}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })
  );

  return [...staticEntries, ...clubEntries, ...eventEntries];
}
