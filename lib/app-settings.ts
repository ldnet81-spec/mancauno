import { createAdminClient } from "./supabase/admin";

/**
 * Indica se le schermate dei piani a pagamento (Privato Plus / Club Pro)
 * sono visibili agli utenti. Controllato dal flag "subscriptions_enabled"
 * in app_settings, gestito dal pannello admin.
 *
 * Fail-safe: se il valore non e leggibile torna true, cioe il comportamento
 * attuale del sito (schermate visibili).
 */
export async function areSubscriptionsEnabled(): Promise<boolean> {
  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    return true;
  }

  const { data } = await adminSupabase
    .from("app_settings")
    .select("value_text")
    .eq("key", "subscriptions_enabled")
    .maybeSingle();

  return data?.value_text !== "false";
}
