import {
  bikeCategories,
  brakeTypes,
  conditions,
  frameMaterials,
  type ListingFilters,
} from "./types";

export type ActiveListingFilter = {
  keys: Array<keyof ListingFilters>;
  label: string;
};

function optionLabel<T extends readonly { value: string; label: string }[]>(
  options: T,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("da-DK").format(value);
}

export function getActiveListingFilters(
  filters: ListingFilters,
): ActiveListingFilter[] {
  const active: ActiveListingFilter[] = [];

  if (filters.q) {
    active.push({ keys: ["q"], label: `Søgning: ${filters.q}` });
  }
  if (filters.category) {
    active.push({
      keys: ["category"],
      label: optionLabel(bikeCategories, filters.category),
    });
  }
  if (filters.brand) {
    active.push({ keys: ["brand"], label: filters.brand });
  }
  if (filters.size) {
    active.push({ keys: ["size"], label: `Str. ${filters.size}` });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const minimum =
      filters.minPrice !== undefined
        ? `${formatPrice(filters.minPrice)} kr.`
        : "laveste pris";
    const maximum =
      filters.maxPrice !== undefined
        ? `${formatPrice(filters.maxPrice)} kr.`
        : "højeste pris";

    active.push({
      keys: ["minPrice", "maxPrice"],
      label: `Pris: ${minimum}–${maximum}`,
    });
  }
  if (filters.material) {
    active.push({
      keys: ["material"],
      label: optionLabel(frameMaterials, filters.material),
    });
  }
  if (filters.brakes) {
    active.push({
      keys: ["brakes"],
      label: optionLabel(brakeTypes, filters.brakes),
    });
  }
  if (filters.condition) {
    active.push({
      keys: ["condition"],
      label: optionLabel(conditions, filters.condition),
    });
  }
  if (filters.city) {
    active.push({ keys: ["city"], label: `By: ${filters.city}` });
  }

  return active;
}

export function listingFilterEntries(
  filters: ListingFilters,
  omittedKeys: Array<keyof ListingFilters> = [],
) {
  const omitted = new Set(omittedKeys);
  const entries: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(filters)) {
    if (
      omitted.has(key as keyof ListingFilters) ||
      value === undefined ||
      value === "" ||
      (key === "sort" && value === "newest") ||
      (key === "page" && value === 1)
    ) {
      continue;
    }
    entries.push([key, String(value)]);
  }

  return entries;
}

export function listingBrowseUrl(
  filters: ListingFilters,
  options: {
    omit?: Array<keyof ListingFilters>;
    page?: number;
  } = {},
) {
  const params = new URLSearchParams(
    listingFilterEntries(filters, [
      "page",
      ...(options.omit ?? []),
    ]),
  );

  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }

  const query = params.toString();
  return query ? `/cykler?${query}` : "/cykler";
}
