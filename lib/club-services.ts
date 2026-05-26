// Lista canonica dei servizi offerti dai club.
// E' la sorgente unica di verita: usata sia dal form profilo
// (app/profilo/ProfileForm.tsx) sia dal form di registrazione
// (app/auth/quick-signup/QuickSignupForm.tsx).
export const CLUB_SERVICES = [
  "Spogliatoi",
  "Parcheggio",
  "Bar",
  "Istruttori",
  "Noleggio attrezzatura",
  "Docce",
  "Illuminazione serale",
  "Area relax",
] as const;

export type ClubService = (typeof CLUB_SERVICES)[number];
