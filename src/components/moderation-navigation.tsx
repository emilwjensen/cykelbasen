"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const moderationItems = [
  {
    href: "/admin/dokumentation",
    label: "Dokumentkontrol",
    matches: (pathname: string) => pathname.startsWith("/admin/dokumentation"),
  },
  {
    href: "/admin/rapporter",
    label: "Forumrapporter",
    matches: (pathname: string) => pathname === "/admin/rapporter",
  },
  {
    href: "/admin/rapporter/annoncer",
    label: "Annoncerapporter",
    matches: (pathname: string) =>
      pathname.startsWith("/admin/rapporter/annoncer"),
  },
] as const;

export function ModerationNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Moderatorområde" className="section-nav section-nav--admin">
      <span className="section-nav__label">Moderator</span>
      <div className="section-nav__links">
        {moderationItems.map((item) => {
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
