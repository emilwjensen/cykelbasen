import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ListingCard } from "@/features/listings/components/listing-card";
import {
  ActiveFilterChips,
  ListingFilterForm,
} from "@/features/listings/components/listing-filters";
import { ListingPagination } from "@/features/listings/components/listing-pagination";
import { ListingResultsToolbar } from "@/features/listings/components/listing-results-toolbar";
import { getActiveListingFilters } from "@/features/listings/filter-state";
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
  alternates: { canonical: "/cykler" },
};

type BrowsePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const rawSearchParams = await searchParams;
  const filters = parseListingFilters(rawSearchParams);
  const [result, filterOptions] = await Promise.all([
    getListings(filters),
    getListingFilterOptions(),
  ]);
  if (result.total > 0 && filters.page > result.totalPages) {
    const canonicalParams = new URLSearchParams();
    for (const [key, value] of Object.entries(rawSearchParams)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (first && key !== "page") canonicalParams.set(key, first);
    }
    if (result.totalPages > 1) {
      canonicalParams.set("page", String(result.totalPages));
    }
    const canonicalQuery = canonicalParams.toString();
    redirect(canonicalQuery ? `/cykler?${canonicalQuery}` : "/cykler");
  }

  const listings = result.items;
  const resultCount = result.total;
  const hasActiveFilters = getActiveListingFilters(filters).length > 0;
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
      <header className="browse-header">
        <div>
          <p className="eyebrow">Markedsplads</p>
          <h1>Find en cykel, der faktisk passer.</h1>
          <p>
            Sammenlign strukturerede specifikationer og filtrér dig frem uden
            at lede gennem fritekst.
          </p>
        </div>
        <ul aria-label="Fordele ved Cykelbasens marked">
          <li>
            <span aria-hidden="true">01</span>
            <strong>Tydelige størrelser</strong>
          </li>
          <li>
            <span aria-hidden="true">02</span>
            <strong>Søgbare specifikationer</strong>
          </li>
          <li>
            <span aria-hidden="true">03</span>
            <strong>Godkendt ejerskab</strong>
          </li>
        </ul>
      </header>

      <ListingFilterForm filters={filters} options={filterOptions} />
      <ActiveFilterChips filters={filters} />

      <ListingResultsToolbar
        filters={filters}
        pageSize={result.pageSize}
        resultCount={resultCount}
      />

      {listings.length ? (
        <>
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                returnUrl={returnUrl}
              />
            ))}
          </div>
          <ListingPagination
            filters={filters}
            totalPages={result.totalPages}
          />
        </>
      ) : (
        <EmptyState
          action={
            <Link
              className="button button--dark"
              href={hasActiveFilters ? "/cykler" : "/annoncer/ny"}
            >
              {hasActiveFilters ? "Nulstil filtre" : "Sælg en cykel"}
            </Link>
          }
          eyebrow={hasActiveFilters ? "Ingen match" : "Ingen annoncer endnu"}
          icon={hasActiveFilters ? "↺" : "+"}
          title={
            hasActiveFilters
              ? "Prøv at løsne et filter."
              : "Bliv den første cykel på markedet."
          }
        >
          <p>
            {hasActiveFilters
              ? "Der er ingen publicerede cykler, som matcher alle dine valg endnu."
              : "Nye annoncer bliver synlige, når ejerskabet er gennemgået og godkendt."}
          </p>
        </EmptyState>
      )}
    </div>
  );
}
