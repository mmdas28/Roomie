import { describe, expect, it } from "vitest";
import {
  addDays,
  blockCoversDate,
  dayOfWeek,
  daysBetween,
  isMemberUnavailable,
} from "../src/index.js";
import { block } from "./fixtures.js";

describe("date helpers", () => {
  it("adds days across month boundaries in UTC", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("computes weekday (0=Sun)", () => {
    expect(dayOfWeek("2026-05-31")).toBe(0); // Sunday
    expect(dayOfWeek("2026-06-01")).toBe(1); // Monday
  });

  it("computes whole-day differences", () => {
    expect(daysBetween("2026-06-01", "2026-06-08")).toBe(7);
    expect(daysBetween("2026-06-08", "2026-06-01")).toBe(-7);
  });
});

describe("availability", () => {
  it("covers dates inside an inclusive range", () => {
    const b = block({ startDate: "2026-06-01", endDate: "2026-06-07" });
    expect(blockCoversDate(b, "2026-05-31")).toBe(false);
    expect(blockCoversDate(b, "2026-06-01")).toBe(true);
    expect(blockCoversDate(b, "2026-06-07")).toBe(true);
    expect(blockCoversDate(b, "2026-06-08")).toBe(false);
  });

  it("respects weekly recurrence within the range", () => {
    // Night shift Mon (1) and Wed (3) across a two-week window.
    const b = block({
      startDate: "2026-06-01",
      endDate: "2026-06-14",
      recurrence: { type: "weekly", daysOfWeek: [1, 3] },
    });
    expect(blockCoversDate(b, "2026-06-01")).toBe(true); // Mon
    expect(blockCoversDate(b, "2026-06-02")).toBe(false); // Tue
    expect(blockCoversDate(b, "2026-06-03")).toBe(true); // Wed
    expect(blockCoversDate(b, "2026-06-08")).toBe(true); // next Mon
  });

  it("flags a member unavailable only for their own blocks", () => {
    const blocks = [
      block({ memberId: "alice", startDate: "2026-06-01", endDate: "2026-06-03" }),
    ];
    expect(isMemberUnavailable("alice", "2026-06-02", blocks)).toBe(true);
    expect(isMemberUnavailable("bob", "2026-06-02", blocks)).toBe(false);
    expect(isMemberUnavailable("alice", "2026-06-05", blocks)).toBe(false);
  });
});
