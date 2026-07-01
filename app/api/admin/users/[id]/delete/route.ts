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

  if (id === user.id) {
    return fail(request, "Non puoi eliminare il tuo account admin.");
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    return fail(request, "Admin non configurato: manca SUPABASE_SERVICE_ROLE_KEY.");
  }

  const formData = await request.formData();
  const reason = String(formData.get("reason") || "");

  // 1) Best-effort: chiama la RPC storica (cleanup/log dei dati collegati).
  //    Puo' fallire per le schede club non rivendicate (senza utente auth):
  //    in quel caso proseguiamo comunque.
  await supabase.rpc("admin_delete_user", {
    p_user_id: id,
    p_reason: reason,
  });

  // 2) Elimina in modo garantito la riga profiles (cascade su participations,
  //    eventi, follower, club_claims). Serve perche' la FK profiles.id ->
  //    auth.users e' stata rimossa: senza questo la RPC lascerebbe il profilo
  //    orfano e l'utente/club continuerebbe a comparire.
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (profileError) {
    return fail(request, profileError.message);
  }

  // 3) Rimuove l'eventuale utente auth collegato (per i club non rivendicati
  //    non esiste: ignoriamo l'errore).
  try {
    await adminSupabase.auth.admin.deleteUser(id);
  } catch {
    // nessun utente auth da rimuovere
  }

  // 4) Verifica che il profilo sia effettivamente sparito.
  const { data: stillThere } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (stillThere) {
    return fail(request, "Eliminazione non riuscita: il profilo e ancora presente.");
  }

  return NextResponse.redirect(new URL("/admin?user_deleted=1", request.url), {
    status: 303,
  });
}
