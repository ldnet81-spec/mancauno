import type { SupabaseClient } from "@supabase/supabase-js";
import { toSlug } from "./slug";

// Normalizza il nome per il confronto: minuscole, senza accenti/punteggiatura.
// "A.S.D. Moscardino Padel" e "asd moscardino padel" risultano uguali.
export function normalizeName(value?: string | null): string {
  return toSlug(value ?? "");
}

// Normalizza un numero di telefono: solo cifre, senza prefisso internazionale.
// "+39 333 123 4567" e "3331234567" risultano uguali.
export function normalizePhone(value?: string | null): string {
  let digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("0039")) {
    digits = digits.slice(4);
  } else if (digits.startsWith("39") && digits.length > 10) {
    // Attenzione: i cellulari italiani iniziano per 3 (es. 392...), quindi
    // togliamo "39" solo se il numero e' piu' lungo del formato nazionale.
    digits = digits.slice(2);
  }
  return digits;
}

export function normalizeEmail(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

export type DuplicateMatch = {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  reason: "nome-citta" | "telefono" | "email";
};

type ClubInput = {
  clubName?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  excludeId?: string | null;
};

// Cerca un club gia' esistente che corrisponde ai dati in input.
// Scatta se UNO di questi segnali coincide:
//   1. stesso nome nella stessa citta' (o stesso nome, se la citta' manca)
//   2. stesso numero di telefono / WhatsApp
//   3. stessa email del club
// Ritorna il primo match trovato, altrimenti null.
export async function findDuplicateClub(
  admin: SupabaseClient,
  input: ClubInput
): Promise<DuplicateMatch | null> {
  const nameKey = normalizeName(input.clubName);
  const cityKey = normalizeName(input.city);
  const phoneKey = normalizePhone(input.phone);
  const emailKey = normalizeEmail(input.email);

  // Senza nome ne' contatti non c'e' niente da confrontare.
  if (!nameKey && !phoneKey && !emailKey) {
    return null;
  }

  const { data } = await admin
    .from("profiles")
    .select(
      "id, slug, club_name, display_name, city, phone, club_whatsapp, club_email"
    )
    .eq("account_type", "circolo")
    .is("banned_at", null)
    .limit(5000);

  const candidates = data ?? [];

  for (const club of candidates) {
    if (input.excludeId && club.id === input.excludeId) continue;

    const clubName = club.club_name || club.display_name || "";
    const match = (reason: DuplicateMatch["reason"]): DuplicateMatch => ({
      id: club.id,
      slug: club.slug ?? null,
      name: clubName || "Club",
      city: club.city ?? null,
      reason,
    });

    // 1) nome + citta'
    if (nameKey && normalizeName(clubName) === nameKey) {
      const existingCity = normalizeName(club.city);
      // Se una delle due citta' manca, il solo nome uguale basta a segnalare.
      if (!cityKey || !existingCity || existingCity === cityKey) {
        return match("nome-citta");
      }
    }

    // 2) telefono o whatsapp (almeno 8 cifre per evitare falsi positivi)
    if (phoneKey.length >= 8) {
      if (
        normalizePhone(club.phone) === phoneKey ||
        normalizePhone(club.club_whatsapp) === phoneKey
      ) {
        return match("telefono");
      }
    }

    // 3) email del club
    if (emailKey && normalizeEmail(club.club_email) === emailKey) {
      return match("email");
    }
  }

  return null;
}

export function duplicateReasonLabel(reason: DuplicateMatch["reason"]): string {
  if (reason === "telefono") return "stesso numero di telefono";
  if (reason === "email") return "stessa email";
  return "stesso nome nella stessa citta";
}
