import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  brakeLabel,
  categoryLabel,
  conditionLabel,
  formatDate,
  formatPrice,
  materialLabel,
} from "@/features/listings/format";
import { getListingById } from "@/features/listings/queries";

export const dynamic = "force-dynamic";

type ListingPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tilbage?: string | string[] }>;
};

function safeReturnUrl(value: string | string[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;
  return first?.startsWith("/cykler") ? first : "/cykler";
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
  const listing = await getListingById(id);

  if (!listing) notFound();

  const returnUrl = safeReturnUrl(resolvedSearchParams.tilbage);
  const primaryImage = listing.images[0];

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
  ];

  return (
    <div className="shell detail">
      <Link className="back-link" href={returnUrl}>
        <span aria-hidden="true">←</span> Tilbage til søgeresultater
      </Link>

      <div className="detail__grid">
        <div>
          <div className="detail__image">
            {primaryImage ? (
              <Image
                alt={primaryImage.alt_text}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 62vw"
                src={primaryImage.image_url}
              />
            ) : (
              <div className="listing-card__placeholder" aria-hidden="true">
                CB
              </div>
            )}
          </div>
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
        </div>

        <aside className="detail__summary">
          <p className="eyebrow">
            {categoryLabel(listing.category)} · {listing.city}
          </p>
          <h1>{listing.title}</h1>
          <p className="detail__price">{formatPrice(listing.price_dkk)}</p>
          <div className="detail__quick-specs">
            <span>Str. {listing.frame_size_label}</span>
            <span>{listing.model_year ?? "År ikke angivet"}</span>
            <span>{conditionLabel(listing.condition)}</span>
          </div>
          <div className="seller-card">
            <p className="seller-card__label">Sælger</p>
            <strong>{listing.seller_name}</strong>
            <span>{listing.seller_city ?? listing.city}</span>
          </div>
          <button className="button button--accent button--full" disabled>
            Kontakt åbner snart
          </button>
          <p className="detail__date">
            Publiceret {formatDate(listing.published_at)}
          </p>
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
    </div>
  );
}

