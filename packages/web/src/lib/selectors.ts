import {
  type ChoreTurn,
  type Member,
  type Proposal,
  evaluateStatus,
} from "@roomie/core";
import { useMemo } from "react";
import { useStore } from "../store.js";
import { now, today } from "./time.js";

/** Proposals with status recomputed against the current time (live expiry). */
export function liveProposals(proposals: Proposal[]): Proposal[] {
  const ts = now();
  return proposals.map((p) => ({ ...p, status: evaluateStatus(p, ts) }));
}

export function useCurrentMember(): Member | null {
  return useStore(
    (s) => s.members.find((m) => m.id === s.currentMemberId) ?? null,
  );
}

export function useActiveMembers(): Member[] {
  // Select the stable `members` reference, then derive — returning a fresh
  // array directly from the selector would loop under zustand v5.
  const members = useStore((s) => s.members);
  return useMemo(() => members.filter((m) => m.status === "active"), [members]);
}

export function useMemberLookup(): (id: string) => Member | undefined {
  const members = useStore((s) => s.members);
  return (id: string) => members.find((m) => m.id === id);
}

/** Pending proposals this member still needs to vote on. */
export function pendingForMember(
  proposals: Proposal[],
  memberId: string | null,
): Proposal[] {
  if (!memberId) return [];
  return liveProposals(proposals).filter(
    (p) =>
      p.status === "pending" &&
      p.affectedMemberIds.includes(memberId) &&
      p.votes[memberId] === undefined,
  );
}

/** Effective status of a turn, marking overdue ones that are still upcoming. */
export function turnStatus(turn: ChoreTurn): ChoreTurn["status"] {
  if (turn.status === "upcoming" && turn.dueDate < today()) return "overdue";
  return turn.status;
}

/** Active (not done) turns, soonest first. */
export function openTurns(turns: ChoreTurn[]): ChoreTurn[] {
  return turns
    .filter((t) => t.status === "upcoming")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
