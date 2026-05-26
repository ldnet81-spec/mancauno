import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

function getNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

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
  const privateLimit = getNumber(
    formData,
    "default_private_monthly_event_limit",
    5
  );
  const clubLimit = getNumber(formData, "default_club_monthly_event_limit", 5);

  const { error } = await adminSupabase.from("app_settings").upsert(
    [
      {
        key: "default_private_monthly_event_limit",
        value_text: String(privateLimit),
        description: "Limite eventi mensili per nuovi utenti privati free",
      },
      {
        key: "default_club_monthly_event_limit",
        value_text: String(clubLimit),
        description: "Limite eventi mensili per nuovi club free",
      },
    ],
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
