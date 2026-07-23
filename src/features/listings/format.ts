import {
  bikeCategories,
  brakeTypes,
  conditions,
  frameMaterials,
} from "./types";

const currencyFormatter = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
  maximumFractionDigits: 0,
});

export function formatPrice(price: number) {
  return currencyFormatter.format(price);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function findLabel(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | null,
) {
  return options.find((option) => option.value === value)?.label ?? "Ikke angivet";
}

export const categoryLabel = (value: string) =>
  findLabel(bikeCategories, value);
export const conditionLabel = (value: string) => findLabel(conditions, value);
export const materialLabel = (value: string | null) =>
  findLabel(frameMaterials, value);
export const brakeLabel = (value: string | null) =>
  findLabel(brakeTypes, value);

