import { z } from "zod";
import {
  bikeCategories,
  brakeTypes,
  conditions,
  frameMaterials,
} from "./types";

const optionalString = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() ? value.trim() : undefined,
    z.string().max(max).optional(),
  );

const optionalNumber = (minimum: number, maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() ? Number(value) : undefined,
    z.number().min(minimum).max(maximum).optional(),
  );

export const draftListingSchema = z.object({
  title: z.string().trim().min(8).max(100),
  category: z.enum(bikeCategories.map(({ value }) => value)),
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  modelYear: optionalNumber(1950, 2100),
  frameSizeLabel: z.string().trim().min(1).max(20),
  frameSizeCm: optionalNumber(35, 75),
  material: z
    .enum(frameMaterials.map(({ value }) => value))
    .optional()
    .or(z.literal("").transform(() => undefined)),
  groupsetBrand: optionalString(60),
  groupsetModel: optionalString(80),
  drivetrain: optionalString(20),
  brakes: z
    .enum(brakeTypes.map(({ value }) => value))
    .optional()
    .or(z.literal("").transform(() => undefined)),
  wheelSize: optionalString(30),
  electronicShifting: z.boolean(),
  shippingOffered: z.boolean(),
  priceDkk: z.preprocess(
    (value) => Number(value),
    z.number().int().min(1).max(1_000_000),
  ),
  condition: z.enum(conditions.map(({ value }) => value)),
  city: z.string().trim().min(2).max(80),
  description: z.string().trim().min(20).max(5000),
});

export type DraftListingInput = z.infer<typeof draftListingSchema>;

export function parseDraftListingForm(formData: FormData) {
  return draftListingSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    modelYear: formData.get("modelYear"),
    frameSizeLabel: formData.get("frameSizeLabel"),
    frameSizeCm: formData.get("frameSizeCm"),
    material: formData.get("material"),
    groupsetBrand: formData.get("groupsetBrand"),
    groupsetModel: formData.get("groupsetModel"),
    drivetrain: formData.get("drivetrain"),
    brakes: formData.get("brakes"),
    wheelSize: formData.get("wheelSize"),
    electronicShifting: formData.get("electronicShifting") === "on",
    shippingOffered: formData.get("shippingOffered") === "on",
    priceDkk: formData.get("priceDkk"),
    condition: formData.get("condition"),
    city: formData.get("city"),
    description: formData.get("description"),
  });
}

