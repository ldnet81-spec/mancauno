import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const requestType = clean(formData.get("request_type"));
  const email = clean(formData.get("email"));
  const subject = clean(formData.get("subject"));
  const message = clean(formData.get("message"));

  if (!requestType || !email || !subject || !message) {
    return NextResponse.redirect(
      new URL(
        `/supporto?error=${encodeURIComponent("Compila tutti i campi.")}`,
        request.url
      )
    );
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (adminSupabase) {
    const { error } = await adminSupabase.from("support_requests").insert({
      user_id: user?.id ?? null,
      request_type: requestType,
      email,
      subject,
      message,
      user_agent: request.headers.get("user-agent"),
    });

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/supporto?error=${encodeURIComponent(error.message)}`,
          request.url
        )
      );
    }
  } else {
    console.info("Support request", {
      user_id: user?.id ?? null,
      request_type: requestType,
      email,
      subject,
      message,
    });
  }

  return NextResponse.redirect(new URL("/supporto?sent=1", request.url), {
    status: 303,
  });
}
