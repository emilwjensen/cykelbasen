import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div>
          <p className="wordmark wordmark--footer">
            <span className="wordmark__mark" aria-hidden="true">
              <svg viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="11" />
                <circle cx="18" cy="18" r="2.25" />
                <path d="M18 7v22M7 18h22M10.2 10.2l15.6 15.6M25.8 10.2 10.2 25.8" />
              </svg>
            </span>
            <span>Cykelbasen</span>
          </p>
          <p className="site-footer__intro">
            Brugte racercykler med klare specifikationer, dokumenteret ejerskab
            og plads til nørdet cykelsnak.
          </p>
        </div>
        <div>
          <p className="site-footer__heading">Markedsplads</p>
          <Link href="/cykler">Se alle cykler</Link>
          <Link href="/favoritter">Favoritter</Link>
          <Link href="/henvendelser">Henvendelser</Link>
          <Link href="/annoncer/ny">Sælg din cykel</Link>
          <Link href="/mine-cykler">Mine cykler</Link>
        </div>
        <div>
          <p className="site-footer__heading">Tryghed</p>
          <span>Ejerskabskontrol</span>
          <span>Moderation</span>
          <Link href="/forum">Cykelforum</Link>
        </div>
      </div>
      <div className="shell site-footer__bottom">
        <span>© {new Date().getFullYear()} Cykelbasen</span>
        <span>Bygget til danske cykler og deres næste ejere</span>
      </div>
    </footer>
  );
}
