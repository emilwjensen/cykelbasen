import Link from "next/link";
import { ListingCard } from "@/features/listings/components/listing-card";
import { getFeaturedListings } from "@/features/listings/queries";
import { bikeCategories } from "@/features/listings/types";

export const dynamic = "force-dynamic";

const categoryLinks = [
  {
    value: "road",
    label: "Landevej",
    description: "Fart, lange ture og klassisk asfalt",
    number: "01",
  },
  {
    value: "gravel",
    label: "Gravel",
    description: "Én cykel til asfalt og grus",
    number: "02",
  },
  {
    value: "triathlon",
    label: "Triatlon / TT",
    description: "Aerodynamik og fart mod uret",
    number: "03",
  },
  {
    value: "vintage",
    label: "Vintage",
    description: "Klassikere med historie og karakter",
    number: "04",
  },
] as const;

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function BikeIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="bike-illustration"
      viewBox="0 0 680 390"
    >
      <g className="bike-illustration__wheels">
        <circle cx="158" cy="252" r="96" />
        <circle cx="522" cy="252" r="96" />
        <circle cx="158" cy="252" r="4" />
        <circle cx="522" cy="252" r="4" />
      </g>
      <g className="bike-illustration__frame">
        <path d="M158 252 278 119 309 252 158 252Z" />
        <path d="M278 119 429 132 448 229 309 252 278 119Z" />
        <path d="M158 252 309 252" />
      </g>
      <g className="bike-illustration__details">
        <path d="M429 132 522 252M448 229 522 252" />
        <path d="M278 119 264 89M236 88h59" />
        <path d="M429 132 443 91 474 78" />
        <path d="M471 78c16 0 20 12 10 21l-14 12" />
        <circle cx="309" cy="252" r="16" />
        <path d="m309 252 30 17M309 252l-28-16M339 269h23M260 236h21" />
        <path d="M309 252 158 252M448 229 522 252" />
      </g>
    </svg>
  );
}

export default async function HomePage() {
  const listings = await getFeaturedListings(3);

  return (
    <>
      <section className="hero">
        <div className="shell hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">Danmarks specialiserede cykelmarked</p>
            <h1>
              Den næste cykel.
              <span>Uden tvivlen.</span>
            </h1>
            <p className="hero__lead">
              Find brugte racer- og gravelcykler med sammenlignelige
              specifikationer og ejerskab, der er godkendt før publicering.
            </p>

            <form action="/cykler" className="hero-search">
              <label className="hero-search__query">
                <span>Søg efter mærke eller model</span>
                <span className="hero-search__input">
                  <SearchIcon />
                  <input
                    name="q"
                    placeholder="Fx Cannondale SuperSix"
                    type="search"
                  />
                </span>
              </label>
              <label>
                <span>Type</span>
                <select defaultValue="" name="category">
                  <option value="">Alle typer</option>
                  {bikeCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button--accent" type="submit">
                Find cykel <span aria-hidden="true">→</span>
              </button>
            </form>

            <div className="hero__popular" aria-label="Populære søgninger">
              <span>Populært:</span>
              <Link href="/cykler?category=road">Landevej</Link>
              <Link href="/cykler?category=gravel">Gravel</Link>
              <Link href="/cykler?material=carbon">Carbon</Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-visual__top">
              <span>En bedre cykelhandel</span>
              <span className="hero-visual__status">
                <span>✓</span> Kontrolleret
              </span>
            </div>
            <div className="hero-visual__bike">
              <BikeIllustration />
              <span className="hero-visual__annotation hero-visual__annotation--one">
                <strong>56 cm</strong>
                Tydelig størrelse
              </span>
              <span className="hero-visual__annotation hero-visual__annotation--two">
                <strong>Carbon</strong>
                Søgbare specs
              </span>
            </div>
            <div className="hero-visual__footer">
              <div>
                <span>Før du tager kontakt</span>
                <strong>Du kender cyklen</strong>
              </div>
              <span className="hero-visual__check">✓</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Cykelbasens principper" className="trust-strip">
        <div className="shell trust-strip__inner">
          <span><i aria-hidden="true">✓</i> Ejerskab gennemgået</span>
          <span><i aria-hidden="true">⌁</i> Specs du kan filtrere på</span>
          <span><i aria-hidden="true">◎</i> Modereret i Danmark</span>
        </div>
      </section>

      <section className="home-categories shell" aria-labelledby="categories-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start med kørestilen</p>
            <h2 id="categories-title">Hvad leder du efter?</h2>
          </div>
          <p className="section-heading__intro">
            Gå direkte til den cykeltype, der matcher dine ture.
          </p>
        </div>
        <div className="category-grid">
          {categoryLinks.map((category) => (
            <Link
              className="category-card"
              href={`/cykler?category=${category.value}`}
              key={category.value}
            >
              <span className="category-card__number">{category.number}</span>
              <div>
                <h3>{category.label}</h3>
                <p>{category.description}</p>
              </div>
              <span className="category-card__arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--listings">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Senest på markedet</p>
              <h2>Nyankomne cykler</h2>
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
              <p>
                Markedspladsen åbner med samme klare specs og ejerskabskontrol
                på alle annoncer.
              </p>
              <Link className="button button--dark" href="/annoncer/ny">
                Opret den første annonce
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="home-trust" id="saadan-virker-det">
        <div className="shell home-trust__grid">
          <div className="home-trust__copy">
            <p className="eyebrow">Tillid er ikke et badge</p>
            <h2>Vi tjekker før annoncen møder markedet.</h2>
            <p>
              På Cykelbasen er tryghed en arbejdsgang. Følsomme dokumenter
              forbliver private, mens køberen får det overblik, der er vigtigt
              for en god handel.
            </p>
            <Link className="text-link" href="/cykler">
              Udforsk godkendte annoncer <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ol className="trust-steps">
            <li>
              <span>01</span>
              <div>
                <h3>Beskriv cyklen</h3>
                <p>Faste felter gør størrelse, stand og udstyr let at sammenligne.</p>
              </div>
              <strong aria-hidden="true">✓</strong>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Dokumentér ejerskab</h3>
                <p>Dokumentationen opbevares privat og bliver gennemgået.</p>
              </div>
              <strong aria-hidden="true">✓</strong>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Bliv synlig</h3>
                <p>Først efter godkendelsen vises annoncen i søgning og filtre.</p>
              </div>
              <strong aria-hidden="true">✓</strong>
            </li>
          </ol>
        </div>
      </section>

      <section className="seller-cta shell">
        <div>
          <p className="eyebrow">Klar til næste ejer?</p>
          <h2>Sælg cyklen med de detaljer, du selv ville lede efter.</h2>
        </div>
        <div className="seller-cta__actions">
          <Link className="button button--accent" href="/annoncer/ny">
            Opret annonce <span aria-hidden="true">→</span>
          </Link>
          <span>Gem som kladde og fortsæt senere</span>
        </div>
      </section>
    </>
  );
}
