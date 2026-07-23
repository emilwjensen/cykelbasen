"use client";

import {
  getActiveListingFilters,
  listingFilterEntries,
} from "../filter-state";
import { sortOptions, type ListingFilters } from "../types";

type ListingResultsToolbarProps = {
  filters: ListingFilters;
  pageSize: number;
  resultCount: number;
};

export function ListingResultsToolbar({
  filters,
  pageSize,
  resultCount,
}: ListingResultsToolbarProps) {
  const firstResult =
    resultCount === 0 ? 0 : (filters.page - 1) * pageSize + 1;
  const lastResult = Math.min(filters.page * pageSize, resultCount);
  const preservedFilters = listingFilterEntries(filters, ["page", "sort"]);
  const activeFilterCount = getActiveListingFilters(filters).length;

  return (
    <section className="results-toolbar" aria-label="Resultater og sortering">
      <div className="results-toolbar__count" aria-live="polite">
        <strong>
          {resultCount} {resultCount === 1 ? "cykel" : "cykler"}
        </strong>
        <span>
          {resultCount > pageSize
            ? `Viser ${firstResult}–${lastResult}`
            : activeFilterCount > 0
              ? "Matcher dine valgte kriterier"
              : "Publicerede annoncer med godkendt ejerskab"}
        </span>
      </div>

      {resultCount > 0 && (
        <form action="/cykler" className="results-toolbar__sort">
          {preservedFilters.map(([name, value]) => (
            <input key={name} name={name} type="hidden" value={value} />
          ))}
          <label htmlFor="listing-sort">Sortér efter</label>
          <select
            defaultValue={filters.sort}
            id="listing-sort"
            name="sort"
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <noscript>
            <button className="button button--quiet" type="submit">
              Sortér
            </button>
          </noscript>
        </form>
      )}
    </section>
  );
}
