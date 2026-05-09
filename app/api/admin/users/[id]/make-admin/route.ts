import { createClient } from "../../../../../../lib/supabase/server";
import { NextResponse } from "next/server";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const supabase = await createClient();

  const formData = await request.formData();
  const reason = String(formData.get("reason") || "Promozione amministratore");

  const { error } = await supabase.rpc("admin_set_user_role", {
    p_user_id: id,
    p_role: "admin",
    p_reason: reason,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/admin?role_updated=1", request.url));
}