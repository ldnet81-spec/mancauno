import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import {
  formatDateTimeItaly,
  italianDateTimeToUtcIso,
} from "../../../../../lib/date-time";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function formatEventDate(date: string) {
  return formatDateTimeItaly(date);
}

function hasChanged(previousValue: unknown, nextValue: unknown) {
  return String(previousValue ?? "").trim() !== String(nextValue ?? "").trim();
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

  const { data: existingEvent } = await supabase
    .from("event_with_counts")
    .select(
      "id, creator_id, short_code, title, sport, sport_emoji, starts_at, location_name, city, total_spots, entry_type, notes"
    )
    .eq("id", id)
    .single();

  if (!existingEvent) {
    return NextResponse.redirect(
      new URL("/profilo/eventi?error=Evento non trovato.", request.url)
    );
  }

  if (existingEvent.creator_id !== user.id) {
    return NextResponse.redirect(
      new URL(
        "/profilo/eventi?error=Non puoi modificare questo evento.",
        request.url
      )
    );
  }

  const formData = await request.formData();
  const sport = getTrimmedValue(formData, "sport");
  const sportEmoji = getTrimmedValue(formData, "sport_emoji");
  const title = getTrimmedValue(formData, "title");
  const date = getTrimmedValue(formData, "date");
  const time = getTrimmedValue(formData, "time");
  const locationName = getTrimmedValue(formData, "location_name");
  const city = getTrimmedValue(formData, "city");
  const entryType = getTrimmedValue(formData, "entry_type");
  const notes = getTrimmedValue(formData, "notes");
  const totalSpots = Number(formData.get("total_spots"));

  if (
    !sport ||
    !sportEmoji ||
    !title ||
    !date ||
    !time ||
    !locationName ||
    !city ||
    !Number.isFinite(totalSpots)
  ) {
    return NextResponse.redirect(
      new URL(
        `/eventi/${id}/modifica?error=${encodeURIComponent(
          "Compila tutti i campi obbligatori."
        )}`,
        request.url
      )
    );
  }

  if (!["open", "approval"].includes(entryType)) {
    return NextResponse.redirect(
      new URL(
        `/eventi/${id}/modifica?error=${encodeURIComponent(
          "Tipo di ingresso non valido."
        )}`,
        request.url
      )
    );
  }

  if (totalSpots < 2 || totalSpots > 100) {
    return NextResponse.redirect(
      new URL(
        `/eventi/${id}/modifica?error=${encodeURIComponent(
          "Il numero di partecipanti deve essere tra 2 e 100."
        )}`,
        request.url
      )
    );
  }

  const nextStartsAt = italianDateTimeToUtcIso(date, time);
  const startsAt = new Date(nextStartsAt);

  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.redirect(
      new URL(
        `/eventi/${id}/modifica?error=${encodeURIComponent(
          "Data o ora non valide."
        )}`,
        request.url
      )
    );
  }

  if (startsAt <= new Date()) {
    return NextResponse.redirect(
      new URL(
        `/eventi/${id}/modifica?error=${encodeURIComponent(
          "La data dell'evento non puo essere nel passato."
        )}`,
        request.url
      )
    );
  }

  const { count: approvedCount } = await supabase
    .from("participations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id)
    .eq("status", "approved");

  if ((approvedCount ?? 0) > totalSpots) {
    return NextResponse.redirect(
      new URL(
        `/eventi/${id}/modifica?error=${encodeURIComponent(
          "Non puoi impostare meno posti dei partecipanti gia approvati."
        )}`,
        request.url
      )
    );
  }

  const changedFields = {
    title: hasChanged(existingEvent.title, title),
    dateTime: existingEvent.starts_at !== nextStartsAt,
    location: hasChanged(existingEvent.location_name, locationName),
    city: hasChanged(existingEvent.city, city),
    totalSpots: Number(existingEvent.total_spots) !== totalSpots,
    entryType: hasChanged(existingEvent.entry_type, entryType),
    notes: hasChanged(existingEvent.notes, notes),
  };

  const shouldNotifyParticipants = Object.values(changedFields).some(Boolean);

  const { error } = await supabase
    .from("events")
    .update({
      sport,
      sport_emoji: sportEmoji,
      title,
      starts_at: nextStartsAt,
      location_name: locationName,
      city,
      total_spots: totalSpots,
      entry_type: entryType,
      address: locationName,
      notes,
    })
    .eq("id", id)
    .eq("creator_id", user.id);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/eventi/${id}/modifica?error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }

  if (shouldNotifyParticipants) {
    const { data: participations } = await supabase
      .from("participations")
      .select("id, user_id")
      .eq("event_id", id)
      .eq("status", "approved");

    const notificationTitle = changedFields.dateTime
      ? "L'orario del tuo evento e stato modificato"
      : "Il tuo evento e stato aggiornato";

    const notificationBody = changedFields.dateTime
      ? `${title} ora si terra ${formatEventDate(nextStartsAt)}. Controlla i dettagli aggiornati.`
      : `${title} ha nuovi dettagli. Controlla luogo, posti o note dell'evento.`;

    const notifications =
      participations
        ?.filter((participation: any) => participation.user_id !== user.id)
        .map((participation: any) => ({
          user_id: participation.user_id,
          event_id: id,
          participation_id: participation.id,
          type: "event_updated",
          title: notificationTitle,
          body: notificationBody,
        })) ?? [];

    if (notifications.length) {
      await supabase.from("notifications").insert(notifications);
    }
  }

  return NextResponse.redirect(
    new URL(
      `/profilo/eventi?updated=1&event=${existingEvent.short_code}`,
      request.url
    )
  );
}
