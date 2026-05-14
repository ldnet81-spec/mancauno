import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/quick-signup", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, banned_at")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.banned_at) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    return NextResponse.redirect(
      new URL(
        `/admin?section=settings&error=${encodeURIComponent(
          "Admin non configurato: manca SUPABASE_SERVICE_ROLE_KEY."
        )}`,
        request.url
      )
    );
  }

  const formData = await request.formData();
  const enabled = formData.get("subscriptions_enabled") === "true";

  const { error } = await adminSupabase.from("app_settings").upsert(
    {
      key: "subscriptions_enabled",
      value_text: enabled ? "true" : "false",
      description:
        "Mostra o nasconde le schermate dei piani a pagamento Privato Plus e Club Pro",
    },
    { onConflict: "key" }
  );

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/admin?section=settings&error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(
    new URL("/admin?section=settings&settings_updated=1", request.url)
  );
}
