import { z } from "zod";
import { idSchema } from "./common.js";

/**
 * Frequency is normalized to "every N days" plus a discriminator so the UI can
 * label it nicely. weekly may pin specific weekdays; custom carries an interval.
 */
export const frequencySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("daily") }),
  z.object({
    type: z.literal("weekly"),
    /** 0 = Sunday .. 6 = Saturday. Empty/absent = "once a week, any day". */
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  }),
  z.object({
    type: z.literal("custom"),
    everyNDays: z.number().int().positive(),
  }),
]);

/** Priority orders tasks, never people. Drives default frequency + sort. */
export const prioritySchema = z.enum(["high", "medium", "low"]);

export const choreSchema = z.object({
  id: idSchema,
  partyId: idSchema,
  title: z.string().min(1).max(80),
  description: z.string().max(280).optional(),
  priority: prioritySchema,
  frequency: frequencySchema,
  /** Ordered rotation. Index advances one eligible step after each turn. */
  rotationMemberIds: z.array(idSchema),
  currentRotationIndex: z.number().int().min(0),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type Frequency = z.infer<typeof frequencySchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type Chore = z.infer<typeof choreSchema>;

/** Default frequency mapping by priority (§8A). Editable later per-chore. */
export function defaultFrequencyForPriority(priority: Priority): Frequency {
  switch (priority) {
    case "high":
      return { type: "daily" };
    case "medium":
      return { type: "weekly" };
    case "low":
      return { type: "custom", everyNDays: 14 };
  }
}

/** Sort weight, high → medium → low. Lower number sorts first. */
export function priorityRank(priority: Priority): number {
  return { high: 0, medium: 1, low: 2 }[priority];
}
