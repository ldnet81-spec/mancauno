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

function isActive(pathname: string, href: string) {
  return pathname === href;
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

  const navItems = [
    {
      href: "/",
      label: "Home",
      show: true,
    },
    {
      href: "/eventi/nuovo",
      label: "Crea",
      show: userState.isLoggedIn,
    },
    {
      href: "/profilo/eventi",
      label: "Eventi",
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
            className="h-11 w-auto"
            priority
          />
        </Link>

        {!userState.isLoggedIn ? (
          <Link
            href="/auth/quick-signup"
            className="rounded-full bg-black px-4 py-2 text-sm font-medium !text-white"
          >
            Accedi
          </Link>
        ) : null}
      </div>

      <nav className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-h-10 items-center justify-center rounded-full px-3 py-2 text-center text-sm font-medium ${
                  active
                    ? "bg-black !text-white"
                    : "border border-gray-200 bg-white text-gray-800"
                }`}
              >
                <span className="truncate">{item.label}</span>

                {item.badge ? (
                  <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold !text-white">
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
