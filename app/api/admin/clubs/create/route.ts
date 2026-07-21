import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";
import { toSlug } from "../../../../../lib/slug";
import { uploadClubLogo, getLogoFile } from "../../../../../lib/upload-club-logo";
import {
  findDuplicateClub,
  duplicateReasonLabel,
} from "../../../../../lib/club-duplicates";

export const runtime = "nodejs";

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
    return NextResponse.redirect(
      new URL(
        `/admin/clubs/nuovo?error=${encodeURIComponent(
          "Admin non configurato: manca SUPABASE_SERVICE_ROLE_KEY."
        )}`,
        request.url
      ),
      { status: 303 }
    );
  }

  const formData = await request.formData();
  const clubName = String(formData.get("club_name") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const clubAddress = String(formData.get("club_address") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const clubEmail = String(formData.get("club_email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const clubWebsite = String(formData.get("club_website") || "").trim();
  const clubInstagram = String(formData.get("club_instagram") || "").trim();
  const sports = formData
    .getAll("club_sports")
    .map((value) => String(value))
    .filter(Boolean);

  if (!clubName) {
    return NextResponse.redirect(
      new URL(
        `/admin/clubs/nuovo?error=${encodeURIComponent(
          "Il nome del club e obbligatorio."
        )}`,
        request.url
      ),
      { status: 303 }
    );
  }

  // Controllo doppioni: se esiste gia' una scheda con stesso nome+citta,
  // telefono o email, blocchiamo (a meno che l'admin non forzi con "force").
  const force = String(formData.get("force") || "") === "1";
  if (!force) {
    const duplicate = await findDuplicateClub(adminSupabase, {
      clubName,
      city,
      phone,
      email: clubEmail,
    });

    if (duplicate) {
      const message = `Esiste gia una scheda simile: "${duplicate.name}"${
        duplicate.city ? ` (${duplicate.city})` : ""
      } — ${duplicateReasonLabel(duplicate.reason)}. Controlla /club/${
        duplicate.slug ?? duplicate.id
      } oppure spunta "Crea comunque".`;
      return NextResponse.redirect(
        new URL(
          `/admin/clubs/nuovo?error=${encodeURIComponent(message)}`,
          request.url
        ),
        { status: 303 }
      );
    }
  }

  // Slug univoco (stesso schema usato al signup).
  const baseSlug = toSlug(clubName) || "club";
  let slug = baseSlug;
  for (let counter = 1; counter <= 100; counter++) {
    const candidate = counter === 1 ? baseSlug : `${baseSlug}-${counter}`;
    const { count } = await adminSupabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("slug", candidate);
    if (!count) {
      slug = candidate;
      break;
    }
  }

  const clubId = randomUUID();

  // Logo (opzionale): caricato via service-role nel bucket avatars.
  let avatarUrl: string | null = null;
  const logoFile = getLogoFile(formData);
  if (logoFile) {
    try {
      avatarUrl = await uploadClubLogo(adminSupabase, clubId, logoFile);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Errore durante il caricamento del logo.";
      return NextResponse.redirect(
        new URL(
          `/admin/clubs/nuovo?error=${encodeURIComponent(message)}`,
          request.url
        ),
        { status: 303 }
      );
    }
  }

  const { error } = await adminSupabase.from("profiles").insert({
    id: clubId,
    account_type: "circolo",
    account_plan: "free",
    display_name: clubName,
    club_name: clubName,
    city: city || null,
    club_address: clubAddress || null,
    bio: bio || null,
    club_email: clubEmail || null,
    phone: phone || null,
    club_website: clubWebsite || null,
    club_instagram: clubInstagram || null,
    club_sports: sports,
    club_services: [],
    avatar_url: avatarUrl,
    slug,
    claim_status: "not_claimed",
    is_verified: false,
    owner_id: null,
    created_by: user.id,
    created_by_type: "mancauno",
  });

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/admin/clubs/nuovo?error=${encodeURIComponent(error.message)}`,
        request.url
      ),
      { status: 303 }
    );
  }

  return NextResponse.redirect(new URL(`/club/${slug}`, request.url), {
    status: 303,
  });
}
