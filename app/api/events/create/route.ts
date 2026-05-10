import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

const FREE_CLUB_MONTHLY_EVENT_LIMIT = 8;

type CreateEventPayload = {
  sport?: string;
  sport_emoji?: string;
  title?: string;
  starts_at?: string;
  location_name?: string;
  city?: string;
  total_spots?: number;
  entry_type?: "open" | "approval";
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

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .single();

  if (profile?.account_type === "circolo") {
    const { start, end } = getCurrentMonthRange();

    const { count } = await adminSupabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .gte("created_at", start)
      .lt("created_at", end);

    if ((count ?? 0) >= FREE_CLUB_MONTHLY_EVENT_LIMIT) {
      return NextResponse.json(
        {
          error:
            "Hai raggiunto il limite Free di 8 eventi mensili per circoli. Il piano Pro con eventi illimitati sara disponibile a breve.",
        },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase.rpc("create_event", {
    p_sport: payload.sport,
    p_sport_emoji: payload.sport_emoji,
    p_title: payload.title.trim(),
    p_starts_at: startsAt.toISOString(),
    p_location_name: payload.location_name.trim(),
    p_city: payload.city.trim(),
    p_total_spots: totalSpots,
    p_entry_type: payload.entry_type,
    p_address: payload.location_name.trim(),
    p_lat: null,
    p_lng: null,
    p_notes: payload.notes?.trim() || "",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ short_code: data?.short_code });
}
