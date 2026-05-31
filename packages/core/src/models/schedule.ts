import { z } from "zod";
import { idSchema, isoDateSchema } from "./common.js";

/** Optional recurring unavailability, e.g. "every Mon/Wed night shift". */
export const recurrenceSchema = z.object({
  type: z.literal("weekly"),
  /** 0 = Sunday .. 6 = Saturday. */
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
});

/**
 * A block of time a member is away/unavailable. The date range is inclusive on
 * both ends. If `recurrence` is set, the block only applies on matching
 * weekdays within [startDate, endDate].
 */
export const scheduleBlockSchema = z.object({
  id: idSchema,
  memberId: idSchema,
  partyId: idSchema,
  label: z.string().min(1).max(60),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  recurrence: recurrenceSchema.optional(),
});

export type Recurrence = z.infer<typeof recurrenceSchema>;
export type ScheduleBlock = z.infer<typeof scheduleBlockSchema>;
