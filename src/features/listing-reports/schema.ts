import { z } from "zod";
import { listingReportReasons } from "./types";

export const listingReportSchema = z.object({
  reason: z.enum(listingReportReasons.map(({ value }) => value)),
  details: z
    .string()
    .trim()
    .min(5)
    .max(1_000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
