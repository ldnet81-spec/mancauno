"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase/client";

type UserState = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  unreadNotifications: number;
};

type AppHeaderProps = {
  initialUserState?: UserState;
};

type IconName = "home" | "calendar" | "plus" | "bell" | "user" | "admin";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function Icon({ name }: { name: IconName }) {
  if (name === "admin") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <path d="M12 3 19 6v5c0 4.6-2.8 8.7-7 10-4.2-1.3-7-5.4-7-10V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9.5 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 9.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "bell") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 20a2.4 2.4 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M5 21a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
      <path d="m3 11 9-7 9 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10.5V20h12v-9.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 20v-6h4v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default function AppHeader({ initialUserState }: AppHeaderProps) {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const [userState, setUserState] = useState<UserState>(
    initialUserState ?? {
      isLoggedIn: false,
      isAdmin: false,
      unreadNotifications: 0,
    }
  );

  useEffect(() => {
    let ignore = false;

    async function loadUserState() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (initialUserState?.isLoggedIn) {
          return;
        }

        if (!ignore) {
          setUserState({
            isLoggedIn: false,
            isAdmin: false,
            unreadNotifications: 0,
          });
        }
        return;
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

      if (!ignore) {
        setUserState({
          isLoggedIn: true,
          isAdmin: profile?.role === "admin",
          unreadNotifications: count ?? 0,
        });
      }
    }

    loadUserState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUserState();
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [initialUserState?.isLoggedIn, supabase]);

  const createHref = userState.isLoggedIn ? "/eventi/nuovo" : "/auth/quick-signup";
  const profileHref = userState.isLoggedIn ? "/profilo" : "/auth/quick-signup";
  const notificationsHref = userState.isLoggedIn ? "/notifiche" : "/auth/quick-signup";

  const navItems = [
    { href: "/", label: "Home", icon: "home" as IconName, show: true },
    { href: "/profilo/eventi", label: "Eventi", icon: "calendar" as IconName, show: userState.isLoggedIn },
    { href: createHref, label: "Crea", icon: "plus" as IconName, show: true, featured: true },
    { href: notificationsHref, label: "Notifiche", icon: "bell" as IconName, show: true, badge: userState.unreadNotifications },
    { href: profileHref, label: "Profilo", icon: "user" as IconName, show: true },
    { href: "/admin", label: "Admin", icon: "user" as IconName, show: userState.isLoggedIn && userState.isAdmin },
  ];

  return (
    <header className="sticky top-3 z-40 mb-8">
      <div className="rounded-[1.75rem] border border-white/80 bg-white/88 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-w-0 items-center">
            <Image
              src="/logo-full.png"
              alt="mancauno.it"
              width={280}
              height={76}
              className="h-12 w-auto max-w-[210px] sm:h-16 sm:max-w-[320px]"
              priority
            />
          </Link>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={notificationsHref}
              aria-label="Notifiche"
              className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 transition hover:text-blue-600 sm:h-16 sm:w-16"
            >
              <Icon name="bell" />
              {userState.unreadNotifications ? (
                <span className="absolute right-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-orange-600 px-1 text-xs font-black text-white ring-2 ring-white">
                  {userState.unreadNotifications}
                </span>
              ) : null}
            </Link>

            {userState.isAdmin ? (
              <Link
                href="/admin"
                aria-label="Admin"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 font-black text-white shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition hover:bg-blue-700 sm:h-16 sm:px-5"
              >
                <Icon name="admin" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            ) : null}

            <Link
              href={createHref}
              aria-label="Crea un evento"
              className="grid h-16 w-16 place-items-center rounded-[1.35rem] bg-orange-600 text-white shadow-[0_18px_35px_rgba(234,88,12,0.32)] transition hover:bg-orange-700 sm:h-20 sm:w-20"
            >
              <Icon name="plus" />
            </Link>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-[1.75rem] border border-white/80 bg-white/92 px-3 py-2 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:px-6 lg:hidden">
        <div className="grid grid-cols-5 items-end gap-1">
          {navItems
            .filter((item) => item.show)
            .slice(0, 5)
            .map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-xs font-bold transition sm:text-base ${
                    item.featured
                      ? "-mt-8 text-orange-600"
                      : active
                        ? "text-blue-600"
                        : "text-slate-500 hover:text-blue-600"
                  }`}
                >
                  <span
                    className={
                      item.featured
                        ? "grid h-16 w-16 place-items-center rounded-full bg-orange-600 text-white shadow-[0_14px_35px_rgba(234,88,12,0.35)] ring-4 ring-white"
                        : "relative grid h-8 w-8 place-items-center"
                    }
                  >
                    <Icon name={item.icon} />
                    {item.badge ? (
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-600 px-1 text-[10px] font-black text-white ring-2 ring-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </div>
      </nav>
    </header>
  );
}

