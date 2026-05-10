import { NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Devi accedere." }, { status: 401 });
  }

  if (!adminSupabase) {
    return NextResponse.json(
      { error: "Funzione non configurata." },
      { status: 500 }
    );
  }

  if (user.id === id) {
    return NextResponse.json(
      { error: "Non puoi seguire il tuo club." },
      { status: 400 }
    );
  }

  const { data: existingFollow } = await adminSupabase
    .from("club_followers")
    .select("club_id")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingFollow) {
    await adminSupabase
      .from("club_followers")
      .delete()
      .eq("club_id", id)
      .eq("user_id", user.id);

    return NextResponse.json({ following: false });
  }

  await adminSupabase.from("club_followers").insert({
    club_id: id,
    user_id: user.id,
  });

  return NextResponse.json({ following: true });
}
