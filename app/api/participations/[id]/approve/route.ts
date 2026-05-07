import { createClient } from "../../../../../lib/supabase/server";
import { NextResponse } from "next/server";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.rpc("approve_participation", {
    p_participation_id: id,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/profilo/eventi?error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(
    new URL("/profilo/eventi?approved=1", request.url)
  );
}