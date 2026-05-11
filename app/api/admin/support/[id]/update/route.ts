import { NextResponse } from "next/server";
import { createClient } from "../../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../../lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, banned_at")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.banned_at) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    return NextResponse.redirect(
      new URL(
        `/admin?section=support&error=${encodeURIComponent(
          "Admin non configurato: manca SUPABASE_SERVICE_ROLE_KEY."
        )}`,
        request.url
      )
    );
  }

  const formData = await request.formData();
  const status = clean(formData.get("status")) || "open";
  const adminResponse = clean(formData.get("admin_response"));

  if (!["open", "in_progress", "closed"].includes(status)) {
    return NextResponse.redirect(
      new URL(
        `/admin?section=support&error=${encodeURIComponent(
          "Stato richiesta non valido."
        )}`,
        request.url
      )
    );
  }

  const { error } = await adminSupabase
    .from("support_requests")
    .update({
      status,
      admin_response: adminResponse || null,
      responded_at: adminResponse ? new Date().toISOString() : null,
      responded_by: adminResponse ? user.id : null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/admin?section=support&error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(
    new URL("/admin?section=support&support_updated=1", request.url)
  );
}
