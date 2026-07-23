import { z } from "zod";
import {
  bikeCategories,
  brakeTypes,
  conditions,
  frameMaterials,
  sortOptions,
  type ListingFilters,
} from "./types";

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const optionalText = z
  .string()
  .trim()
  .max(80)
  .optional()
  .transform((value) => value || undefined);

const optionalPrice = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(0).max(1_000_000))
  .optional()
  .catch(undefined);

const pageNumber = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(1_000))
  .default(1)
  .catch(1);

const listingFilterSchema = z.object({
  q: optionalText,
  category: z
    .enum(bikeCategories.map(({ value }) => value))
    .optional()
    .catch(undefined),
  brand: optionalText,
  size: optionalText,
  minPrice: optionalPrice,
  maxPrice: optionalPrice,
  material: z
    .enum(frameMaterials.map(({ value }) => value))
    .optional()
    .catch(undefined),
  brakes: z
    .enum(brakeTypes.map(({ value }) => value))
    .optional()
    .catch(undefined),
  condition: z
    .enum(conditions.map(({ value }) => value))
    .optional()
    .catch(undefined),
  city: optionalText,
  sort: z
    .enum(sortOptions.map(({ value }) => value))
    .default("newest")
    .catch("newest"),
  page: pageNumber,
});

export function parseListingFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ListingFilters {
  return listingFilterSchema.parse({
    q: firstValue(searchParams.q),
    category: firstValue(searchParams.category),
    brand: firstValue(searchParams.brand),
    size: firstValue(searchParams.size),
    minPrice: firstValue(searchParams.minPrice),
    maxPrice: firstValue(searchParams.maxPrice),
    material: firstValue(searchParams.material),
    brakes: firstValue(searchParams.brakes),
    condition: firstValue(searchParams.condition),
    city: firstValue(searchParams.city),
    sort: firstValue(searchParams.sort),
    page: firstValue(searchParams.page),
  });
}
