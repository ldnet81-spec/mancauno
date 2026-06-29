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
    return NextResponse.redirect(new URL("/auth/quick-signup", request.url), {
      status: 303,
    });
  }

  const adminSupabase = createAdminClient();
  if (!adminSupabase) {
    return NextResponse.redirect(
      new URL(
        `/profilo/club/${id}/modifica?error=${encodeURIComponent(
          "Servizio non configurato."
        )}`,
        request.url
      ),
      { status: 303 }
    );
  }

  const { data: club } = await adminSupabase
    .from("profiles")
    .select("id, slug, owner_id, account_type")
    .eq("id", id)
    .maybeSingle();

  if (!club || club.account_type !== "circolo") {
    return NextResponse.redirect(new URL("/profilo/club", request.url), {
      status: 303,
    });
  }

  // Solo l'owner del club o un admin possono modificare.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = me?.role === "admin";
  const isOwner = club.owner_id === user.id;

  if (!isOwner && !isAdmin) {
    return NextResponse.redirect(
      new URL("/profilo/club?error=non-autorizzato", request.url),
      { status: 303 }
    );
  }

  const formData = await request.formData();
  const text = (key: string) => String(formData.get(key) || "").trim() || null;
  const sports = formData
    .getAll("club_sports")
    .map((value) => String(value))
    .filter(Boolean);
  const services = formData
    .getAll("club_services")
    .map((value) => String(value))
    .filter(Boolean);

  const clubName = text("club_name");
  if (!clubName) {
    return NextResponse.redirect(
      new URL(
        `/profilo/club/${id}/modifica?error=${encodeURIComponent(
          "Il nome del club e obbligatorio."
        )}`,
        request.url
      ),
      { status: 303 }
    );
  }

  const { error } = await adminSupabase
    .from("profiles")
    .update({
      club_name: clubName,
      display_name: text("display_name"),
      city: text("city"),
      club_address: text("club_address"),
      phone: text("phone"),
      club_whatsapp: text("club_whatsapp"),
      club_email: text("club_email"),
      club_website: text("club_website"),
      club_instagram: text("club_instagram"),
      bio: text("bio"),
      club_sports: sports,
      club_services: services,
    })
    .eq("id", club.id);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/profilo/club/${id}/modifica?error=${encodeURIComponent(error.message)}`,
        request.url
      ),
      { status: 303 }
    );
  }

  return NextResponse.redirect(
    new URL(`/profilo/club/${id}/modifica?updated=1`, request.url),
    { status: 303 }
  );
}
