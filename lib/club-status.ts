// Stato di rivendicazione di una scheda club e relative etichette/badge.
// Una scheda creata da MancaUno parte "not_claimed"; quando un gestore la
// rivendica passa "pending"; dopo l'approvazione admin diventa verificata.

export type ClaimStatus =
  | "not_claimed"
  | "pending"
  | "approved"
  | "rejected";

export type ClubLike = {
  claim_status?: string | null;
  is_verified?: boolean | null;
  owner_id?: string | null;
};

// True se la scheda e' gestita direttamente dal club (rivendicata e verificata).
export function isClubVerified(club: ClubLike): boolean {
  return Boolean(club.is_verified) && club.claim_status === "approved";
}

// True se la scheda e' una scheda informativa creata da MancaUno e non ancora
// gestita dal club.
export function isClubUnclaimed(club: ClubLike): boolean {
  return !isClubVerified(club);
}

// Etichetta breve per i badge nelle card e in cima alla pagina.
export function clubBadgeLabel(club: ClubLike): string {
  if (isClubVerified(club)) {
    return "Club verificato";
  }
  return "Scheda informativa";
}

// True se va mostrato il pulsante "Rivendica questo club".
export function canClaimClub(club: ClubLike): boolean {
  return !isClubVerified(club);
}

// ---- event_source -----------------------------------------------------------

export type EventSource = "official" | "community" | "mancauno_suggested";

export function eventSourceBadge(
  source: string | null | undefined
): { label: string; tone: "blue" | "slate" | "orange" } | null {
  if (source === "official") {
    return { label: "Evento ufficiale del club", tone: "blue" };
  }
  if (source === "mancauno_suggested") {
    return { label: "Evento segnalato da MancaUno", tone: "orange" };
  }
  if (source === "community") {
    return { label: "Evento creato da un utente", tone: "slate" };
  }
  return null;
}
