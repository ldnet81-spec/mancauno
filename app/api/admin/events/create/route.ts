import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { italianDateTimeToUtcIso } from "../../../../../lib/date-time";
import { toSlug, italianDateSlugPart } from "../../../../../lib/slug";
import { SPORTS } from "../../../../../lib/sports";

export const runtime = "nodejs";

function backUrl(clubId: string, message: string) {
  return `/admin/eventi/nuovo?club=${encodeURIComponent(
    clubId
  )}&error=${encodeURIComponent(message)}`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/quick-signup", request.url), {
      status: 303,
    });
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, banned_at")
    .eq("id", user.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin" || adminProfile.banned_at) {
    return NextResponse.redirect(new URL("/", request.url), { status: 303 });
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    return NextResponse.redirect(new URL("/admin?section=clubs", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const clubId = String(formData.get("club_id") || "");
  const sport = String(formData.get("sport") || "").trim();
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const totalSpots = Number(formData.get("total_spots"));
  const entryType = String(formData.get("entry_type") || "approval");
  const skillLevel = String(formData.get("skill_level") || "amatoriale");
  const notes = String(formData.get("notes") || "").trim();

  const { data: club } = await adminSupabase
    .from("profiles")
    .select("id, slug, club_name, display_name, city, club_address, account_type")
    .eq("id", clubId)
    .maybeSingle();

  if (!club || club.account_type !== "circolo") {
    return NextResponse.redirect(new URL("/admin?section=clubs", request.url), {
      status: 303,
    });
  }

  const slugOrId = club.slug || club.id;

  if (!sport || !date || !time || !Number.isFinite(totalSpots)) {
    return NextResponse.redirect(
      new URL(backUrl(clubId, "Compila sport, data, ora e posti."), request.url),
      { status: 303 }
    );
  }

  if (totalSpots < 2 || totalSpots > 100) {
    return NextResponse.redirect(
      new URL(backUrl(clubId, "I posti devono essere tra 2 e 100."), request.url),
      { status: 303 }
    );
  }

  const startsAt = italianDateTimeToUtcIso(date, time);
  if (new Date(startsAt) <= new Date()) {
    return NextResponse.redirect(
      new URL(backUrl(clubId, "La data non puo essere nel passato."), request.url),
      { status: 303 }
    );
  }

  const sportEmoji =
    SPORTS.find((item) => item.label === sport)?.emoji ?? "✨";
  const clubName = club.club_name || club.display_name || "club";
  const title = `${sport} presso ${clubName}`;
  const locationName = club.club_address || clubName;
  const city = club.city || "";

  // Riusa l'RPC esistente: l'evento viene creato con creator_id = admin
  // (utente auth reale, FK-safe). Il collegamento al club avviene via club_id.
  const { data, error } = await supabase.rpc("create_event", {
    p_sport: sport,
    p_sport_emoji: sportEmoji,
    p_title: title,
    p_starts_at: startsAt,
    p_location_name: locationName,
    p_city: city,
    p_total_spots: totalSpots,
    p_entry_type: entryType === "open" ? "open" : "approval",
    p_address: locationName,
    p_lat: null,
    p_lng: null,
    p_notes: notes,
  });

  if (error || !data?.short_code) {
    return NextResponse.redirect(
      new URL(backUrl(clubId, error?.message || "Errore creazione evento."), request.url),
      { status: 303 }
    );
  }

  // Slug univoco.
  const datePart = italianDateSlugPart(startsAt);
  const baseSlug = [toSlug(title), datePart].filter(Boolean).join("-") || "evento";
  let eventSlug = baseSlug;
  for (let counter = 1; counter <= 100; counter++) {
    const candidate = counter === 1 ? baseSlug : `${baseSlug}-${counter}`;
    const { count } = await adminSupabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("slug", candidate);
    if (!count) {
      eventSlug = candidate;
      break;
    }
  }

  const { error: updateError } = await adminSupabase
    .from("events")
    .update({
      skill_level: skillLevel,
      slug: eventSlug,
      club_id: club.id,
      event_source: "mancauno_suggested",
    })
    .eq("short_code", data.short_code);

  if (updateError) {
    return NextResponse.redirect(
      new URL(backUrl(clubId, updateError.message), request.url),
      { status: 303 }
    );
  }

  return NextResponse.redirect(new URL(`/club/${slugOrId}`, request.url), {
    status: 303,
  });
}
