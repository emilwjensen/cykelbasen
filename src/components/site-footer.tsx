import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__grid">
        <div>
          <p className="wordmark wordmark--footer">
            <span className="wordmark__mark">CB</span>
            <span>Cykelbasen</span>
          </p>
          <p className="site-footer__intro">
            En fokuseret dansk markedsplads for brugte racercykler med klare
            specifikationer og dokumenteret ejerskab.
          </p>
        </div>
        <div>
          <p className="site-footer__heading">Markedsplads</p>
          <Link href="/cykler">Se alle cykler</Link>
          <Link href="/favoritter">Favoritter</Link>
          <Link href="/annoncer/ny">Sælg din cykel</Link>
          <Link href="/mine-cykler">Mine cykler</Link>
        </div>
        <div>
          <p className="site-footer__heading">Tryghed</p>
          <span>Ejerskabskontrol</span>
          <span>Moderation</span>
        </div>
      </div>
      <div className="shell site-footer__bottom">
        <span>© {new Date().getFullYear()} Cykelbasen</span>
        <span>Bygget til det danske cykelfællesskab</span>
      </div>
    </footer>
  );
}
