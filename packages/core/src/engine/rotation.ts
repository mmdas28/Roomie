import type { Chore } from "../models/chore.js";
import type { ChoreTurn } from "../models/choreTurn.js";
import type { IsoDate } from "../models/common.js";
import type { Member } from "../models/member.js";
import type { ScheduleBlock } from "../models/schedule.js";
import { createId } from "../util/id.js";
import { isMemberUnavailable } from "./availability.js";

export interface Assignment {
  /** Member who gets this turn. */
  assignedTo: string;
  /** Active members passed over because they were unavailable on the date. */
  skippedOver: string[];
  /**
   * True when every active rotation member was unavailable and we assigned the
   * turn-holder anyway (they may want to swap).
   */
  assignedDespiteUnavailable: boolean;
  /** Where `currentRotationIndex` should point after this turn. */
  nextRotationIndex: number;
}

/**
 * Decide who takes the next turn of a chore on `dueDate`.
 *
 * Walks the rotation from `currentRotationIndex`, silently passing members who
 * are no longer active and recording active-but-unavailable members in
 * `skippedOver`. The first active + available member is assigned, and the index
 * advances exactly one step past them — so a skipped member keeps their place
 * and isn't penalized for being away, and no one downstream gets a double turn.
 *
 * If everyone active is unavailable, falls back to the turn-holder and flags
 * `assignedDespiteUnavailable`. Returns `null` only when the rotation has no
 * active members at all (chore "needs someone").
 */
export function getNextAssignee(
  chore: Pick<Chore, "rotationMemberIds" | "currentRotationIndex">,
  members: readonly Member[],
  blocks: readonly ScheduleBlock[],
  dueDate: IsoDate,
): Assignment | null {
  const rotation = chore.rotationMemberIds;
  const len = rotation.length;
  if (len === 0) return null;

  const activeIds = new Set(
    members.filter((m) => m.status === "active").map((m) => m.id),
  );
  const start = chore.currentRotationIndex % len;

  const skippedOver: string[] = [];
  for (let step = 0; step < len; step++) {
    const pos = (start + step) % len;
    const memberId = rotation[pos];
    if (!activeIds.has(memberId)) continue; // removed/inactive — pass silently
    if (isMemberUnavailable(memberId, dueDate, blocks)) {
      skippedOver.push(memberId);
      continue;
    }
    return {
      assignedTo: memberId,
      skippedOver,
      assignedDespiteUnavailable: false,
      nextRotationIndex: (pos + 1) % len,
    };
  }

  // Everyone active is unavailable — assign the turn-holder anyway.
  for (let step = 0; step < len; step++) {
    const pos = (start + step) % len;
    const memberId = rotation[pos];
    if (!activeIds.has(memberId)) continue;
    return {
      assignedTo: memberId,
      skippedOver: skippedOver.filter((id) => id !== memberId),
      assignedDespiteUnavailable: true,
      nextRotationIndex: (pos + 1) % len,
    };
  }

  return null; // no active members in the rotation
}

/**
 * Produce the next ChoreTurn for a chore and the chore with its rotation index
 * advanced. Returns null when the chore has no eligible assignee.
 */
export function assignNextTurn(
  chore: Chore,
  members: readonly Member[],
  blocks: readonly ScheduleBlock[],
  dueDate: IsoDate,
  idFn: () => string = () => createId("turn"),
): { turn: ChoreTurn; chore: Chore } | null {
  const assignment = getNextAssignee(chore, members, blocks, dueDate);
  if (!assignment) return null;

  const turn: ChoreTurn = {
    id: idFn(),
    choreId: chore.id,
    assignedTo: assignment.assignedTo,
    skippedOver: assignment.skippedOver,
    assignedDespiteUnavailable: assignment.assignedDespiteUnavailable,
    dueDate,
    status: "upcoming",
  };

  return {
    turn,
    chore: { ...chore, currentRotationIndex: assignment.nextRotationIndex },
  };
}

/**
 * Re-normalize a chore after its rotation membership changes (member left or
 * was removed). Strips the given ids and clamps the index so it still points at
 * a valid remaining member. Deactivates the chore if the rotation empties.
 */
export function removeMembersFromChore(
  chore: Chore,
  removedMemberIds: readonly string[],
): Chore {
  const removed = new Set(removedMemberIds);
  const oldRotation = chore.rotationMemberIds;

  // Count how many surviving members sit before the current index so the
  // pointer keeps aiming at the same upcoming person where possible.
  let survivorsBeforeIndex = 0;
  for (let i = 0; i < chore.currentRotationIndex && i < oldRotation.length; i++) {
    if (!removed.has(oldRotation[i])) survivorsBeforeIndex++;
  }

  const rotationMemberIds = oldRotation.filter((id) => !removed.has(id));

  if (rotationMemberIds.length === 0) {
    return { ...chore, rotationMemberIds, currentRotationIndex: 0, isActive: false };
  }

  return {
    ...chore,
    rotationMemberIds,
    currentRotationIndex: survivorsBeforeIndex % rotationMemberIds.length,
  };
}
