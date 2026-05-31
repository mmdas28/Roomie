import {
  type Chore,
  type ChoreTurn,
  type Frequency,
  type Member,
  type Party,
  type Priority,
  type Proposal,
  type ProposalPayload,
  type ScheduleBlock,
  type Vote,
  assignNextTurn,
  cancelProposal,
  castVote,
  computeAffectedMemberIds,
  computeExpiresAt,
  createId,
  createProposal,
  defaultFrequencyForPriority,
  describeProposal,
  generateJoinCode,
  pickAvatarColor,
  reconcileProposalsOnMemberLeave,
  removeMembersFromChore,
} from "@roomie/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nextDueDate } from "./lib/schedule.js";
import { now, today } from "./lib/time.js";

export interface RoomieState {
  party: Party | null;
  members: Member[];
  chores: Chore[];
  turns: ChoreTurn[];
  blocks: ScheduleBlock[];
  proposals: Proposal[];
  /** Ids of approved proposals whose payloads have already been applied. */
  appliedProposalIds: string[];
  /** Whether the post-creation Quick start step has been completed or skipped. */
  quickStartDone: boolean;
  /** Which member the device is currently acting as (Phase 1 demo affordance). */
  currentMemberId: string | null;

  // ── Onboarding / party ───────────────────────────────────────────────
  createParty: (partyName: string, ownerName: string) => void;
  renameParty: (name: string) => void;
  regenerateJoinCode: () => void;
  resetEverything: () => void;

  // ── Membership ───────────────────────────────────────────────────────
  addRoommate: (name: string, status?: "active" | "pending") => string;
  approveMember: (memberId: string) => void;
  declineMember: (memberId: string) => void;
  /** Remove a member (used after a member_remove proposal is approved, or self-leave). */
  removeMember: (memberId: string) => void;
  setCurrentMember: (memberId: string) => void;

  // ── Chores ───────────────────────────────────────────────────────────
  addChore: (input: {
    title: string;
    priority: Priority;
    memberIds: string[];
    frequency?: Frequency;
    description?: string;
  }) => void;
  addPresetChores: (
    presets: { title: string; priority: Priority }[],
    memberIds: string[],
  ) => void;
  finishQuickStart: () => void;
  markTurnDone: (turnId: string) => void;

  // ── Schedule ─────────────────────────────────────────────────────────
  addBlock: (input: Omit<ScheduleBlock, "id" | "partyId">) => void;
  removeBlock: (blockId: string) => void;

  // ── Proposals / consent ──────────────────────────────────────────────
  propose: (payload: ProposalPayload) => string | null;
  vote: (proposalId: string, vote: Vote, note?: string) => void;
  withdrawProposal: (proposalId: string) => void;
}

const emptyState = {
  party: null,
  members: [],
  chores: [],
  turns: [],
  blocks: [],
  proposals: [],
  appliedProposalIds: [],
  quickStartDone: false,
  currentMemberId: null,
};

function memberName(members: Member[], id: string): string {
  return members.find((m) => m.id === id)?.displayName ?? "Someone";
}

/** Generate the first turn for a freshly created/activated chore. */
function seedTurn(
  chore: Chore,
  members: Member[],
  blocks: ScheduleBlock[],
): { turn: ChoreTurn; chore: Chore } | null {
  return assignNextTurn(chore, members, blocks, today(), () => createId("turn"));
}

export const useStore = create<RoomieState>()(
  persist(
    (set, get) => ({
      ...emptyState,

      createParty: (partyName, ownerName) => {
        const partyId = createId("party");
        const ownerId = createId("m");
        const owner: Member = {
          id: ownerId,
          partyId,
          displayName: ownerName.trim() || "You",
          avatarColor: pickAvatarColor(0),
          role: "owner",
          status: "active",
          joinedAt: now(),
        };
        const party: Party = {
          id: partyId,
          name: partyName.trim() || "Our Place",
          joinCode: generateJoinCode(),
          ownerId,
          settings: { proposalExpiryHours: 72 },
          createdAt: now(),
        };
        set({
          ...emptyState,
          party,
          members: [owner],
          currentMemberId: ownerId,
        });
      },

      renameParty: (name) =>
        set((s) =>
          s.party ? { party: { ...s.party, name: name.trim() || s.party.name } } : s,
        ),

      regenerateJoinCode: () =>
        set((s) =>
          s.party ? { party: { ...s.party, joinCode: generateJoinCode() } } : s,
        ),

      resetEverything: () => set({ ...emptyState }),

      addRoommate: (name, status = "active") => {
        const s = get();
        if (!s.party) return "";
        const id = createId("m");
        const member: Member = {
          id,
          partyId: s.party.id,
          displayName: name.trim() || "Roommate",
          avatarColor: pickAvatarColor(s.members.length),
          role: "member",
          status,
          joinedAt: now(),
        };
        set({ members: [...s.members, member] });
        return id;
      },

      approveMember: (memberId) =>
        set((s) => ({
          members: s.members.map((m) =>
            m.id === memberId ? { ...m, status: "active" } : m,
          ),
        })),

      declineMember: (memberId) =>
        set((s) => ({ members: s.members.filter((m) => m.id !== memberId) })),

      removeMember: (memberId) => {
        const s = get();
        // Strip from every rotation and re-normalize, seeding turns as needed.
        let chores = s.chores.map((c) =>
          c.rotationMemberIds.includes(memberId)
            ? removeMembersFromChore(c, [memberId])
            : c,
        );
        // Drop pending turns assigned to the leaver; reseat active chores.
        let turns = s.turns.filter(
          (t) => !(t.assignedTo === memberId && t.status === "upcoming"),
        );
        chores = chores.map((c) => {
          if (!c.isActive) return c;
          const hasUpcoming = turns.some(
            (t) => t.choreId === c.id && t.status === "upcoming",
          );
          if (hasUpcoming) return c;
          const seeded = seedTurn(c, nextActiveMembers(s.members, memberId), s.blocks);
          if (seeded) {
            turns = [...turns, seeded.turn];
            return seeded.chore;
          }
          return c;
        });

        const members = s.members.map((m) =>
          m.id === memberId ? { ...m, status: "removed" as const } : m,
        );
        const proposals = reconcileProposalsOnMemberLeave(
          s.proposals,
          memberId,
          now(),
        );
        const currentMemberId =
          s.currentMemberId === memberId
            ? (members.find((m) => m.status === "active")?.id ?? null)
            : s.currentMemberId;

        set({ members, chores, turns, proposals, currentMemberId });
        applyApproved(get, set);
      },

      setCurrentMember: (memberId) => set({ currentMemberId: memberId }),

      addChore: ({ title, priority, memberIds, frequency, description }) => {
        const s = get();
        if (!s.party) return;
        const chore: Chore = {
          id: createId("chore"),
          partyId: s.party.id,
          title: title.trim(),
          description: description?.trim() || undefined,
          priority,
          frequency: frequency ?? defaultFrequencyForPriority(priority),
          rotationMemberIds: memberIds.length > 0 ? memberIds : activeIds(s.members),
          currentRotationIndex: 0,
          isActive: true,
          createdAt: now(),
        };
        const seeded = seedTurn(chore, s.members, s.blocks);
        set({
          chores: [...s.chores, seeded ? seeded.chore : chore],
          turns: seeded ? [...s.turns, seeded.turn] : s.turns,
        });
      },

      addPresetChores: (presets, memberIds) => {
        for (const p of presets) {
          get().addChore({ title: p.title, priority: p.priority, memberIds });
        }
      },

      finishQuickStart: () => set({ quickStartDone: true }),

      markTurnDone: (turnId) => {
        const s = get();
        const turn = s.turns.find((t) => t.id === turnId);
        if (!turn) return;
        const chore = s.chores.find((c) => c.id === turn.choreId);

        const turns = s.turns.map((t) =>
          t.id === turnId ? { ...t, status: "done" as const, completedAt: now() } : t,
        );

        // Schedule the next turn for an active recurring chore.
        let chores = s.chores;
        let nextTurns = turns;
        if (chore && chore.isActive) {
          const due = nextDueDate(chore.frequency, turn.dueDate);
          const seeded = assignNextTurn(chore, s.members, s.blocks, due, () =>
            createId("turn"),
          );
          if (seeded) {
            chores = s.chores.map((c) => (c.id === chore.id ? seeded.chore : c));
            nextTurns = [...turns, seeded.turn];
          }
        }
        set({ turns: nextTurns, chores });
      },

      addBlock: (input) => {
        const s = get();
        if (!s.party) return;
        const block: ScheduleBlock = {
          ...input,
          id: createId("block"),
          partyId: s.party.id,
        };
        set({ blocks: [...s.blocks, block] });
      },

      removeBlock: (blockId) =>
        set((s) => ({ blocks: s.blocks.filter((b) => b.id !== blockId) })),

      propose: (payload) => {
        const s = get();
        if (!s.party || !s.currentMemberId) return null;
        const proposerId = s.currentMemberId;
        const chore =
          "choreId" in payload
            ? s.chores.find((c) => c.id === payload.choreId)
            : undefined;

        const affectedMemberIds = computeAffectedMemberIds(payload, {
          proposerId,
          members: s.members,
          chore,
          newRotationMemberIds:
            payload.type === "chore_rotation_change"
              ? payload.rotationMemberIds
              : undefined,
        });

        const affectedTurns = chore
          ? s.turns.filter((t) => t.choreId === chore.id)
          : [];

        const description = describeProposal(payload, {
          proposerName: memberName(s.members, proposerId),
          memberName: (id) => memberName(s.members, id),
          choreTitle: chore?.title,
        });

        const id = createId("prop");
        const proposal = createProposal(
          {
            id,
            partyId: s.party.id,
            proposedBy: proposerId,
            payload,
            description,
            affectedMemberIds,
            createdAt: now(),
            expiresAt: computeExpiresAt(now(), s.party, affectedTurns),
          },
          now(),
        );
        set({ proposals: [...s.proposals, proposal] });
        applyApproved(get, set); // may already be approved (no one to object)
        return id;
      },

      vote: (proposalId, voteValue, note) => {
        const s = get();
        if (!s.currentMemberId) return;
        const proposals = s.proposals.map((p) =>
          p.id === proposalId
            ? castVote(p, s.currentMemberId!, voteValue, now(), note).proposal
            : p,
        );
        set({ proposals });
        applyApproved(get, set);
      },

      withdrawProposal: (proposalId) =>
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === proposalId ? cancelProposal(p) : p,
          ),
        })),
    }),
    {
      name: "roomie-state-v1",
      partialize: ({
        party,
        members,
        chores,
        turns,
        blocks,
        proposals,
        appliedProposalIds,
        quickStartDone,
        currentMemberId,
      }) => ({
        party,
        members,
        chores,
        turns,
        blocks,
        proposals,
        appliedProposalIds,
        quickStartDone,
        currentMemberId,
      }),
    },
  ),
);

// ── Helpers ────────────────────────────────────────────────────────────

function activeIds(members: Member[]): string[] {
  return members.filter((m) => m.status === "active").map((m) => m.id);
}

function nextActiveMembers(members: Member[], leavingId: string): Member[] {
  return members.map((m) =>
    m.id === leavingId ? { ...m, status: "removed" as const } : m,
  );
}

/**
 * Apply every approved-but-unapplied proposal's payload, then mark it applied by
 * leaving it in `approved` status (payloads are idempotent here because the
 * mutation removes the precondition). Runs after any vote/propose/leave.
 */
function applyApproved(
  get: () => RoomieState,
  set: (partial: Partial<RoomieState>) => void,
): void {
  const s = get();
  const applied = new Set(s.appliedProposalIds);
  const justApproved = s.proposals.filter(
    (p) => p.status === "approved" && !applied.has(p.id),
  );
  if (justApproved.length === 0) return;

  let { chores, turns } = s;

  for (const p of justApproved) {
    applied.add(p.id);
    const payload = p.payload;
    switch (payload.type) {
      case "chore_edit":
        chores = chores.map((c) =>
          c.id === payload.choreId ? { ...c, ...payload.changes } : c,
        );
        break;
      case "chore_rotation_change":
        chores = chores.map((c) =>
          c.id === payload.choreId
            ? {
                ...c,
                rotationMemberIds: payload.rotationMemberIds,
                currentRotationIndex: 0,
                isActive: payload.rotationMemberIds.length > 0,
              }
            : c,
        );
        break;
      case "chore_delete":
        chores = chores.filter((c) => c.id !== payload.choreId);
        turns = turns.filter((t) => t.choreId !== payload.choreId);
        break;
      case "member_remove":
        // Defer to removeMember for full reconciliation.
        queueMicrotask(() => useStore.getState().removeMember(payload.targetMemberId));
        break;
    }
  }

  set({ chores, turns, appliedProposalIds: Array.from(applied) });
}
