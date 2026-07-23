import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactRequestForm } from "@/features/contact-requests/components/contact-request-form";
import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { isListingFavorite } from "@/features/favorites/queries";
import { ListingReportForm } from "@/features/listing-reports/components/listing-report-form";
import { CompareButton } from "@/features/listings/components/compare-controls";
import { ListingGallery } from "@/features/listings/components/listing-gallery";
import {
  brakeLabel,
  categoryLabel,
  conditionLabel,
  formatDate,
  formatPrice,
  materialLabel,
} from "@/features/listings/format";
import { getListingById } from "@/features/listings/queries";
import { componentCategories } from "@/features/listings/types";
import { getCurrentUser } from "@/lib/auth/server";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type ListingPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tilbage?: string | string[];
    rapport?: string;
    kontakt?: string;
  }>;
};

function safeReturnUrl(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.startsWith("/cykler") ||
    first?.startsWith("/sammenlign") ||
    first === "/favoritter"
    ? first
    : "/cykler";
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) return { title: "Annonce ikke fundet" };

  return {
    title: listing.title,
    description: `${listing.brand} ${listing.model}, str. ${listing.frame_size_label}, i ${listing.city}.`,
    alternates: { canonical: `/cykler/${listing.id}` },
    openGraph: {
      type: "website",
      title: listing.title,
      description: `${listing.brand} ${listing.model}, str. ${listing.frame_size_label}, i ${listing.city}.`,
      images: listing.images[0]
        ? [
            {
              url: listing.images[0].image_url,
              alt: listing.images[0].alt_text,
            },
          ]
        : undefined,
    },
  };
}

export default async function ListingPage({
  params,
  searchParams,
}: ListingPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const [listing, user] = await Promise.all([
    getListingById(id),
    getCurrentUser(),
  ]);

  if (!listing) notFound();

  const favorite = user
    ? await isListingFavorite(user.id, listing.id)
    : false;
  const returnUrl = safeReturnUrl(resolvedSearchParams.tilbage);

  const specs = [
    ["Type", categoryLabel(listing.category)],
    ["Modelår", listing.model_year?.toString() ?? "Ikke angivet"],
    [
      "Størrelse",
      `${listing.frame_size_label}${listing.frame_size_cm ? ` · ${listing.frame_size_cm} cm` : ""}`,
    ],
    ["Stel", materialLabel(listing.material)],
    [
      "Geargruppe",
      [listing.groupset_brand, listing.groupset_model].filter(Boolean).join(" ") ||
        "Ikke angivet",
    ],
    ["Drivlinje", listing.drivetrain ?? "Ikke angivet"],
    ["Bremser", brakeLabel(listing.brakes)],
    ["Hjulstørrelse", listing.wheel_size ?? "Ikke angivet"],
    ["Elektronisk gear", listing.electronic_shifting ? "Ja" : "Nej"],
    ["Stand", conditionLabel(listing.condition)],
    ["Købt af sælger", formatDate(listing.purchase_date)],
    [
      "Kendt ejerhistorik",
      listing.owner_count === 1
        ? "1 ejer"
        : `${listing.owner_count} ejere inkl. sælger`,
    ],
  ];
  const componentLabels = Object.fromEntries(
    componentCategories.map((category) => [category.value, category.label]),
  );
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    image: listing.images.map((image) => image.image_url),
    description: listing.description,
    brand: { "@type": "Brand", name: listing.brand },
    model: listing.model,
    itemCondition: "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      price: listing.price_dkk,
      priceCurrency: "DKK",
      availability:
        listing.status === "published"
          ? "https://schema.org/InStock"
          : "https://schema.org/LimitedAvailability",
      url: `${getSiteUrl()}/cykler/${listing.id}`,
    },
  };

  return (
    <div className="shell detail">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <Link className="back-link" href={returnUrl}>
        <span aria-hidden="true">←</span> Tilbage til søgeresultater
      </Link>

      {resolvedSearchParams.rapport === "sendt" && (
        <p className="form-message form-message--success">
          Tak. Rapporten er sendt til moderatorerne.
        </p>
      )}
      {resolvedSearchParams.rapport === "allerede" && (
        <p className="form-message">
          Du har allerede rapporteret denne annonce.
        </p>
      )}
      {["ugyldig", "fejl"].includes(resolvedSearchParams.rapport ?? "") && (
        <p className="form-message form-message--error">
          Rapporten kunne ikke sendes. Kontrollér oplysningerne og prøv igen.
        </p>
      )}
      {resolvedSearchParams.kontakt === "sendt" && (
        <p className="form-message form-message--success">
          Henvendelsen er sendt. Sælgeren kan nu svare på din kontomail.
        </p>
      )}
      {resolvedSearchParams.kontakt === "allerede" && (
        <p className="form-message">
          Du har allerede en aktiv henvendelse på denne annonce.
        </p>
      )}
      {resolvedSearchParams.kontakt === "begraenset" && (
        <p className="form-message form-message--error">
          Du har sendt for mange henvendelser på kort tid. Prøv igen senere.
        </p>
      )}
      {["ugyldig", "fejl"].includes(resolvedSearchParams.kontakt ?? "") && (
        <p className="form-message form-message--error">
          Henvendelsen kunne ikke sendes. Kontrollér beskeden og prøv igen.
        </p>
      )}

      <div className="detail__grid">
        <div>
          <ListingGallery images={listing.images} title={listing.title} />
          <div className="detail__verified">
            <span className="verified-icon">✓</span>
            <div>
              <strong>Ejerskab dokumenteret</strong>
              <p>
                Dokumentationen er gennemgået før publicering. Følsomme
                dokumenter og stelnummer vises aldrig offentligt.
              </p>
            </div>
          </div>
          <div className="trust-facts">
            <span className={listing.purchase_proof_available ? "is-positive" : ""}>
              {listing.purchase_proof_available ? "✓" : "–"} Købsdokumentation
            </span>
            <span className={listing.service_history_available ? "is-positive" : ""}>
              {listing.service_history_available ? "✓" : "–"} Servicehistorik
            </span>
            <span className="is-positive">
              ✓ Ejerskab godkendt
            </span>
          </div>
        </div>

        <aside className="detail__summary">
          <p className="eyebrow">
            {categoryLabel(listing.category)} · {listing.city}
          </p>
          {listing.status === "reserved" && (
            <div className="detail__reserved">
              <strong>Reserveret</strong>
              <span>
                Annoncen er stadig synlig, men sælger modtager ikke nye
                henvendelser lige nu.
              </span>
            </div>
          )}
          <h1>{listing.title}</h1>
          <p className="detail__price">{formatPrice(listing.price_dkk)}</p>
          <div className="detail__quick-specs">
            <span>Str. {listing.frame_size_label}</span>
            <span>{listing.model_year ?? "År ikke angivet"}</span>
            <span>{conditionLabel(listing.condition)}</span>
          </div>
          <FavoriteButton
            authenticated={Boolean(user)}
            isFavorite={favorite}
            listingId={listing.id}
          />
          <CompareButton id={listing.id} title={listing.title} />
          <div className="seller-card">
            <p className="seller-card__label">Sælger</p>
            <strong>{listing.seller_name}</strong>
            <span>{listing.seller_city ?? listing.city}</span>
          </div>
          {user?.id === listing.seller_id ? (
            listing.status === "reserved" ? (
              <Link className="button button--quiet button--full" href="/henvendelser">
                Håndtér reservation
              </Link>
            ) : null
          ) : listing.status === "reserved" ? (
            <div className="reservation-inline-note">
              Denne cykel er reserveret til en anden køber.
            </div>
          ) : user?.email ? (
            <ContactRequestForm
              buyerEmail={user.email}
              listingId={listing.id}
              returnUrl={returnUrl}
            />
          ) : (
            <Link
              className="button button--accent button--full"
              href={`/auth/log-ind?returnTo=${encodeURIComponent(
                `/cykler/${listing.id}?tilbage=${encodeURIComponent(returnUrl)}`,
              )}`}
            >
              Log ind for at kontakte
            </Link>
          )}
          <p className="detail__date">
            Publiceret {formatDate(listing.published_at)}
          </p>
          {user && user.id !== listing.seller_id && (
            <ListingReportForm listingId={listing.id} returnUrl={returnUrl} />
          )}
        </aside>
      </div>

      <div className="detail__content">
        <section>
          <p className="eyebrow">Om cyklen</p>
          <h2>Beskrivelse</h2>
          <p className="detail__description">{listing.description}</p>
          {listing.shipping_offered && (
            <p className="shipping-note">Sælger tilbyder forsendelse efter aftale.</p>
          )}
        </section>
        <section>
          <p className="eyebrow">Overblik</p>
          <h2>Specifikationer</h2>
          <dl className="spec-list">
            {specs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="component-history">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Dokumenteret historik</p>
            <h2>Udskiftede komponenter</h2>
          </div>
          <p>
            Ændringerne er oplyst af sælger. Bilag vises ikke offentligt.
          </p>
        </div>
        {listing.component_changes.length ? (
          <div className="component-history__list">
            {listing.component_changes.map((change) => (
              <article key={change.id}>
                <div>
                  <span>{componentLabels[change.category]}</span>
                  {change.changed_on && <time>{formatDate(change.changed_on)}</time>}
                </div>
                <h3>
                  {[change.replacement_brand, change.replacement_model]
                    .filter(Boolean)
                    .join(" ")}
                </h3>
                {change.previous_component && (
                  <p>Erstatter: {change.previous_component}</p>
                )}
                {change.notes && <p>{change.notes}</p>}
                {change.documentation_available && (
                  <strong>Bilag findes</strong>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="component-history__empty">
            Sælger har ikke registreret komponentudskiftninger.
          </p>
        )}
      </section>

      {listing.ownership_history.length > 0 && (
        <section className="ownership-chain ownership-chain--public">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Platformshistorik</p>
              <h2>Registrerede ejerperioder</h2>
            </div>
            <p>
              Perioderne er forbundet gennem godkendte overdragelseskoder.
              Ejernes identitet og private cykellogs vises ikke.
            </p>
          </div>
          <ol>
            {listing.ownership_history.map((period) => (
              <li
                className={
                  period.is_current_listing_owner ? "is-current-user" : ""
                }
                key={period.owner_sequence}
              >
                <span>{period.owner_sequence}</span>
                <div>
                  <strong>
                    {period.is_current_listing_owner
                      ? "Nuværende sælgers periode"
                      : "Registreret ejerperiode"}
                  </strong>
                  <p>
                    {formatDate(period.started_on)} –{" "}
                    {period.ended_on ? formatDate(period.ended_on) : "nu"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
