import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const adminSupabase = createAdminClient();

  if (!adminSupabase) {
    return NextResponse.json(
      { error: "Funzione club non configurata." },
      { status: 500 }
    );
  }

  const { data: club } = await adminSupabase
    .from("profiles")
    .select("id, club_name, display_name, city, club_address, club_sports")
    .eq("id", id)
    .eq("account_type", "circolo")
    .single();

  if (!club) {
    return NextResponse.json({ error: "Club non trovato." }, { status: 404 });
  }

  return NextResponse.json({
    id: club.id,
    name: club.club_name || club.display_name || "Club",
    city: club.city || "",
    address: club.club_address || "",
    sports: club.club_sports || [],
  });
}
