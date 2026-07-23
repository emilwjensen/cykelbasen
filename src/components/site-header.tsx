import Link from "next/link";
import { HeaderActions } from "@/features/auth/components/header-actions";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link aria-label="Cykelbasen – forside" className="wordmark" href="/">
          <span className="wordmark__mark">CB</span>
          <span>Cykelbasen</span>
        </Link>
        <nav aria-label="Primær navigation" className="site-nav">
          <Link href="/cykler">Find cykel</Link>
          <span className="site-nav__soon" title="Forum bygges i en senere fase">
            Forum <small>snart</small>
          </span>
        </nav>
        <HeaderActions />
      </div>
    </header>
  );
}

