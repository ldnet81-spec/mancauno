import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";

type ReadNotificationRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: ReadNotificationRouteProps
) {
  const { id } = await params;
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/notifiche";
  const safeNext = next.startsWith("/") ? next : "/notifiche";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/quick-signup", url.origin));
  }

  await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("read_at", null);

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
