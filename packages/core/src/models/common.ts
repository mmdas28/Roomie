import { z } from "zod";

/** ISO-8601 date string (calendar date, no time): "2026-05-31". */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)");

/** ISO-8601 timestamp: "2026-05-31T12:00:00.000Z". */
export const isoDateTimeSchema = z
  .string()
  .datetime({ message: "Expected an ISO datetime" });

export const idSchema = z.string().min(1);

export type IsoDate = z.infer<typeof isoDateSchema>;
export type IsoDateTime = z.infer<typeof isoDateTimeSchema>;
