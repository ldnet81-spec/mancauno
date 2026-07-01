import { createClient } from "../../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../../lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function fail(request: Request, message: string) {
  return NextResponse.redirect(
    new URL(`/admin?error=${encodeURIComponent(message)}`, request.url),
    { status: 303 }
  );
}

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
    return fail(request, "Admin non configurato: manca SUPABASE_SERVICE_ROLE_KEY.");
  }

  const formData = await request.formData();
  const reason = String(formData.get("reason") || "");

  // 1) Best-effort: RPC storica (cleanup/log).
  await supabase.rpc("admin_delete_event", {
    p_event_id: id,
    p_reason: reason,
  });

  // 2) Eliminazione garantita: prima le partecipazioni collegate, poi l'evento.
  await adminSupabase.from("participations").delete().eq("event_id", id);

  const { error: eventError } = await adminSupabase
    .from("events")
    .delete()
    .eq("id", id);

  if (eventError) {
    return fail(request, eventError.message);
  }

  const { data: stillThere } = await adminSupabase
    .from("events")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (stillThere) {
    return fail(request, "Eliminazione non riuscita: l'evento e ancora presente.");
  }

  return NextResponse.redirect(new URL("/admin?event_deleted=1", request.url), {
    status: 303,
  });
}
