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
    <svg aria-hidden="true" className="bike-illustration" viewBox="0 0 680 390">
      <g className="bike-illustration__wheels">
        <circle className="bike-illustration__tyre" cx="188" cy="254" r="96" />
        <circle className="bike-illustration__rim" cx="188" cy="254" r="88" />
        <circle className="bike-illustration__tyre" cx="492" cy="254" r="96" />
        <circle className="bike-illustration__rim" cx="492" cy="254" r="88" />
        <g className="bike-illustration__spokes">
          <path d="M188 166v176M100 254h176M126 192l124 124M126 316l124-124" />
          <path d="M492 166v176M404 254h176M430 192l124 124M430 316l124-124" />
        </g>
        <circle className="bike-illustration__hub" cx="188" cy="254" r="6" />
        <circle className="bike-illustration__hub" cx="492" cy="254" r="6" />
      </g>
      <g className="bike-illustration__frame">
        <path d="M188 254 258 122 415 129 428 177 303 272 188 254Z" />
        <path d="M258 122 303 272" />
      </g>
      <path className="bike-illustration__frame-accent" d="M275 178 287 218" />
      <g className="bike-illustration__fork">
        <path d="M428 177c18 27 41 58 64 77" />
        <path d="M435 175c17 28 38 57 55 79" />
      </g>
      <g className="bike-illustration__cockpit">
        <path d="M258 122 247 91M219 89l57 1" />
        <path d="M415 129 428 106 460 107" />
        <path d="M458 107c17 0 20 12 11 25l-9 13c-6 9-1 17 12 17" />
      </g>
      <g className="bike-illustration__drivetrain">
        <circle cx="303" cy="272" r="21" />
        <circle cx="303" cy="272" r="7" />
        <circle cx="188" cy="254" r="9" />
        <path d="M188 245 300 251M189 263l115 30" />
        <path d="m303 272 27 18M303 272l-23-20M330 290h23M261 252h19" />
        <path d="M182 260c2 15 12 23 25 22l18-1" />
      </g>
      <g className="bike-illustration__bottle">
        <path d="m365 198 12 10-35 43-13-11 35-43Z" />
        <path d="m365 197 6-7 10 8-6 10" />
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
              Køb og sælg racercykler.
              <span>Med tillid.</span>
            </h1>
            <p className="hero__lead">
              Verificerede sælgere, dokumenteret ejerskab og strukturerede
              specifikationer gør det nemmere at finde den rigtige cykel.
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
                <span>✓</span> Verificeret annonce
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
                <strong>Du ved, hvad du køber</strong>
              </div>
              <span className="hero-visual__check">✓</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Cykelbasens principper" className="trust-strip">
        <div className="shell trust-strip__inner">
          <span>
            <i aria-hidden="true">✓</i> Dokumenteret ejerskab
          </span>
          <span>
            <i aria-hidden="true">⌁</i> Strukturerede specifikationer
          </span>
          <span>
            <i aria-hidden="true">◎</i> Modereret af mennesker
          </span>
        </div>
      </section>

      <section
        className="home-categories shell"
        aria-labelledby="categories-title"
      >
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
              <span className="category-card__arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--listings">
        <div className="shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Senest på markedet</p>
              <h2>Nye opslag</h2>
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
                <p>
                  Faste felter gør størrelse, stand og udstyr let at
                  sammenligne.
                </p>
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
                <p>
                  Først efter godkendelsen vises annoncen i søgning og filtre.
                </p>
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
