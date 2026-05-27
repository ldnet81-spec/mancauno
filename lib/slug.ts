// Riconosce un UUID v4-like. Usato dai route handler per capire se il
// parametro di URL e l'id legacy o lo slug nuovo.
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

// Trasforma una stringa in slug kebab-case ASCII-safe per URL puliti.
// "Motori dei Marsi" → "motori-dei-marsi"
// "Calcetto venerdì sera!" → "calcetto-venerdi-sera"
export function toSlug(input: string): string {
  return (
    input
      // separa caratteri accentati nei loro componenti base + diacritico
      .normalize("NFD")
      // rimuove i diacritici (accenti)
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      // tutto cio che non e a-z 0-9 diventa "-"
      .replace(/[^a-z0-9]+/g, "-")
      // niente trattini in coda o all'inizio
      .replace(/^-+|-+$/g, "")
      // limita a 80 caratteri per evitare URL chilometriche
      .slice(0, 80)
      // se lo slice taglia in mezzo a trattini, ripulisce
      .replace(/-+$/g, "")
  );
}

// Mesi italiani per costruire slug "31-maggio-2026" leggibili e SEO-friendly.
const ITALIAN_MONTHS = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];

// Da un ISO timestamp UTC restituisce un suffisso "31-maggio-2026" calcolato
// nel fuso italiano (Europe/Rome), cosi corrisponde alla data che l'utente vede.
export function italianDateSlugPart(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const monthIndex = Number(parts.find((part) => part.type === "month")?.value);
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  if (!day || !year || !Number.isFinite(monthIndex)) {
    return "";
  }

  const month = ITALIAN_MONTHS[monthIndex - 1] ?? "";
  return toSlug(`${day}-${month}-${year}`);
}

// Trova uno slug ancora libero per il base dato, aggiungendo "-2", "-3"...
// existsFn deve restituire true se lo slug e gia in uso.
export async function uniqueSlug(
  base: string,
  existsFn: (candidate: string) => Promise<boolean>
): Promise<string> {
  const safeBase = base || "evento";
  let candidate = safeBase;
  let counter = 1;

  while (await existsFn(candidate)) {
    counter++;
    candidate = `${safeBase}-${counter}`;
    // safety: dopo 100 tentativi aggiungiamo un suffisso casuale per non
    // bloccare la generazione in caso di stati anomali.
    if (counter > 100) {
      candidate = `${safeBase}-${Date.now().toString(36)}`;
      break;
    }
  }

  return candidate;
}
