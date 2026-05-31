import { describe, expect, it } from "vitest";
import {
  type Proposal,
  type ProposalPayload,
  cancelProposal,
  castVote,
  computeAffectedMemberIds,
  computeExpiresAt,
  createProposal,
  evaluateStatus,
  reconcileProposalsOnMemberLeave,
} from "../src/index.js";
import { chore, member, party } from "./fixtures.js";

const alice = member({ id: "alice" });
const bob = member({ id: "bob" });
const carol = member({ id: "carol" });
const dave = member({ id: "dave" });
const members = [alice, bob, carol, dave];

const dishes = chore({
  id: "dishes",
  rotationMemberIds: ["alice", "bob", "carol"],
});

const NOW = "2026-06-01T00:00:00.000Z";

function makeProposal(
  payload: ProposalPayload,
  affectedMemberIds: string[],
  overrides: Partial<Proposal> = {},
): Proposal {
  return createProposal(
    {
      id: overrides.id ?? "p1",
      partyId: "party",
      proposedBy: overrides.proposedBy ?? "alice",
      payload,
      description: "test",
      affectedMemberIds,
      createdAt: overrides.createdAt ?? NOW,
      expiresAt: overrides.expiresAt ?? "2026-06-04T00:00:00.000Z",
    },
    NOW,
  );
}

describe("computeAffectedMemberIds", () => {
  it("chore_edit affects active rotation members minus the proposer", () => {
    const ids = computeAffectedMemberIds(
      { type: "chore_edit", choreId: "dishes", changes: { title: "Dishes!" } },
      { proposerId: "alice", members, chore: dishes },
    );
    expect(ids.sort()).toEqual(["bob", "carol"]);
  });

  it("chore_rotation_change affects the union of old and new rotation", () => {
    const ids = computeAffectedMemberIds(
      { type: "chore_rotation_change", choreId: "dishes", rotationMemberIds: ["alice", "dave"] },
      { proposerId: "alice", members, chore: dishes, newRotationMemberIds: ["alice", "dave"] },
    );
    // old {alice,bob,carol} ∪ new {alice,dave} minus proposer alice
    expect(ids.sort()).toEqual(["bob", "carol", "dave"]);
  });

  it("member_remove excludes the target and the proposer, requires all others (§4a)", () => {
    const ids = computeAffectedMemberIds(
      { type: "member_remove", targetMemberId: "bob" },
      { proposerId: "alice", members },
    );
    // everyone active except proposer (alice) and target (bob)
    expect(ids.sort()).toEqual(["carol", "dave"]);
  });

  it("ignores inactive members entirely", () => {
    const ids = computeAffectedMemberIds(
      { type: "member_remove", targetMemberId: "bob" },
      { proposerId: "alice", members: [alice, bob, member({ id: "carol", status: "removed" }), dave] },
    );
    expect(ids.sort()).toEqual(["dave"]);
  });
});

describe("voting and resolution", () => {
  it("approves only when every affected member approves", () => {
    let p = makeProposal(
      { type: "chore_delete", choreId: "dishes" },
      ["bob", "carol"],
    );
    expect(p.status).toBe("pending");
    p = castVote(p, "bob", "approve", NOW).proposal;
    expect(p.status).toBe("pending");
    p = castVote(p, "carol", "approve", NOW).proposal;
    expect(p.status).toBe("approved");
  });

  it("declines the moment anyone declines", () => {
    let p = makeProposal({ type: "chore_delete", choreId: "dishes" }, ["bob", "carol"]);
    p = castVote(p, "bob", "approve", NOW).proposal;
    const res = castVote(p, "carol", "decline", NOW, "I still use this");
    expect(res.proposal.status).toBe("declined");
    expect(res.proposal.notes.carol).toBe("I still use this");
  });

  it("rejects votes from members who aren't asked", () => {
    const p = makeProposal({ type: "chore_delete", choreId: "dishes" }, ["bob", "carol"]);
    const res = castVote(p, "dave", "approve", NOW);
    expect(res.error).toBeTruthy();
    expect(res.proposal.status).toBe("pending");
  });

  it("lets the target be overruled — they cannot block their own removal (§4a)", () => {
    // alice proposes removing bob; only carol & dave must approve.
    let p = makeProposal({ type: "member_remove", targetMemberId: "bob" }, ["carol", "dave"]);
    // bob's hypothetical vote is not even accepted.
    expect(castVote(p, "bob", "decline", NOW).error).toBeTruthy();
    p = castVote(p, "carol", "approve", NOW).proposal;
    p = castVote(p, "dave", "approve", NOW).proposal;
    expect(p.status).toBe("approved");
  });

  it("auto-approves when there is no one left to object", () => {
    const p = makeProposal({ type: "chore_delete", choreId: "dishes" }, []);
    expect(p.status).toBe("approved");
  });

  it("can be cancelled by the proposer while pending", () => {
    const p = makeProposal({ type: "chore_delete", choreId: "dishes" }, ["bob"]);
    expect(cancelProposal(p).status).toBe("cancelled");
  });
});

describe("expiry (§4a — lesser of window and earliest due date)", () => {
  it("uses the time window when no chore turn is sooner", () => {
    const exp = computeExpiresAt(NOW, party({ settings: { proposalExpiryHours: 72 } }));
    expect(exp).toBe("2026-06-04T00:00:00.000Z");
  });

  it("clamps to the earliest upcoming chore turn due date", () => {
    const exp = computeExpiresAt(
      NOW,
      party({ settings: { proposalExpiryHours: 72 } }),
      [
        { id: "t1", choreId: "dishes", assignedTo: "bob", skippedOver: [], assignedDespiteUnavailable: false, dueDate: "2026-06-02", status: "upcoming" },
      ],
    );
    expect(exp).toBe("2026-06-02T23:59:59.999Z");
  });

  it("marks a proposal expired once now passes expiresAt", () => {
    const p = makeProposal(
      { type: "chore_delete", choreId: "dishes" },
      ["bob"],
      { expiresAt: "2026-06-02T00:00:00.000Z" },
    );
    expect(evaluateStatus(p, "2026-06-03T00:00:00.000Z")).toBe("expired");
  });
});

describe("reconcileProposalsOnMemberLeave (§4a)", () => {
  it("cancels proposals authored by the leaving member", () => {
    const p = makeProposal({ type: "chore_delete", choreId: "dishes" }, ["bob"], { proposedBy: "alice" });
    const [r] = reconcileProposalsOnMemberLeave([p], "alice", NOW);
    expect(r.status).toBe("cancelled");
  });

  it("cancels a pending removal proposal targeting the leaver (now moot)", () => {
    const p = makeProposal({ type: "member_remove", targetMemberId: "bob" }, ["carol", "dave"]);
    const [r] = reconcileProposalsOnMemberLeave([p], "bob", NOW);
    expect(r.status).toBe("cancelled");
  });

  it("drops the leaver from the affected set and resolves on remaining votes", () => {
    // affected bob & carol; carol already approved. Bob leaves → only carol's
    // approval was needed, so it resolves to approved.
    let p = makeProposal({ type: "chore_delete", choreId: "dishes" }, ["bob", "carol"]);
    p = castVote(p, "carol", "approve", NOW).proposal;
    const [r] = reconcileProposalsOnMemberLeave([p], "bob", NOW);
    expect(r.affectedMemberIds).toEqual(["carol"]);
    expect(r.status).toBe("approved");
  });

  it("auto-approves when removing the leaver empties the affected set", () => {
    const p = makeProposal({ type: "chore_edit", choreId: "dishes", changes: { title: "X" } }, ["bob"]);
    const [r] = reconcileProposalsOnMemberLeave([p], "bob", NOW);
    expect(r.affectedMemberIds).toEqual([]);
    expect(r.status).toBe("approved");
  });
});
