import { z } from "zod";
import { idSchema } from "./common.js";

export const memberRoleSchema = z.enum(["owner", "member"]);

/**
 * pending  — requested to join, awaiting owner approval
 * active   — in the household
 * removed  — left or was removed; kept for history/audit, excluded from rotations
 */
export const memberStatusSchema = z.enum(["pending", "active", "removed"]);

export const memberSchema = z.object({
  id: idSchema,
  partyId: idSchema,
  displayName: z.string().min(1).max(40),
  /** One of the warm avatar palette colors, assigned on join. */
  avatarColor: z.string(),
  role: memberRoleSchema,
  status: memberStatusSchema,
  joinedAt: z.string(),
});

export type MemberRole = z.infer<typeof memberRoleSchema>;
export type MemberStatus = z.infer<typeof memberStatusSchema>;
export type Member = z.infer<typeof memberSchema>;
