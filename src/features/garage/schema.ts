import { z } from "zod";
import {
  acquisitionSources,
  bikeDocumentTypes,
} from "@/features/bikes/catalog";
import {
  brakeTypes,
  bikeCategories,
  componentCategories,
  frameMaterials,
} from "@/features/listings/types";
import { bikeLogTypes } from "./types";

const optionalInteger = (minimum: number, maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() ? Number(value) : undefined,
    z.number().int().min(minimum).max(maximum).optional(),
  );

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() ? value.trim() : undefined,
    z.string().max(maximum).optional(),
  );

const pastDate = z
  .string()
  .date()
  .refine((value) => value <= new Date().toISOString().slice(0, 10));

const optionalDate = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined,
  z.string().date().optional(),
);

export const garageBikeSchema = z.object({
  nickname: z.string().trim().min(2).max(80),
  category: z.enum(bikeCategories.map(({ value }) => value)),
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  modelYear: optionalInteger(1950, 2100),
  frameSizeLabel: optionalText(20),
  frameSizeCm: optionalInteger(35, 70),
  color: optionalText(40),
  material: z
    .enum(frameMaterials.map(({ value }) => value))
    .optional()
    .or(z.literal("").transform(() => undefined)),
  groupsetBrand: optionalText(60),
  groupsetModel: optionalText(80),
  drivetrain: optionalText(20),
  brakes: z
    .enum(brakeTypes.map(({ value }) => value))
    .optional()
    .or(z.literal("").transform(() => undefined)),
  wheelSize: optionalText(30),
  electronicShifting: z.boolean(),
  serialNumber: optionalText(120),
  acquiredOn: pastDate,
  acquisitionSource: z
    .enum(acquisitionSources.map(({ value }) => value))
    .optional()
    .or(z.literal("").transform(() => undefined)),
  purchasePriceDkk: optionalInteger(0, 1_000_000),
  purchaseLocation: optionalText(120),
  acquiredUsed: z.boolean(),
  ownerCountAtAcquisition: z.preprocess(
    (value) => Number(value),
    z.number().int().min(1).max(20),
  ),
  currentOdometerKm: z.preprocess(
    (value) => Number(value),
    z.number().int().min(0).max(1_000_000),
  ),
  notes: optionalText(5_000),
});

export const garageBikeEditSchema = garageBikeSchema.pick({
  nickname: true,
  category: true,
  brand: true,
  model: true,
  modelYear: true,
  frameSizeLabel: true,
  frameSizeCm: true,
  color: true,
  material: true,
  groupsetBrand: true,
  groupsetModel: true,
  drivetrain: true,
  brakes: true,
  wheelSize: true,
  electronicShifting: true,
  acquisitionSource: true,
  purchasePriceDkk: true,
  purchaseLocation: true,
  notes: true,
});

export const bikeDocumentSchema = z.object({
  bikeId: z.string().uuid(),
  documentType: z.enum(bikeDocumentTypes.map(({ value }) => value)),
  title: z.string().trim().min(2).max(120),
  documentDate: optionalDate,
});

export const bikeLogSchema = z.object({
  logType: z.enum(bikeLogTypes.map(({ value }) => value)),
  title: z.string().trim().min(3).max(120),
  details: optionalText(5_000),
  occurredOn: pastDate,
  distanceKm: optionalInteger(0, 100_000),
  odometerKm: optionalInteger(0, 1_000_000),
  costDkk: optionalInteger(0, 1_000_000),
  componentCategory: z
    .enum(componentCategories.map(({ value }) => value))
    .optional()
    .or(z.literal("").transform(() => undefined)),
  componentBrand: optionalText(60),
  componentModel: optionalText(100),
  documentationAvailable: z.boolean(),
});

export const bikeLogCorrectionSchema = bikeLogSchema.extend({
  correctionReason: z.string().trim().min(3).max(500),
});

export const bikeMaintenanceReminderSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    componentCategory: z
      .enum(componentCategories.map(({ value }) => value))
      .optional()
      .or(z.literal("").transform(() => undefined)),
    dueOn: optionalDate,
    dueOdometerKm: optionalInteger(0, 1_000_000),
    notes: optionalText(2_000),
  })
  .refine(
    (value) =>
      value.dueOn !== undefined || value.dueOdometerKm !== undefined,
    {
      message: "Vælg en dato eller kilometerstand.",
      path: ["dueOn"],
    },
  );

export const bikeMaintenanceReminderEditSchema =
  bikeMaintenanceReminderSchema.and(
    z.object({
      changeReason: z.string().trim().min(3).max(500),
    }),
  );

export const retireBikeSchema = z.object({
  retiredOn: pastDate,
  reason: z.enum(["worn-out", "crashed", "stolen", "lost", "other"]),
  note: optionalText(1_000),
});

export const acceptBikeTransferSchema = z.object({
  token: z.string().trim().min(24).max(200),
  acquiredOn: pastDate,
  currentOdometerKm: z.preprocess(
    (value) => Number(value),
    z.number().int().min(0).max(1_000_000),
  ),
});
