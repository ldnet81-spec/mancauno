import { NextResponse } from "next/server";
import { createClient } from "../../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../../lib/supabase/admin";
import { italianDateTimeToUtcIso } from "../../../../../../lib/date-time";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;
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
        `/admin?section=events&error=${encodeURIComponent(
          "Admin non configurato: manca SUPABASE_SERVICE_ROLE_KEY."
        )}`,
        request.url
      )
    );
  }

  const formData = await request.formData();
  const date = value(formData, "date");
  const time = value(formData, "time");
  const totalSpots = Number(formData.get("total_spots"));
  const status = value(formData, "status");
  const entryType = value(formData, "entry_type");
  const skillLevel = value(formData, "skill_level") || "amatoriale";

  if (!date || !time || !Number.isFinite(totalSpots)) {
    return NextResponse.redirect(
      new URL(
        `/admin?section=events&error=${encodeURIComponent(
          "Data, ora e posti sono obbligatori."
        )}`,
        request.url
      )
    );
  }

  if (!["active", "cancelled"].includes(status)) {
    return NextResponse.redirect(
      new URL(
        `/admin?section=events&error=${encodeURIComponent(
          "Stato evento non valido."
        )}`,
        request.url
      )
    );
  }

  if (!["open", "approval"].includes(entryType)) {
    return NextResponse.redirect(
      new URL(
        `/admin?section=events&error=${encodeURIComponent(
          "Tipo partecipazione non valido."
        )}`,
        request.url
      )
    );
  }

  if (!["amatoriale", "intermedio", "esperto"].includes(skillLevel)) {
    return NextResponse.redirect(
      new URL(
        `/admin?section=events&error=${encodeURIComponent(
          "Livello evento non valido."
        )}`,
        request.url
      )
    );
  }

  if (totalSpots < 2 || totalSpots > 100) {
    return NextResponse.redirect(
      new URL(
        `/admin?section=events&error=${encodeURIComponent(
          "Il numero di partecipanti deve essere tra 2 e 100."
        )}`,
        request.url
      )
    );
  }

  const { error } = await adminSupabase
    .from("events")
    .update({
      title: value(formData, "title"),
      sport: value(formData, "sport"),
      sport_emoji: value(formData, "sport_emoji"),
      starts_at: italianDateTimeToUtcIso(date, time),
      location_name: value(formData, "location_name"),
      city: value(formData, "city"),
      address: value(formData, "location_name"),
      total_spots: Math.floor(totalSpots),
      entry_type: entryType,
      skill_level: skillLevel,
      notes: value(formData, "notes"),
      status,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/admin?section=events&error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(
    new URL("/admin?section=events&event_updated=1", request.url)
  );
}
