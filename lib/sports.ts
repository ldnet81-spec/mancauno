// Lista canonica degli sport supportati su mancauno.it.
// E' la sorgente unica di verita: viene usata sia dal modulo di creazione
// evento (app/eventi/nuovo/page.tsx) sia dal filtro della directory club
// (app/club/page.tsx). Modificarla solo qui per tenerle allineate.
export const SPORTS = [
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
] as const;

export type Sport = (typeof SPORTS)[number];
