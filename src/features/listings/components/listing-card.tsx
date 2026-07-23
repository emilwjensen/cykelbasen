import Image from "next/image";
import Link from "next/link";
import {
  categoryLabel,
  conditionLabel,
  formatPrice,
} from "../format";
import type { ListingSummary } from "../types";

type ListingCardProps = {
  listing: ListingSummary;
  returnUrl?: string;
};

export function ListingCard({ listing, returnUrl = "/cykler" }: ListingCardProps) {
  const href = `/cykler/${listing.id}?tilbage=${encodeURIComponent(returnUrl)}`;

  return (
    <article className="listing-card">
      <Link
        aria-label={`Se ${listing.title}`}
        className="listing-card__image-link"
        href={href}
      >
        {listing.cover_url ? (
          <Image
            alt={listing.cover_alt ?? listing.title}
            className="listing-card__image"
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            src={listing.cover_url}
          />
        ) : (
          <div className="listing-card__placeholder" aria-hidden="true">
            CB
          </div>
        )}
        <span className="listing-card__verified">
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d="m5.5 10 3 3 6-6" />
          </svg>
          Ejerskab godkendt
        </span>
      </Link>

      <div className="listing-card__body">
        <div className="listing-card__eyebrow">
          <span>{categoryLabel(listing.category)}</span>
          <span>{listing.city}</span>
        </div>
        <Link className="listing-card__title" href={href}>
          {listing.title}
        </Link>
        <p className="listing-card__specs">
          {listing.model_year ?? "År ikke angivet"} · Str.{" "}
          {listing.frame_size_label} · {conditionLabel(listing.condition)}
        </p>
        <div className="listing-card__footer">
          <p className="listing-card__price">{formatPrice(listing.price_dkk)}</p>
          <span aria-hidden="true">↗</span>
        </div>
      </div>
    </article>
  );
}
