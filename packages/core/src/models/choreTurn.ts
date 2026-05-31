import { z } from "zod";
import { idSchema, isoDateSchema } from "./common.js";

export const turnStatusSchema = z.enum([
  "upcoming",
  "done",
  "skipped",
  "overdue",
]);

/** A single scheduled instance of a chore for one person on one date. */
export const choreTurnSchema = z.object({
  id: idSchema,
  choreId: idSchema,
  /** Member assigned after skip resolution. */
  assignedTo: idSchema,
  /** Members passed over for this turn because they were unavailable. */
  skippedOver: z.array(idSchema),
  /**
   * True when everyone in the rotation was unavailable and we fell back to
   * assigning anyway — the assignee may want to swap.
   */
  assignedDespiteUnavailable: z.boolean().default(false),
  dueDate: isoDateSchema,
  status: turnStatusSchema,
  completedAt: z.string().optional(),
});

export type TurnStatus = z.infer<typeof turnStatusSchema>;
export type ChoreTurn = z.infer<typeof choreTurnSchema>;
