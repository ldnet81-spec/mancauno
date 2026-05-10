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

  if (id === user.id) {
    return NextResponse.redirect(
      new URL(
        `/admin?error=${encodeURIComponent("Non puoi bannare il tuo account admin.")}`,
        request.url
      )
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      banned_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/admin?banned=1", request.url));
}
