import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { z } from "zod";
import {
  ComparisonSelectionSync,
  RemoveComparisonButton,
} from "@/features/listings/components/compare-controls";
import {
  brakeLabel,
  categoryLabel,
  conditionLabel,
  formatDate,
  formatPrice,
  materialLabel,
} from "@/features/listings/format";
import { getListingsForComparison } from "@/features/listings/queries";
import type { ListingComparison } from "@/features/listings/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sammenlign cykler",
  description:
    "Sammenlign pris, størrelse, udstyr og dokumentation på op til tre brugte racercykler.",
};

type ComparisonPageProps = {
  searchParams: Promise<{ ids?: string | string[] }>;
};

const uuidSchema = z.string().uuid();

function parseComparisonIds(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];

  return [
    ...new Set(
      raw
        .split(",")
        .map((id) => id.trim())
        .filter((id) => uuidSchema.safeParse(id).success),
    ),
  ].slice(0, 3);
}

function textOrFallback(value: string | null, fallback = "Ikke angivet") {
  return value?.trim() || fallback;
}

function ComparisonRow({
  label,
  listings,
  render,
}: {
  label: string;
  listings: ListingComparison[];
  render: (listing: ListingComparison) => ReactNode;
}) {
  return (
    <div className="comparison-row">
      <strong>{label}</strong>
      {listings.map((listing) => (
        <div key={listing.id}>{render(listing)}</div>
      ))}
    </div>
  );
}

export default async function ComparisonPage({
  searchParams,
}: ComparisonPageProps) {
  const query = await searchParams;
  const ids = parseComparisonIds(query.ids);
  const listings = await getListingsForComparison(ids);
  const availableIds = listings.map((listing) => listing.id);
  const comparisonUrl = listings.length
    ? `/sammenlign?ids=${availableIds.join(",")}`
    : "/sammenlign";
  const comparisonStyle = {
    "--comparison-columns": Math.max(listings.length, 1),
  } as CSSProperties;

  return (
    <div className="comparison-page shell">
      <ComparisonSelectionSync
        listings={listings.map(({ id, title }) => ({ id, title }))}
      />

      <header className="page-heading comparison-heading">
        <div>
          <p className="eyebrow">Beslutningshjælp</p>
          <h1>Sammenlign cykler uden gætteriet.</h1>
          <p>
            Se forskellene i størrelse, udstyr, historik og dokumentation side
            om side.
          </p>
        </div>
        <Link className="button button--quiet" href="/cykler">
          Find flere cykler
        </Link>
      </header>

      {listings.length < 2 && (
        <div className="comparison-notice">
          <strong>Vælg mindst to cykler for en nyttig sammenligning.</strong>
          <p>
            Brug knappen “Sammenlign” på markedet. Du kan vælge op til tre.
          </p>
        </div>
      )}

      {listings.length ? (
        <div className="comparison-scroll">
          <div className="comparison-table" style={comparisonStyle}>
            <div className="comparison-row comparison-row--products">
              <strong>Cykel</strong>
              {listings.map((listing) => (
                <article key={listing.id}>
                  <div className="comparison-product__image">
                    {listing.cover_url ? (
                      <Image
                        alt={listing.cover_alt ?? listing.title}
                        fill
                        sizes="(max-width: 800px) 70vw, 28vw"
                        src={listing.cover_url}
                      />
                    ) : (
                      <span aria-hidden="true">CB</span>
                    )}
                  </div>
                  <p className="eyebrow">{listing.city}</p>
                  <h2>{listing.title}</h2>
                  <p>{formatPrice(listing.price_dkk)}</p>
                  <div className="comparison-product__actions">
                    <Link
                      href={`/cykler/${listing.id}?tilbage=${encodeURIComponent(comparisonUrl)}`}
                    >
                      Se annonce
                    </Link>
                    <RemoveComparisonButton
                      id={listing.id}
                      ids={availableIds}
                    />
                  </div>
                </article>
              ))}
            </div>

            <ComparisonRow
              label="Tilgængelighed"
              listings={listings}
              render={(listing) =>
                listing.status === "reserved" ? "Reserveret" : "Til salg"
              }
            />
            <ComparisonRow
              label="Type"
              listings={listings}
              render={(listing) => categoryLabel(listing.category)}
            />
            <ComparisonRow
              label="Stand"
              listings={listings}
              render={(listing) => conditionLabel(listing.condition)}
            />
            <ComparisonRow
              label="Mærke og model"
              listings={listings}
              render={(listing) => `${listing.brand} ${listing.model}`}
            />
            <ComparisonRow
              label="Modelår"
              listings={listings}
              render={(listing) => listing.model_year ?? "Ikke angivet"}
            />
            <ComparisonRow
              label="Størrelse"
              listings={listings}
              render={(listing) =>
                `${listing.frame_size_label}${
                  listing.frame_size_cm ? ` · ${listing.frame_size_cm} cm` : ""
                }`
              }
            />
            <ComparisonRow
              label="Stelmateriale"
              listings={listings}
              render={(listing) => materialLabel(listing.material)}
            />
            <ComparisonRow
              label="Geargruppe"
              listings={listings}
              render={(listing) =>
                textOrFallback(
                  [listing.groupset_brand, listing.groupset_model]
                    .filter(Boolean)
                    .join(" "),
                )
              }
            />
            <ComparisonRow
              label="Drivlinje"
              listings={listings}
              render={(listing) => textOrFallback(listing.drivetrain)}
            />
            <ComparisonRow
              label="Bremser"
              listings={listings}
              render={(listing) => brakeLabel(listing.brakes)}
            />
            <ComparisonRow
              label="Hjul"
              listings={listings}
              render={(listing) => textOrFallback(listing.wheel_size)}
            />
            <ComparisonRow
              label="Elektronisk gear"
              listings={listings}
              render={(listing) => (listing.electronic_shifting ? "Ja" : "Nej")}
            />
            <ComparisonRow
              label="Købt af sælger"
              listings={listings}
              render={(listing) => formatDate(listing.purchase_date)}
            />
            <ComparisonRow
              label="Kendt ejerhistorik"
              listings={listings}
              render={(listing) =>
                listing.owner_count === 1
                  ? "1 ejer"
                  : `${listing.owner_count} ejere`
              }
            />
            <ComparisonRow
              label="Købsdokumentation"
              listings={listings}
              render={(listing) =>
                listing.purchase_proof_available ? "✓ Findes" : "– Ikke oplyst"
              }
            />
            <ComparisonRow
              label="Servicehistorik"
              listings={listings}
              render={(listing) =>
                listing.service_history_available ? "✓ Findes" : "– Ikke oplyst"
              }
            />
            <ComparisonRow
              label="Forsendelse"
              listings={listings}
              render={(listing) =>
                listing.shipping_offered ? "Tilbydes" : "Kun afhentning"
              }
            />
          </div>
        </div>
      ) : (
        <EmptyState
          action={
            <Link className="button button--dark" href="/cykler">
              Se alle cykler
            </Link>
          }
          eyebrow="Ingen cykler valgt"
          icon="⇄"
          title="Find dine kandidater på markedet."
        >
          <p>
            Dine valg gemmes kun i denne browser og kræver ikke en konto.
          </p>
        </EmptyState>
      )}
    </div>
  );
}
