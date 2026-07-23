import Link from "next/link";
import { HeaderActions } from "@/features/auth/components/header-actions";
import { SiteNavigation } from "@/components/site-navigation";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link aria-label="Cykelbasen – forside" className="wordmark" href="/">
          <span className="wordmark__mark" aria-hidden="true">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="11" />
              <circle cx="18" cy="18" r="2.25" />
              <path d="M18 7v22M7 18h22M10.2 10.2l15.6 15.6M25.8 10.2 10.2 25.8" />
            </svg>
          </span>
          <span>Cykelbasen</span>
        </Link>
        <SiteNavigation />
        <HeaderActions />
      </div>
    </header>
  );
}
