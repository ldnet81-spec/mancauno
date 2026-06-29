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
    .select("id, club_id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!claim) {
    return NextResponse.redirect(
      new URL("/admin/rivendicazioni?error=richiesta-non-trovata", request.url),
      { status: 303 }
    );
  }

  const now = new Date().toISOString();

  // 1) approva la richiesta
  await adminSupabase
    .from("club_claims")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", claim.id);

  // 2) assegna la proprieta' del club e verificalo
  const { error: clubError } = await adminSupabase
    .from("profiles")
    .update({
      owner_id: claim.user_id,
      claim_status: "approved",
      is_verified: true,
    })
    .eq("id", claim.club_id);

  if (clubError) {
    return NextResponse.redirect(
      new URL(
        `/admin/rivendicazioni?error=${encodeURIComponent(clubError.message)}`,
        request.url
      ),
      { status: 303 }
    );
  }

  // 3) rifiuta automaticamente le altre richieste pending per lo stesso club
  await adminSupabase
    .from("club_claims")
    .update({ status: "rejected", reviewed_by: user.id, reviewed_at: now })
    .eq("club_id", claim.club_id)
    .eq("status", "pending")
    .neq("id", claim.id);

  return NextResponse.redirect(
    new URL("/admin/rivendicazioni?approved=1", request.url),
    { status: 303 }
  );
}
