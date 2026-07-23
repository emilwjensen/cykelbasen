import { z } from "zod";
import { contactIntents } from "./types";

export const contactRequestSchema = z.object({
  intent: z.enum(contactIntents.map(({ value }) => value)),
  message: z.string().trim().min(20).max(2_000),
});
