import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/quick-signup", request.url), {
      status: 303,
    });
  }

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    return NextResponse.redirect(
      new URL(
        `/profilo/eventi?error=${encodeURIComponent(
          "Eliminazione non configurata: manca SUPABASE_SERVICE_ROLE_KEY."
        )}`,
        request.url
      ),
      { status: 303 }
    );
  }

  // Verifica che l'evento esista e appartenga all'utente loggato.
  const { data: event } = await adminSupabase
    .from("events")
    .select("id, creator_id")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    // Gia inesistente: trattiamo come successo (idempotente).
    return NextResponse.redirect(
      new URL("/profilo/eventi?deleted=1", request.url),
      { status: 303 }
    );
  }

  if (event.creator_id !== user.id) {
    return NextResponse.redirect(
      new URL(
        `/profilo/eventi?error=${encodeURIComponent(
          "Non puoi eliminare un evento che non hai creato."
        )}`,
        request.url
      ),
      { status: 303 }
    );
  }

  // Rimuoviamo prima le partecipazioni collegate per evitare blocchi di
  // foreign key, poi l'evento.
  await adminSupabase.from("participations").delete().eq("event_id", id);

  const { error } = await adminSupabase.from("events").delete().eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/profilo/eventi?error=${encodeURIComponent(error.message)}`,
        request.url
      ),
      { status: 303 }
    );
  }

  return NextResponse.redirect(
    new URL("/profilo/eventi?deleted=1", request.url),
    { status: 303 }
  );
}
