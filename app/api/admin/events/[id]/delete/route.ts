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
  const reason = String(formData.get("reason") || "");

  const { error } = await supabase.rpc("admin_delete_event", {
    p_event_id: id,
    p_reason: reason,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/admin?event_deleted=1", request.url));
}