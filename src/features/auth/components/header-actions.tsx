"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "../actions";
import { authClient } from "@/lib/auth/client";

export function HeaderActions() {
  const { data: session, isPending } = authClient.useSession();
  const pathname = usePathname();

  if (isPending) {
    return <span className="header-status header-status--loading">Henter…</span>;
  }

  if (!session?.user) {
    return (
      <div className="header-actions">
        <Link className="header-actions__login" href="/auth/log-ind">
          Log ind
        </Link>
        <Link className="header-status header-actions__signup" href="/auth/opret">
          Opret konto
        </Link>
      </div>
    );
  }

  const accountActive =
    pathname.startsWith("/mine-") ||
    pathname.startsWith("/favoritter") ||
    pathname.startsWith("/henvendelser") ||
    pathname.startsWith("/profil");

  return (
    <div className="header-actions">
      <Link
        aria-current={accountActive ? "page" : undefined}
        className={`header-actions__account${accountActive ? " is-active" : ""}`}
        href="/mine-cykler"
      >
        Min konto
      </Link>
      <form action={signOutAction}>
        <button className="header-signout" type="submit">
          Log ud
        </button>
      </form>
    </div>
  );
}
