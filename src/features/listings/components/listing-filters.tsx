"use client";

import Link from "next/link";
import { useState } from "react";
import {
  bikeCategories,
  brakeTypes,
  conditions,
  frameMaterials,
  sortOptions,
  type ListingFilterOptions,
  type ListingFilters,
} from "../types";

type ListingFiltersProps = {
  filters: ListingFilters;
  options: ListingFilterOptions;
};

function formatSliderPrice(value: number) {
  return new Intl.NumberFormat("da-DK").format(value);
}

const labelFor = <T extends readonly { value: string; label: string }[]>(
  options: T,
  value: string,
) => options.find((option) => option.value === value)?.label ?? value;

function filterSearchParams(
  filters: ListingFilters,
  omittedKeys: Array<keyof ListingFilters> = [],
) {
  const params = new URLSearchParams();
  const omitted = new Set(omittedKeys);

  for (const [key, value] of Object.entries(filters)) {
    if (
      omitted.has(key as keyof ListingFilters) ||
      value === undefined ||
      value === "" ||
      (key === "sort" && value === "newest")
    ) {
      continue;
    }
    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `/cykler?${query}` : "/cykler";
}

export function ActiveFilterChips({ filters }: { filters: ListingFilters }) {
  const chips: Array<{
    keys: Array<keyof ListingFilters>;
    label: string;
  }> = [];

  if (filters.q) chips.push({ keys: ["q"], label: `Søgning: ${filters.q}` });
  if (filters.category) {
    chips.push({
      keys: ["category"],
      label: labelFor(bikeCategories, filters.category),
    });
  }
  if (filters.brand) chips.push({ keys: ["brand"], label: filters.brand });
  if (filters.size) {
    chips.push({ keys: ["size"], label: `Str. ${filters.size}` });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const minimum = filters.minPrice !== undefined
      ? `${formatSliderPrice(filters.minPrice)} kr.`
      : "laveste pris";
    const maximum = filters.maxPrice !== undefined
      ? `${formatSliderPrice(filters.maxPrice)} kr.`
      : "højeste pris";
    chips.push({
      keys: ["minPrice", "maxPrice"],
      label: `Pris: ${minimum}–${maximum}`,
    });
  }
  if (filters.material) {
    chips.push({
      keys: ["material"],
      label: labelFor(frameMaterials, filters.material),
    });
  }
  if (filters.brakes) {
    chips.push({
      keys: ["brakes"],
      label: labelFor(brakeTypes, filters.brakes),
    });
  }
  if (filters.condition) {
    chips.push({
      keys: ["condition"],
      label: labelFor(conditions, filters.condition),
    });
  }
  if (filters.city) {
    chips.push({ keys: ["city"], label: `By: ${filters.city}` });
  }

  if (!chips.length) return null;

  return (
    <div className="active-filters" aria-label="Aktive filtre">
      <span>Aktive filtre</span>
      {chips.map((chip) => (
        <Link
          aria-label={`Fjern filter: ${chip.label}`}
          href={filterSearchParams(filters, chip.keys)}
          key={chip.keys.join("-")}
        >
          {chip.label} <span aria-hidden="true">×</span>
        </Link>
      ))}
      <Link className="active-filters__clear" href="/cykler">
        Ryd alle
      </Link>
    </div>
  );
}

export function ListingFilterForm({ filters, options }: ListingFiltersProps) {
  const rangeMinimum = Math.floor(options.minPrice / 500) * 500;
  const rangeMaximum = Math.max(
    Math.ceil(options.maxPrice / 500) * 500,
    rangeMinimum + 1_000,
  );
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      key !== "sort" && value !== undefined && value !== "",
  );
  const [filtersOpen, setFiltersOpen] = useState(hasActiveFilters);

  return (
    <form action="/cykler" className="filters">
      <div className="filters__heading">
        <div>
          <span>Tilpas din søgning</span>
          <p>Vælg kun det, der er vigtigt for dig.</p>
        </div>
        <span className="filters__verified-note">
          <span aria-hidden="true">✓</span> Kun godkendte annoncer
        </span>
        <button
          aria-expanded={filtersOpen}
          className="filters__toggle"
          onClick={() => setFiltersOpen((open) => !open)}
          type="button"
        >
          {filtersOpen ? "Skjul filtre" : "Vis filtre"}
          <span aria-hidden="true">{filtersOpen ? "−" : "+"}</span>
        </button>
      </div>
      <div className={`filters__content${filtersOpen ? " is-open" : ""}`}>
        <div className="filters__search">
          <label htmlFor="q">Søg efter mærke eller model</label>
          <input
            defaultValue={filters.q}
            id="q"
            name="q"
            placeholder="Fx Specialized Tarmac"
            type="search"
          />
        </div>

        <div className="filters__grid">
          <label>
            Type
            <select defaultValue={filters.category ?? ""} name="category">
              <option value="">Alle typer</option>
              {bikeCategories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Mærke
            <select defaultValue={filters.brand ?? ""} name="brand">
              <option value="">Alle mærker</option>
              {options.brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>

          <label>
            Stelstørrelse
            <select defaultValue={filters.size ?? ""} name="size">
              <option value="">Alle størrelser</option>
              {options.sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <label>
            Pris fra
            <input
              defaultValue={filters.minPrice}
              inputMode="numeric"
              max={rangeMaximum}
              min={rangeMinimum}
              name="minPrice"
              placeholder={`${formatSliderPrice(rangeMinimum)} kr.`}
              step={500}
              type="number"
            />
          </label>

          <label>
            Pris til
            <input
              defaultValue={filters.maxPrice}
              inputMode="numeric"
              max={rangeMaximum}
              min={rangeMinimum}
              name="maxPrice"
              placeholder={`${formatSliderPrice(rangeMaximum)} kr.`}
              step={500}
              type="number"
            />
          </label>

          <label>
            Stelmateriale
            <select defaultValue={filters.material ?? ""} name="material">
              <option value="">Alle materialer</option>
              {frameMaterials.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Bremser
            <select defaultValue={filters.brakes ?? ""} name="brakes">
              <option value="">Alle bremsetyper</option>
              {brakeTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Stand
            <select defaultValue={filters.condition ?? ""} name="condition">
              <option value="">Alle stande</option>
              {conditions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            By
            <input
              defaultValue={filters.city}
              name="city"
              placeholder="Fx Aarhus"
            />
          </label>
        </div>

        <div className="filters__actions">
          <label className="filters__sort">
            Sortér
            <select defaultValue={filters.sort} name="sort">
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="button button--dark" type="submit">
            Vis cykler
          </button>
          <Link className="button button--quiet" href="/cykler">
            Nulstil
          </Link>
        </div>
      </div>
    </form>
  );
}
