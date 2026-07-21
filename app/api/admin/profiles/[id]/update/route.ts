import { NextResponse } from "next/server";
import { createClient } from "../../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../../lib/supabase/admin";
import {
  uploadClubLogo,
  getLogoFile,
} from "../../../../../../lib/upload-club-logo";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

function backTo(id: string, message: string, key: "error" | "updated") {
  return `/admin/profili/${id}/modifica?${key}=${encodeURIComponent(message)}`;
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
    return NextResponse.redirect(
      new URL(backTo(id, "Admin non configurato.", "error"), request.url),
      { status: 303 }
    );
  }

  const { data: target } = await adminSupabase
    .from("profiles")
    .select("id, account_type")
    .eq("id", id)
    .maybeSingle();

  if (!target) {
    return NextResponse.redirect(new URL("/admin?section=users", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const text = (key: string) => String(formData.get(key) || "").trim() || null;
  const accountType =
    String(formData.get("account_type") || "") === "circolo"
      ? "circolo"
      : "privato";
  const isCircolo = accountType === "circolo";

  const sports = formData
    .getAll("club_sports")
    .map((value) => String(value))
    .filter(Boolean);
  const services = formData
    .getAll("club_services")
    .map((value) => String(value))
    .filter(Boolean);

  // Campi modificabili dall'admin. Restano ESCLUSI (hanno controlli dedicati o
  // sono sensibili): role, banned_at, account_plan, monthly_event_limit_override,
  // owner_id, claim_status, is_verified, slug.
  const updates: Record<string, unknown> = {
    display_name: text("display_name"),
    city: text("city"),
    phone: text("phone"),
    bio: text("bio"),
    account_type: accountType,
    club_name: isCircolo ? text("club_name") : null,
    club_address: isCircolo ? text("club_address") : null,
    club_whatsapp: isCircolo ? text("club_whatsapp") : null,
    club_email: isCircolo ? text("club_email") : null,
    club_website: isCircolo ? text("club_website") : null,
    club_instagram: isCircolo ? text("club_instagram") : null,
    club_sports: isCircolo ? sports : [],
    club_services: isCircolo ? services : [],
  };

  const logoFile = getLogoFile(formData);
  if (logoFile) {
    try {
      updates.avatar_url = await uploadClubLogo(adminSupabase, id, logoFile);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Errore durante il caricamento dell'immagine.";
      return NextResponse.redirect(
        new URL(backTo(id, message, "error"), request.url),
        { status: 303 }
      );
    }
  }

  const { error } = await adminSupabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(backTo(id, error.message, "error"), request.url),
      { status: 303 }
    );
  }

  return NextResponse.redirect(
    new URL(backTo(id, "1", "updated"), request.url),
    { status: 303 }
  );
}
