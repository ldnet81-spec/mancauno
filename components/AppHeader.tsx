"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

type UserState = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  unreadNotifications: number;
};

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export default function AppHeader() {
  const pathname = usePathname();
  const supabase = createClient();

  const [userState, setUserState] = useState<UserState>({
    isLoggedIn: false,
    isAdmin: false,
    unreadNotifications: 0,
  });

  useEffect(() => {
    async function loadUserState() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserState({
          isLoggedIn: false,
          isAdmin: false,
          unreadNotifications: 0,
        });
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

      setUserState({
        isLoggedIn: true,
        isAdmin: profile?.role === "admin",
        unreadNotifications: count ?? 0,
      });
    }

    loadUserState();
  }, [supabase]);

  const navItems = [
    {
      href: "/",
      label: "Home",
      show: true,
    },
    {
      href: "/eventi/nuovo",
      label: "Crea evento",
      show: userState.isLoggedIn,
    },
    {
      href: "/profilo/eventi",
      label: "I miei eventi",
      show: userState.isLoggedIn,
    },
    {
      href: "/notifiche",
      label: "Notifiche",
      show: userState.isLoggedIn,
      badge: userState.unreadNotifications,
    },
    {
      href: "/profilo",
      label: "Profilo",
      show: userState.isLoggedIn,
    },
    {
      href: "/admin",
      label: "Admin",
      show: userState.isLoggedIn && userState.isAdmin,
    },
  ];

  return (
    <header className="mb-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/logo-full.png"
            alt="mancauno.it"
            width={180}
            height={48}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {!userState.isLoggedIn ? (
          <Link
            href="/auth/quick-signup"
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Accedi
          </Link>
        ) : null}
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                  active
  ? "!bg-black !text-white"
  : "border border-gray-200 bg-white text-gray-800"
                }`}
              >
                {item.label}

                {item.badge ? (
                  <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
      </nav>
    </header>
  );
}