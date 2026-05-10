import { createClient } from "../lib/supabase/server";
import AppHeader from "./AppHeader";

export default async function AppHeaderServer() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AppHeader />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return (
    <AppHeader
      initialUserState={{
        isLoggedIn: true,
        isAdmin: profile?.role === "admin",
        unreadNotifications: count ?? 0,
      }}
    />
  );
}
