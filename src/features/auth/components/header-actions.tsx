"use client";

import Link from "next/link";
import { signOutAction } from "../actions";
import { authClient } from "@/lib/auth/client";

export function HeaderActions() {
  const { data: session, isPending } = authClient.useSession();

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

  return (
    <div className="header-actions">
      <Link className="header-actions__favorite" href="/favoritter">
        Favoritter
      </Link>
      <Link className="header-actions__garage" href="/mine-cykler">
        Mine cykler
      </Link>
      <Link className="header-actions__listings" href="/mine-annoncer">
        Mine annoncer
      </Link>
      <form action={signOutAction}>
        <button className="header-signout" type="submit">
          Log ud
        </button>
      </form>
    </div>
  );
}
