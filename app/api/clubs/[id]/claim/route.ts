import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";

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
    return NextResponse.redirect(
      new URL(
        `/auth/quick-signup?next=${encodeURIComponent(`/club/${id}/rivendica`)}`,
        request.url
      ),
      { status: 303 }
    );
  }

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    return NextResponse.redirect(
      new URL(
        `/club/${id}/rivendica?error=${encodeURIComponent(
          "Servizio non configurato. Riprova piu tardi."
        )}`,
        request.url
      ),
      { status: 303 }
    );
  }

  const { data: club } = await adminSupabase
    .from("profiles")
    .select("id, slug, account_type, claim_status, is_verified")
    .eq("id", id)
    .maybeSingle();

  if (!club || club.account_type !== "circolo") {
    return NextResponse.redirect(new URL("/club", request.url), { status: 303 });
  }

  const slugOrId = club.slug || club.id;

  // Club gia' verificato: non rivendicabile.
  if (club.is_verified && club.claim_status === "approved") {
    return NextResponse.redirect(new URL(`/club/${slugOrId}`, request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const websiteOrSocial = String(
    formData.get("website_or_social") || ""
  ).trim();
  const message = String(formData.get("message") || "").trim();

  if (!fullName || !email) {
    return NextResponse.redirect(
      new URL(
        `/club/${slugOrId}/rivendica?error=${encodeURIComponent(
          "Inserisci almeno nome ed email."
        )}`,
        request.url
      ),
      { status: 303 }
    );
  }

  const { error: insertError } = await adminSupabase.from("club_claims").insert({
    club_id: club.id,
    user_id: user.id,
    full_name: fullName,
    email,
    phone: phone || null,
    role: role || null,
    website_or_social: websiteOrSocial || null,
    message: message || null,
    status: "pending",
  });

  if (insertError) {
    return NextResponse.redirect(
      new URL(
        `/club/${slugOrId}/rivendica?error=${encodeURIComponent(
          insertError.message
        )}`,
        request.url
      ),
      { status: 303 }
    );
  }

  // Segnaliamo che c'e' una richiesta in verifica (senza toccare lo stato se
  // era gia' approvato — qui non puo' esserlo perche' bloccato sopra).
  await adminSupabase
    .from("profiles")
    .update({ claim_status: "pending" })
    .eq("id", club.id);

  return NextResponse.redirect(
    new URL(`/club/${slugOrId}?claim=sent`, request.url),
    { status: 303 }
  );
}
