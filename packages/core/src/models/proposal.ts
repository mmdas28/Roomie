import { z } from "zod";
import { idSchema } from "./common.js";
import { frequencySchema, prioritySchema } from "./chore.js";

export const voteSchema = z.enum(["approve", "decline"]);

export const proposalStatusSchema = z.enum([
  "pending",
  "approved",
  "declined",
  "expired",
  "cancelled",
]);

/**
 * Typed payloads, discriminated by `type`. Each payload describes the concrete
 * mutation to apply if (and only if) the proposal is approved.
 */
export const proposalPayloadSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("chore_edit"),
    choreId: idSchema,
    changes: z
      .object({
        title: z.string().min(1).max(80).optional(),
        description: z.string().max(280).optional(),
        priority: prioritySchema.optional(),
        frequency: frequencySchema.optional(),
      })
      .refine((c) => Object.keys(c).length > 0, "No changes proposed"),
  }),
  z.object({
    type: z.literal("chore_rotation_change"),
    choreId: idSchema,
    rotationMemberIds: z.array(idSchema),
  }),
  z.object({
    type: z.literal("chore_delete"),
    choreId: idSchema,
  }),
  z.object({
    type: z.literal("member_remove"),
    targetMemberId: idSchema,
  }),
]);

export const proposalTypeSchema = z.enum([
  "chore_edit",
  "chore_rotation_change",
  "chore_delete",
  "member_remove",
]);

export const proposalSchema = z.object({
  id: idSchema,
  partyId: idSchema,
  proposedBy: idSchema,
  type: proposalTypeSchema,
  /** Human-readable summary shown to approvers. */
  description: z.string(),
  payload: proposalPayloadSchema,
  /** Everyone whose approval is required (proposer excluded). */
  affectedMemberIds: z.array(idSchema),
  votes: z.record(idSchema, voteSchema),
  /** Optional notes attached on decline, keyed by member id. */
  notes: z.record(idSchema, z.string()).default({}),
  status: proposalStatusSchema,
  createdAt: z.string(),
  expiresAt: z.string(),
});

export type Vote = z.infer<typeof voteSchema>;
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;
export type ProposalType = z.infer<typeof proposalTypeSchema>;
export type ProposalPayload = z.infer<typeof proposalPayloadSchema>;
export type Proposal = z.infer<typeof proposalSchema>;
