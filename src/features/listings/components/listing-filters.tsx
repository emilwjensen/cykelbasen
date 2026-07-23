"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getActiveListingFilters,
  listingBrowseUrl,
} from "../filter-state";
import {
  bikeCategories,
  brakeTypes,
  conditions,
  frameMaterials,
  type ListingFilterOptions,
  type ListingFilters,
} from "../types";
import {
  ListingFilterField,
  ListingFilterGroup,
} from "./listing-filter-fields";

type ListingFiltersProps = {
  filters: ListingFilters;
  options: ListingFilterOptions;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("da-DK").format(value);
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4 4" />
    </svg>
  );
}

export function ActiveFilterChips({ filters }: { filters: ListingFilters }) {
  const activeFilters = getActiveListingFilters(filters);

  if (!activeFilters.length) return null;

  return (
    <section className="active-filter-panel" aria-label="Aktive filtre">
      <header className="active-filter-panel__heading">
        <div>
          <span>Din søgning</span>
          <strong>
            {activeFilters.length}{" "}
            {activeFilters.length === 1 ? "aktivt filter" : "aktive filtre"}
          </strong>
        </div>
        <Link className="active-filter-panel__clear" href="/cykler">
          Ryd alle
        </Link>
      </header>
      <div className="active-filter-panel__chips">
        {activeFilters.map((filter) => (
          <Link
            aria-label={`Fjern filter: ${filter.label}`}
            href={listingBrowseUrl(filters, { omit: filter.keys })}
            key={filter.keys.join("-")}
          >
            <span>{filter.label}</span>
            <span aria-hidden="true">×</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ListingFilterForm({ filters, options }: ListingFiltersProps) {
  const activeFilterCount = getActiveListingFilters(filters).length;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rangeMinimum = Math.floor(options.minPrice / 500) * 500;
  const rangeMaximum = Math.max(
    Math.ceil(options.maxPrice / 500) * 500,
    rangeMinimum + 1_000,
  );

  return (
    <form action="/cykler" className="filters">
      <header className="filters__heading">
        <div>
          <span>Filtrér markedet</span>
          <p>Alle valg gemmes i adressen, så du kan dele din søgning.</p>
        </div>
        <span className="filters__verified-note">
          <span aria-hidden="true">✓</span> Kun godkendte annoncer
        </span>
        <button
          aria-controls="listing-filter-content"
          aria-expanded={filtersOpen}
          className="filters__toggle"
          onClick={() => setFiltersOpen((open) => !open)}
          type="button"
        >
          <span>
            {filtersOpen ? "Luk filtre" : "Vis og redigér filtre"}
            {activeFilterCount > 0 && !filtersOpen
              ? ` (${activeFilterCount})`
              : ""}
          </span>
          <span aria-hidden="true">{filtersOpen ? "−" : "+"}</span>
        </button>
      </header>

      <div
        className={`filters__content${filtersOpen ? " is-open" : ""}`}
        id="listing-filter-content"
      >
        <ListingFilterField
          htmlFor="listing-query"
          label="Søg efter mærke eller model"
        >
          <span className="filters__search-control">
            <SearchIcon />
            <input
              defaultValue={filters.q}
              id="listing-query"
              name="q"
              placeholder="Fx Specialized Tarmac"
              type="search"
            />
          </span>
        </ListingFilterField>

        <div className="filters__groups">
          <ListingFilterGroup
            description="Start med cykeltype, mærke og den størrelse, du leder efter."
            legend="Cyklen"
            variant="identity"
          >
            <ListingFilterField htmlFor="listing-category" label="Type">
              <select
                defaultValue={filters.category ?? ""}
                id="listing-category"
                name="category"
              >
                <option value="">Alle typer</option>
                {bikeCategories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ListingFilterField>

            <ListingFilterField htmlFor="listing-brand" label="Mærke">
              <select
                defaultValue={filters.brand ?? ""}
                id="listing-brand"
                name="brand"
              >
                <option value="">Alle mærker</option>
                {options.brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </ListingFilterField>

            <ListingFilterField
              htmlFor="listing-size"
              label="Stelstørrelse"
            >
              <select
                defaultValue={filters.size ?? ""}
                id="listing-size"
                name="size"
              >
                <option value="">Alle størrelser</option>
                {options.sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </ListingFilterField>
          </ListingFilterGroup>

          <ListingFilterGroup
            description={`Markedet ligger aktuelt mellem ${formatPrice(rangeMinimum)} og ${formatPrice(rangeMaximum)} kr.`}
            legend="Pris"
            variant="price"
          >
            <ListingFilterField htmlFor="listing-min-price" label="Fra">
              <input
                defaultValue={filters.minPrice}
                id="listing-min-price"
                inputMode="numeric"
                max={1_000_000}
                min={0}
                name="minPrice"
                placeholder={`${formatPrice(rangeMinimum)} kr.`}
                step={500}
                type="number"
              />
            </ListingFilterField>

            <ListingFilterField htmlFor="listing-max-price" label="Til">
              <input
                defaultValue={filters.maxPrice}
                id="listing-max-price"
                inputMode="numeric"
                max={1_000_000}
                min={0}
                name="maxPrice"
                placeholder={`${formatPrice(rangeMaximum)} kr.`}
                step={500}
                type="number"
              />
            </ListingFilterField>
          </ListingFilterGroup>

          <ListingFilterGroup
            description="Finjustér kun de specifikationer, som er afgørende for dit valg."
            legend="Specifikationer"
            variant="details"
          >
            <ListingFilterField
              htmlFor="listing-material"
              label="Stelmateriale"
            >
              <select
                defaultValue={filters.material ?? ""}
                id="listing-material"
                name="material"
              >
                <option value="">Alle materialer</option>
                {frameMaterials.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ListingFilterField>

            <ListingFilterField htmlFor="listing-brakes" label="Bremser">
              <select
                defaultValue={filters.brakes ?? ""}
                id="listing-brakes"
                name="brakes"
              >
                <option value="">Alle bremsetyper</option>
                {brakeTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ListingFilterField>

            <ListingFilterField htmlFor="listing-condition" label="Stand">
              <select
                defaultValue={filters.condition ?? ""}
                id="listing-condition"
                name="condition"
              >
                <option value="">Alle stande</option>
                {conditions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ListingFilterField>

            <ListingFilterField htmlFor="listing-city" label="By">
              <input
                defaultValue={filters.city}
                id="listing-city"
                name="city"
                placeholder="Fx Aarhus"
              />
            </ListingFilterField>
          </ListingFilterGroup>
        </div>

        {filters.sort !== "newest" && (
          <input name="sort" type="hidden" value={filters.sort} />
        )}
        <footer className="filters__actions">
          <Link className="button button--quiet" href="/cykler">
            Nulstil filtre
          </Link>
          <button className="button button--dark" type="submit">
            Vis cykler <span aria-hidden="true">→</span>
          </button>
        </footer>
      </div>
    </form>
  );
}
