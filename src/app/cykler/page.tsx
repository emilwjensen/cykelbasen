import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/features/listings/components/listing-card";
import {
  ActiveFilterChips,
  ListingFilterForm,
} from "@/features/listings/components/listing-filters";
import {
  getListingFilterOptions,
  getListings,
} from "@/features/listings/queries";
import { parseListingFilters } from "@/features/listings/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Brugte racercykler",
  description:
    "Søg og filtrér brugte racercykler efter pris, størrelse, materiale, stand og placering.",
};

type BrowsePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const rawSearchParams = await searchParams;
  const filters = parseListingFilters(rawSearchParams);
  const [listings, filterOptions] = await Promise.all([
    getListings(filters),
    getListingFilterOptions(),
  ]);
  const resultCount = listings[0]?.total_count ?? 0;
  const queryString = new URLSearchParams(
    Object.entries(rawSearchParams).flatMap(([key, value]) => {
      if (!value) return [];
      return Array.isArray(value)
        ? value.map((item) => [key, item] as [string, string])
        : [[key, value] as [string, string]];
    }),
  ).toString();
  const returnUrl = queryString ? `/cykler?${queryString}` : "/cykler";

  return (
    <div className="shell browse">
      <header className="page-heading">
        <p className="eyebrow">Markedsplads</p>
        <h1>Find en cykel, der faktisk passer.</h1>
        <p>
          Filtrér på de specifikationer, der betyder noget på landevejen.
        </p>
      </header>

      <ListingFilterForm filters={filters} options={filterOptions} />
      <ActiveFilterChips filters={filters} />

      <div className="results-heading">
        <p>
          <strong>{resultCount}</strong>{" "}
          {resultCount === 1 ? "cykel fundet" : "cykler fundet"}
        </p>
        <span>Kun publicerede annoncer med godkendt dokumentation</span>
      </div>

      {listings.length ? (
        <div className="listing-grid">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              returnUrl={returnUrl}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">Ingen match</p>
          <h2>Prøv at løsne et filter.</h2>
          <p>
            Der er ingen publicerede cykler, som matcher alle dine valg endnu.
          </p>
          <Link className="button button--dark" href="/cykler">
            Nulstil filtre
          </Link>
        </div>
      )}
    </div>
  );
}
