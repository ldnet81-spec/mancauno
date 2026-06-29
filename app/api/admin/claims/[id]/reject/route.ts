import { NextResponse } from "next/server";
import { createClient } from "../../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../../lib/supabase/admin";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
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
    return NextResponse.redirect(
      new URL("/admin/rivendicazioni?error=admin-non-configurato", request.url),
      { status: 303 }
    );
  }

  const { data: claim } = await adminSupabase
    .from("club_claims")
    .select("id, club_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!claim) {
    return NextResponse.redirect(
      new URL("/admin/rivendicazioni?error=richiesta-non-trovata", request.url),
      { status: 303 }
    );
  }

  const now = new Date().toISOString();

  await adminSupabase
    .from("club_claims")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", claim.id);

  // Se non restano altre richieste pending per il club e il club non e' gia'
  // verificato, riporta lo stato a "not_claimed".
  const { count: pendingLeft } = await adminSupabase
    .from("club_claims")
    .select("id", { count: "exact", head: true })
    .eq("club_id", claim.club_id)
    .eq("status", "pending");

  const { data: club } = await adminSupabase
    .from("profiles")
    .select("is_verified")
    .eq("id", claim.club_id)
    .maybeSingle();

  if (!pendingLeft && !club?.is_verified) {
    await adminSupabase
      .from("profiles")
      .update({ claim_status: "not_claimed" })
      .eq("id", claim.club_id);
  }

  return NextResponse.redirect(
    new URL("/admin/rivendicazioni?rejected=1", request.url),
    { status: 303 }
  );
}
