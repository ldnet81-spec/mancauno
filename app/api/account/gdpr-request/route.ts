import { createClient } from "../../../../lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const gdprRequestLabels: Record<string, string> = {
  access: "accesso ai dati",
  rectification: "rettifica dati",
  portability: "portabilita dati",
  restriction: "limitazione trattamento",
  objection: "opposizione",
  delete: "cancellazione account",
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/quick-signup", request.url));
  }

  const formData = await request.formData();
  const requestType = String(formData.get("request_type") || "access");
  const notes = String(formData.get("notes") || "").trim();
  const confirmation = String(formData.get("confirmation") || "");
  const label = gdprRequestLabels[requestType] || "richiesta GDPR";

  if (requestType !== "delete") {
    const message = encodeURIComponent(
      `Richiesta ricevuta: ${label}. Verra gestita dal titolare del trattamento.`
    );

    console.info("GDPR request", {
      user_id: user.id,
      email: user.email,
      request_type: requestType,
      notes,
    });

    return NextResponse.redirect(
      new URL(`/profilo?gdpr=${message}`, request.url)
    );
  }

  if (confirmation !== "CANCELLA") {
    return NextResponse.redirect(
      new URL(
        `/profilo?gdpr_error=${encodeURIComponent("Conferma non valida.")}`,
        request.url
      )
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return NextResponse.redirect(
      new URL(
        `/profilo?gdpr_error=${encodeURIComponent(
          "Cancellazione non configurata: manca SUPABASE_SERVICE_ROLE_KEY."
        )}`,
        request.url
      )
    );
  }

  await supabase
    .from("profiles")
    .update({
      display_name: "Account cancellato",
      city: null,
      bio: null,
      avatar_url: null,
      phone: null,
      club_name: null,
    })
    .eq("id", user.id);

  const adminSupabase = createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  const { error } = await adminSupabase.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/profilo?gdpr_error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/?account_deleted=1", request.url));
}
