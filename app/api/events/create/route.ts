import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { toSlug, italianDateSlugPart } from "../../../../lib/slug";

const DEFAULT_PRIVATE_MONTHLY_EVENT_LIMIT = 5;
const DEFAULT_CLUB_MONTHLY_EVENT_LIMIT = 5;

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

// Aggiunge un mese gestendo il rollover dei giorni:
// es. 31 gennaio + 1 mese = 28 febbraio (29 negli anni bisestili).
function addOneMonth(date: Date): Date {
  const result = new Date(date);
  const targetDay = result.getUTCDate();
  result.setUTCMonth(result.getUTCMonth() + 1);
  if (result.getUTCDate() !== targetDay) {
    // JavaScript ha riportato al mese successivo: torniamo all'ultimo
    // giorno del mese che ci interessava.
    result.setUTCDate(0);
  }
  return result;
}

// Finestra mensile ancorata alla data di iscrizione dell'utente:
// se ti sei registrato il 10 maggio, il ciclo va dal 10 al 10 di ogni mese.
function getUserMonthlyRange(
  registrationIso: string | null | undefined,
  now: Date
) {
  if (!registrationIso) {
    // Fallback al mese di calendario se manca created_at.
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    );
    return { start: start.toISOString(), end: end.toISOString() };
  }

  const registration = new Date(registrationIso);
  if (Number.isNaN(registration.getTime()) || registration > now) {
    return {
      start: registration.toISOString(),
      end: addOneMonth(registration).toISOString(),
    };
  }

  let periodStart = registration;
  while (true) {
    const next = addOneMonth(periodStart);
    if (next > now) {
      break;
    }
    periodStart = next;
  }
  const periodEnd = addOneMonth(periodStart);
  return {
    start: periodStart.toISOString(),
    end: periodEnd.toISOString(),
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
    .select(
      "account_type, account_plan, monthly_event_limit_override, created_at"
    )
    .eq("id", user.id)
    .single();

  if (profile?.account_plan !== "pro") {
    const { start, end } = getUserMonthlyRange(profile?.created_at, new Date());
    const defaultMonthlyLimit = await getDefaultMonthlyLimit(
      adminSupabase,
      profile?.account_type
    );
    // Attenzione: Number(null) === 0, quindi un override non impostato verrebbe
    // letto come "0 eventi". Controlliamo esplicitamente null/undefined prima.
    const rawOverride = profile?.monthly_event_limit_override;
    const overrideLimit =
      rawOverride === null || rawOverride === undefined
        ? null
        : Number(rawOverride);
    const monthlyLimit =
      overrideLimit !== null &&
      Number.isFinite(overrideLimit) &&
      overrideLimit >= 0
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
              ? `Hai raggiunto il limite Free di ${monthlyLimit} eventi mensili per circoli. Attiva Club Pro per creare eventi illimitati.`
              : `Hai raggiunto il limite Free di ${monthlyLimit} eventi mensili. Attiva Privato Plus per creare eventi illimitati.`,
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

  let eventSlug: string | null = null;

  if (data?.short_code) {
    // Slug "titolo-31-maggio-2026" — leggibile, SEO-friendly, univoco.
    const datePart = italianDateSlugPart(startsAt.toISOString());
    const titlePart = toSlug(title);
    const baseSlug =
      [titlePart, datePart].filter(Boolean).join("-") || "evento";

    for (let counter = 1; counter <= 100; counter++) {
      const candidate = counter === 1 ? baseSlug : `${baseSlug}-${counter}`;
      const { count: existing } = await adminSupabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("slug", candidate);
      if (!existing) {
        eventSlug = candidate;
        break;
      }
    }
    if (!eventSlug) {
      eventSlug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    const { error: updateError } = await adminSupabase
      .from("events")
      .update({ skill_level: skillLevel, slug: eventSlug })
      .eq("short_code", data.short_code)
      .eq("creator_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
  }

  return NextResponse.json({
    short_code: data?.short_code,
    slug: eventSlug,
  });
}
