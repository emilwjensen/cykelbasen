"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    href: "/profil",
    label: "Profil",
    matches: (pathname: string) => pathname.startsWith("/profil"),
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
      </div>
    </nav>
  );
}
