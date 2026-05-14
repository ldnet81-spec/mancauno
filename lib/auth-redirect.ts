// Garantisce che un parametro "next" sia un percorso interno al sito,
// evitando open redirect verso domini esterni (es. next=https://evil.com).
export function sanitizeNextPath(
  next: string | null | undefined,
  fallback = "/"
) {
  if (!next || !next.startsWith("/")) {
    return fallback;
  }

  // "//host" e "/\host" vengono interpretati dai browser come URL assoluti.
  if (next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }

  return next;
}
