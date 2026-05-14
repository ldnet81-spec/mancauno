import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { sanitizeNextPath } from "../../../lib/auth-redirect";
import QuickSignupForm from "./QuickSignupForm";

type QuickSignupPageProps = {
  searchParams: Promise<{
    event?: string;
    next?: string;
  }>;
};

export default async function QuickSignupPage({
  searchParams,
}: QuickSignupPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Chi e gia loggato non deve vedere il form di login: lo mandiamo a destinazione.
  if (user) {
    const destination = params.event
      ? `/e/${params.event}?join=1`
      : sanitizeNextPath(params.next, "/profilo");
    redirect(destination);
  }

  return (
    <Suspense>
      <QuickSignupForm />
    </Suspense>
  );
}
