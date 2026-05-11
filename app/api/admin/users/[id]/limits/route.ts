import { NextResponse } from "next/server";
import { createClient } from "../../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../../lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function parseLimit(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();

  if (!text) {
    return null;
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
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
        `/admin?error=${encodeURIComponent(
          "Admin non configurato: manca SUPABASE_SERVICE_ROLE_KEY."
        )}`,
        request.url
      )
    );
  }

  const formData = await request.formData();
  const plan = String(formData.get("account_plan") || "free");
  const monthlyEventLimitOverride = parseLimit(
    formData.get("monthly_event_limit_override")
  );

  if (!["free", "pro"].includes(plan)) {
    return NextResponse.redirect(
      new URL(
        `/admin?error=${encodeURIComponent("Piano account non valido.")}`,
        request.url
      )
    );
  }

  const { error } = await adminSupabase
    .from("profiles")
    .update({
      account_plan: plan,
      monthly_event_limit_override: monthlyEventLimitOverride,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/admin?limits_updated=1", request.url));
}
