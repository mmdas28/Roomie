import { describe, expect, it } from "vitest";
import {
  assignNextTurn,
  getNextAssignee,
  removeMembersFromChore,
} from "../src/index.js";
import { block, chore, member } from "./fixtures.js";

const alice = member({ id: "alice", displayName: "Alice" });
const bob = member({ id: "bob", displayName: "Bob" });
const carol = member({ id: "carol", displayName: "Carol" });
const members = [alice, bob, carol];

const trio = (index = 0) =>
  chore({
    id: "dishes",
    rotationMemberIds: ["alice", "bob", "carol"],
    currentRotationIndex: index,
  });

describe("getNextAssignee", () => {
  it("assigns the turn-holder when everyone is available", () => {
    const a = getNextAssignee(trio(0), members, [], "2026-06-01");
    expect(a).toMatchObject({
      assignedTo: "alice",
      skippedOver: [],
      assignedDespiteUnavailable: false,
      nextRotationIndex: 1,
    });
  });

  it("skips an unavailable member and records the skip", () => {
    const blocks = [block({ memberId: "alice", startDate: "2026-06-01", endDate: "2026-06-01" })];
    const a = getNextAssignee(trio(0), members, blocks, "2026-06-01");
    expect(a).toMatchObject({
      assignedTo: "bob",
      skippedOver: ["alice"],
      nextRotationIndex: 2,
    });
  });

  it("skips a chain of unavailable members", () => {
    const blocks = [
      block({ memberId: "alice", startDate: "2026-06-01", endDate: "2026-06-01" }),
      block({ memberId: "bob", startDate: "2026-06-01", endDate: "2026-06-01" }),
    ];
    const a = getNextAssignee(trio(0), members, blocks, "2026-06-01");
    expect(a).toMatchObject({
      assignedTo: "carol",
      skippedOver: ["alice", "bob"],
      nextRotationIndex: 0,
    });
  });

  it("falls back to the turn-holder when everyone is unavailable", () => {
    const blocks = members.map((m) =>
      block({ memberId: m.id, startDate: "2026-06-01", endDate: "2026-06-01" }),
    );
    const a = getNextAssignee(trio(0), members, blocks, "2026-06-01");
    expect(a).toMatchObject({
      assignedTo: "alice",
      assignedDespiteUnavailable: true,
      nextRotationIndex: 1,
    });
    // The assignee is not also listed as skipped.
    expect(a?.skippedOver).not.toContain("alice");
    expect(a?.skippedOver).toEqual(["bob", "carol"]);
  });

  it("passes over inactive members silently (not counted as skips)", () => {
    const removedBob = member({ id: "bob", status: "removed" });
    const a = getNextAssignee(
      trio(1),
      [alice, removedBob, carol],
      [],
      "2026-06-01",
    );
    expect(a).toMatchObject({
      assignedTo: "carol",
      skippedOver: [],
      nextRotationIndex: 0,
    });
  });

  it("returns null when no active members remain", () => {
    const allRemoved = members.map((m) => member({ id: m.id, status: "removed" }));
    expect(getNextAssignee(trio(0), allRemoved, [], "2026-06-01")).toBeNull();
    expect(getNextAssignee(chore({ rotationMemberIds: [] }), members, [], "2026-06-01")).toBeNull();
  });

  it("keeps a skipped member's place — they get their turn next cycle, no double turns downstream", () => {
    // Alice away only on day 1; simulate three consecutive turns.
    const blocks = [block({ memberId: "alice", startDate: "2026-06-01", endDate: "2026-06-01" })];
    const dates = ["2026-06-01", "2026-06-02", "2026-06-03"];
    let c = trio(0);
    const order: string[] = [];
    for (const d of dates) {
      const res = assignNextTurn(c, members, blocks, d)!;
      order.push(res.turn.assignedTo);
      c = res.chore;
    }
    // Alice slides past day 1 but still gets a turn (day 3); Carol isn't doubled.
    expect(order).toEqual(["bob", "carol", "alice"]);
  });
});

describe("assignNextTurn", () => {
  it("builds a turn and advances the chore index", () => {
    const res = assignNextTurn(trio(0), members, [], "2026-06-01", () => "turn1");
    expect(res?.turn).toMatchObject({
      id: "turn1",
      choreId: "dishes",
      assignedTo: "alice",
      dueDate: "2026-06-01",
      status: "upcoming",
    });
    expect(res?.chore.currentRotationIndex).toBe(1);
  });
});

describe("removeMembersFromChore", () => {
  it("strips members and keeps the index pointing at the same upcoming person", () => {
    const c = chore({
      rotationMemberIds: ["a", "b", "c", "d"],
      currentRotationIndex: 2, // c's turn
    });
    const updated = removeMembersFromChore(c, ["b"]);
    expect(updated.rotationMemberIds).toEqual(["a", "c", "d"]);
    expect(updated.rotationMemberIds[updated.currentRotationIndex]).toBe("c");
  });

  it("clamps the index when trailing members are removed", () => {
    const c = chore({
      rotationMemberIds: ["a", "b", "c"],
      currentRotationIndex: 2, // c's turn
    });
    const updated = removeMembersFromChore(c, ["c"]);
    expect(updated.rotationMemberIds).toEqual(["a", "b"]);
    expect(updated.currentRotationIndex).toBeLessThan(2);
  });

  it("deactivates a chore whose rotation empties out", () => {
    const c = chore({ rotationMemberIds: ["a"], currentRotationIndex: 0 });
    const updated = removeMembersFromChore(c, ["a"]);
    expect(updated.rotationMemberIds).toEqual([]);
    expect(updated.isActive).toBe(false);
    expect(updated.currentRotationIndex).toBe(0);
  });
});
