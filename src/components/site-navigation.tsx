"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    href: "/cykler",
    label: "Find cykel",
    matches: (pathname: string) =>
      pathname.startsWith("/cykler") || pathname.startsWith("/sammenlign"),
  },
  {
    href: "/annoncer/ny",
    label: "Sælg cykel",
    matches: (pathname: string) => pathname.startsWith("/annoncer"),
  },
  {
    href: "/forum",
    label: "Forum",
    matches: (pathname: string) => pathname.startsWith("/forum"),
  },
] as const;

export function SiteNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primær navigation" className="site-nav">
      {navigationItems.map((item) => {
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
    </nav>
  );
}
