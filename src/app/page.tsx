import Link from "next/link";
import { ListingCard } from "@/features/listings/components/listing-card";
import { getFeaturedListings } from "@/features/listings/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const listings = await getFeaturedListings(3);

  return (
    <>
      <section className="hero">
        <div className="shell hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">Racercykler, uden gættearbejdet</p>
            <h1>Den rigtige cykel begynder med de rigtige oplysninger.</h1>
            <p className="hero__lead">
              Sammenlign brugte racercykler på størrelse, udstyr og stand.
              Hver publiceret annonce har dokumenteret ejerskab.
            </p>
            <div className="hero__actions">
              <Link className="button button--accent" href="/cykler">
                Find din næste cykel
              </Link>
              <a className="text-link" href="#saadan-virker-det">
                Sådan skaber vi tryghed <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          <div className="hero__panel" aria-label="Tre principper for Cykelbasen">
            <p className="hero__panel-kicker">Et bedre brugtmarked</p>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>Specs du kan søge i</strong>
                  <p>Størrelse, materiale, geargruppe og bremser.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Ejerskab før publicering</strong>
                  <p>Dokumentation gennemgås, før annoncen bliver synlig.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Menneskelig moderation</strong>
                  <p>Rapporter og dokumenter vurderes med kontekst.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="shell trust-strip__inner">
          <span>Dokumenteret ejerskab</span>
          <span>Strukturerede cykeldata</span>
          <span>Dansk markedsplads</span>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Nye annoncer</p>
            <h2>Udvalgte cykler</h2>
          </div>
          <Link className="text-link" href="/cykler">
            Se alle cykler <span aria-hidden="true">→</span>
          </Link>
        </div>
        {listings.length ? (
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="eyebrow">Vi gør klar</p>
            <h2>De første cykler er på vej.</h2>
            <p>Kom tilbage snart, eller udforsk de filtre vi bygger markedet på.</p>
            <Link className="button button--dark" href="/cykler">
              Se markedspladsen
            </Link>
          </div>
        )}
      </section>

      <section className="process" id="saadan-virker-det">
        <div className="shell">
          <div className="section-heading section-heading--light">
            <div>
              <p className="eyebrow">Tillid som arbejdsgang</p>
              <h2>En annonce bliver ikke bare lagt op.</h2>
            </div>
            <p>
              Vi bruger tydelige trin i stedet for et uklart pointsystem.
            </p>
          </div>
          <div className="process__grid">
            <article>
              <span>01</span>
              <h3>Sælger beskriver cyklen</h3>
              <p>
                Obligatoriske felter sikrer, at køberen kan sammenligne på tværs.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Ejerskab dokumenteres</h3>
              <p>
                Kvittering eller anden dokumentation opbevares privat og vurderes.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Annoncen publiceres</h3>
              <p>
                Først efter godkendelse bliver cyklen synlig i søgning og filtre.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}

