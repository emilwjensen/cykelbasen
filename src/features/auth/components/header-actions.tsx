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
        <Link href="/auth/log-ind">Log ind</Link>
        <Link className="header-status" href="/auth/opret">
          Opret konto
        </Link>
      </div>
    );
  }

  return (
    <div className="header-actions">
      <Link href="/mine-annoncer">Mine annoncer</Link>
      <form action={signOutAction}>
        <button className="header-signout" type="submit">
          Log ud
        </button>
      </form>
    </div>
  );
}

