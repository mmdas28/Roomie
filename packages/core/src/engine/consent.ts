import type { Chore } from "../models/chore.js";
import type { ChoreTurn } from "../models/choreTurn.js";
import type { Member } from "../models/member.js";
import type { Party } from "../models/party.js";
import type {
  Proposal,
  ProposalPayload,
  ProposalStatus,
  Vote,
} from "../models/proposal.js";
import { minIsoDate } from "../util/dates.js";

/** Context needed to compute who must approve a proposed change. */
export interface AffectedContext {
  proposerId: string;
  members: readonly Member[];
  /** The chore being changed, for chore_* proposals. */
  chore?: Chore;
  /** Proposed new rotation, for chore_rotation_change. */
  newRotationMemberIds?: readonly string[];
}

function activeIdSet(members: readonly Member[]): Set<string> {
  return new Set(
    members.filter((m) => m.status === "active").map((m) => m.id),
  );
}

/**
 * The "relevant people" who must approve a change — never including the
 * proposer (they implicitly consent by proposing).
 *
 * - chore_edit / chore_delete: every active member in the chore's rotation.
 * - chore_rotation_change: every active member in the old OR new rotation
 *   (adding someone to a chore affects them too).
 * - member_remove: every OTHER active member. The target is deliberately not
 *   counted (§4a) — you can't veto your own removal — but removal still needs
 *   all other active members, so no one can remove someone unilaterally.
 */
export function computeAffectedMemberIds(
  payload: ProposalPayload,
  ctx: AffectedContext,
): string[] {
  const active = activeIdSet(ctx.members);
  const exclude = new Set<string>([ctx.proposerId]);

  let candidates: string[];
  switch (payload.type) {
    case "chore_edit":
    case "chore_delete":
      candidates = ctx.chore?.rotationMemberIds ?? [];
      break;
    case "chore_rotation_change":
      candidates = Array.from(
        new Set([
          ...(ctx.chore?.rotationMemberIds ?? []),
          ...(ctx.newRotationMemberIds ?? payload.rotationMemberIds),
        ]),
      );
      break;
    case "member_remove":
      exclude.add(payload.targetMemberId);
      candidates = Array.from(active);
      break;
  }

  return candidates.filter((id) => active.has(id) && !exclude.has(id));
}

/**
 * A proposal expires at the lesser of its time window and the earliest affected
 * chore turn's due date (§4a) — a chore due tomorrow must not wait the full
 * window for consent. `affectedTurns` should be the upcoming turns of the chore
 * involved (empty for member_remove).
 */
export function computeExpiresAt(
  createdAt: string,
  party: Pick<Party, "settings">,
  affectedTurns: readonly ChoreTurn[] = [],
): string {
  const windowEnd = new Date(
    new Date(createdAt).getTime() +
      party.settings.proposalExpiryHours * 3_600_000,
  ).toISOString();

  const upcoming = affectedTurns
    .filter((t) => t.status === "upcoming" || t.status === "overdue")
    .map((t) => `${t.dueDate}T23:59:59.999Z`);
  if (upcoming.length === 0) return windowEnd;

  const earliestDue = upcoming.reduce((a, b) => (a <= b ? a : b));
  // Both are UTC ISO datetimes, so lexical min is chronological min.
  return minIsoDate(windowEnd, earliestDue);
}

export interface CreateProposalInput {
  id: string;
  partyId: string;
  proposedBy: string;
  payload: ProposalPayload;
  description: string;
  affectedMemberIds: string[];
  createdAt: string;
  expiresAt: string;
}

/** Assemble a proposal and resolve its initial status (may auto-approve). */
export function createProposal(
  input: CreateProposalInput,
  now: string,
): Proposal {
  const proposal: Proposal = {
    id: input.id,
    partyId: input.partyId,
    proposedBy: input.proposedBy,
    type: input.payload.type,
    description: input.description,
    payload: input.payload,
    affectedMemberIds: input.affectedMemberIds,
    votes: {},
    notes: {},
    status: "pending",
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
  };
  return { ...proposal, status: evaluateStatus(proposal, now) };
}

/**
 * Pure state evaluation. A non-terminal proposal becomes:
 * - declined  if anyone voted to decline,
 * - approved  if every affected member approved (vacuously true when none),
 * - expired   if past its expiry with no consensus,
 * - pending   otherwise.
 * Terminal statuses (cancelled/declined/approved/expired) are returned as-is.
 */
export function evaluateStatus(
  proposal: Pick<
    Proposal,
    "status" | "votes" | "affectedMemberIds" | "expiresAt"
  >,
  now: string,
): ProposalStatus {
  if (
    proposal.status === "cancelled" ||
    proposal.status === "approved" ||
    proposal.status === "declined" ||
    proposal.status === "expired"
  ) {
    return proposal.status;
  }

  const votes = Object.values(proposal.votes);
  if (votes.includes("decline")) return "declined";

  const allApproved = proposal.affectedMemberIds.every(
    (id) => proposal.votes[id] === "approve",
  );
  if (allApproved) return "approved";

  if (now >= proposal.expiresAt) return "expired";
  return "pending";
}

/** May this member cast a vote on this proposal? */
export function canVote(proposal: Proposal, memberId: string): boolean {
  return (
    proposal.status === "pending" &&
    proposal.affectedMemberIds.includes(memberId)
  );
}

export interface CastVoteResult {
  proposal: Proposal;
  error?: string;
}

/** Record a vote (and optional note) and recompute status. Pure. */
export function castVote(
  proposal: Proposal,
  memberId: string,
  vote: Vote,
  now: string,
  note?: string,
): CastVoteResult {
  if (proposal.status !== "pending") {
    return { proposal, error: "This proposal is no longer open." };
  }
  if (!proposal.affectedMemberIds.includes(memberId)) {
    return { proposal, error: "You're not asked to approve this change." };
  }

  const next: Proposal = {
    ...proposal,
    votes: { ...proposal.votes, [memberId]: vote },
    notes:
      note && note.trim().length > 0
        ? { ...proposal.notes, [memberId]: note.trim() }
        : proposal.notes,
  };
  return { proposal: { ...next, status: evaluateStatus(next, now) } };
}

/** Withdraw a still-pending proposal (proposer action). */
export function cancelProposal(proposal: Proposal): Proposal {
  if (proposal.status !== "pending") return proposal;
  return { ...proposal, status: "cancelled" };
}

/**
 * Reconcile every proposal when a member leaves or is removed (§4a):
 * - proposals they authored are cancelled,
 * - a pending removal proposal targeting them is cancelled (now moot),
 * - otherwise they're dropped from the affected set and their vote removed,
 *   then status is recomputed (which may auto-approve if no one is left).
 */
export function reconcileProposalsOnMemberLeave(
  proposals: readonly Proposal[],
  leavingMemberId: string,
  now: string,
): Proposal[] {
  return proposals.map((p) => {
    if (p.status !== "pending") return p;

    if (p.proposedBy === leavingMemberId) {
      return { ...p, status: "cancelled" };
    }
    if (
      p.type === "member_remove" &&
      p.payload.type === "member_remove" &&
      p.payload.targetMemberId === leavingMemberId
    ) {
      return { ...p, status: "cancelled" };
    }

    if (!p.affectedMemberIds.includes(leavingMemberId)) return p;

    const affectedMemberIds = p.affectedMemberIds.filter(
      (id) => id !== leavingMemberId,
    );
    const votes = { ...p.votes };
    delete votes[leavingMemberId];
    const updated: Proposal = { ...p, affectedMemberIds, votes };
    return { ...updated, status: evaluateStatus(updated, now) };
  });
}
