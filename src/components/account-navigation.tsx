"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/features/auth/actions";

const accountItems = [
  {
    href: "/mine-cykler",
    label: "Mine cykler",
    matches: (pathname: string) => pathname.startsWith("/mine-cykler"),
  },
  {
    href: "/favoritter",
    label: "Favoritter",
    matches: (pathname: string) => pathname.startsWith("/favoritter"),
  },
  {
    href: "/mine-annoncer",
    label: "Mine annoncer",
    matches: (pathname: string) => pathname.startsWith("/mine-annoncer"),
  },
  {
    href: "/henvendelser",
    label: "Henvendelser",
    matches: (pathname: string) => pathname.startsWith("/henvendelser"),
  },
  {
    href: "/notifikationer",
    label: "Notifikationer",
    matches: (pathname: string) => pathname.startsWith("/notifikationer"),
  },
  {
    href: "/profil",
    label: "Profil",
    matches: (pathname: string) => pathname.startsWith("/profil"),
  },
  {
    href: "/konto",
    label: "Data og konto",
    matches: (pathname: string) => pathname.startsWith("/konto"),
  },
] as const;

export function AccountNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dit Cykelbasen-overblik" className="section-nav">
      <span className="section-nav__label">Din konto</span>
      <div className="section-nav__links">
        {accountItems.map((item) => {
          const active = item.matches(pathname);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={active ? "is-active" : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
        <form action={signOutAction}>
          <button className="section-nav__signout" type="submit">
            Log ud
          </button>
        </form>
      </div>
    </nav>
  );
}
