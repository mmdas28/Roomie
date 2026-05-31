import { z } from "zod";
import { idSchema } from "./common.js";

/** Household-level settings. Kept deliberately small and readable. */
export const partySettingsSchema = z.object({
  /** How long a proposal stays open before auto-expiring (hours). */
  proposalExpiryHours: z.number().int().positive().default(72),
});

/**
 * A Party is a household "lobby." One person owns it and shares a join code;
 * others request to join and the owner approves. Ownership is administrative
 * only — see the consent engine for the anti-hierarchy rules.
 */
export const partySchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(60),
  joinCode: z.string().length(6),
  ownerId: idSchema,
  settings: partySettingsSchema,
  createdAt: z.string(),
});

export type PartySettings = z.infer<typeof partySettingsSchema>;
export type Party = z.infer<typeof partySchema>;
