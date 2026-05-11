import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

const DEFAULT_PRIVATE_MONTHLY_EVENT_LIMIT = 8;
const DEFAULT_CLUB_MONTHLY_EVENT_LIMIT = 4;

type CreateEventPayload = {
  club_id?: string;
  sport?: string;
  sport_emoji?: string;
  title?: string;
  starts_at?: string;
  location_name?: string;
  city?: string;
  total_spots?: number;
  entry_type?: "open" | "approval";
  skill_level?: "amatoriale" | "intermedio" | "esperto";
  notes?: string;
};

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

async function getDefaultMonthlyLimit(
  adminSupabase: NonNullable<ReturnType<typeof createAdminClient>>,
  accountType: string | null | undefined
) {
  const settingKey =
    accountType === "circolo"
      ? "default_club_monthly_event_limit"
      : "default_private_monthly_event_limit";
  const fallback =
    accountType === "circolo"
      ? DEFAULT_CLUB_MONTHLY_EVENT_LIMIT
      : DEFAULT_PRIVATE_MONTHLY_EVENT_LIMIT;

  const { data } = await adminSupabase
    .from("app_settings")
    .select("value_text")
    .eq("key", settingKey)
    .maybeSingle();

  const parsed = Number(data?.value_text);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Devi accedere per creare un evento." }, { status: 401 });
  }

  const payload = (await request.json()) as CreateEventPayload;
  const totalSpots = Number(payload.total_spots);

  if (
    !payload.sport ||
    !payload.sport_emoji ||
    !payload.title ||
    !payload.starts_at ||
    !payload.location_name ||
    !payload.city ||
    !Number.isFinite(totalSpots)
  ) {
    return NextResponse.json({ error: "Compila tutti i campi obbligatori." }, { status: 400 });
  }

  if (!["open", "approval"].includes(payload.entry_type || "")) {
    return NextResponse.json({ error: "Tipo partecipazione non valido." }, { status: 400 });
  }

  const skillLevel = payload.skill_level || "amatoriale";

  if (!["amatoriale", "intermedio", "esperto"].includes(skillLevel)) {
    return NextResponse.json({ error: "Livello evento non valido." }, { status: 400 });
  }

  if (totalSpots < 2 || totalSpots > 100) {
    return NextResponse.json(
      { error: "Il numero di partecipanti deve essere tra 2 e 100." },
      { status: 400 }
    );
  }

  const startsAt = new Date(payload.starts_at);

  if (Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
    return NextResponse.json({ error: "Data o ora non valide." }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    return NextResponse.json(
      { error: "Creazione evento club non configurata: manca SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  let locationName = payload.location_name.trim();
  let city = payload.city.trim();
  let title = payload.title.trim();

  if (payload.club_id) {
    const { data: club } = await adminSupabase
      .from("profiles")
      .select("id, club_name, display_name, city, club_address, account_type")
      .eq("id", payload.club_id)
      .eq("account_type", "circolo")
      .single();

    if (!club) {
      return NextResponse.json({ error: "Club non trovato." }, { status: 404 });
    }

    locationName = club.club_address || club.club_name || club.display_name || locationName;
    city = club.city || city;
    const clubName = club.club_name || club.display_name || "club";
    title = `${payload.sport} presso ${clubName}`;
  }

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("account_type, account_plan, monthly_event_limit_override")
    .eq("id", user.id)
    .single();

  if (profile?.account_plan !== "pro") {
    const { start, end } = getCurrentMonthRange();
    const defaultMonthlyLimit = await getDefaultMonthlyLimit(
      adminSupabase,
      profile?.account_type
    );
    const overrideLimit = Number(profile?.monthly_event_limit_override);
    const monthlyLimit =
      Number.isFinite(overrideLimit) && overrideLimit >= 0
        ? overrideLimit
        : defaultMonthlyLimit;

    const { count } = await adminSupabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .gte("created_at", start)
      .lt("created_at", end);

    if ((count ?? 0) >= monthlyLimit) {
      return NextResponse.json(
        {
          error:
            profile?.account_type === "circolo"
              ? `Hai raggiunto il limite Free di ${monthlyLimit} eventi mensili per circoli. Il piano Pro con eventi illimitati sara disponibile a breve.`
              : `Hai raggiunto il limite Free di ${monthlyLimit} eventi mensili.`,
        },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase.rpc("create_event", {
    p_sport: payload.sport,
    p_sport_emoji: payload.sport_emoji,
    p_title: title,
    p_starts_at: startsAt.toISOString(),
    p_location_name: locationName,
    p_city: city,
    p_total_spots: totalSpots,
    p_entry_type: payload.entry_type,
    p_address: locationName,
    p_lat: null,
    p_lng: null,
    p_notes: payload.notes?.trim() || "",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data?.short_code) {
    const { error: levelError } = await adminSupabase
      .from("events")
      .update({ skill_level: skillLevel })
      .eq("short_code", data.short_code)
      .eq("creator_id", user.id);

    if (levelError) {
      return NextResponse.json({ error: levelError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ short_code: data?.short_code });
}
