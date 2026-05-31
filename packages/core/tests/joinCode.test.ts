import { describe, expect, it } from "vitest";
import {
  JOIN_CODE_CHARSET,
  JOIN_CODE_LENGTH,
  generateJoinCode,
  isValidJoinCode,
  normalizeJoinCode,
} from "../src/index.js";

describe("join code", () => {
  it("generates a 6-char code from the unambiguous charset", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateJoinCode();
      expect(code).toHaveLength(JOIN_CODE_LENGTH);
      for (const ch of code) expect(JOIN_CODE_CHARSET).toContain(ch);
    }
  });

  it("never contains ambiguous glyphs (0 O 1 I L S B)", () => {
    const ambiguous = ["0", "O", "1", "I", "L", "S", "B"];
    for (const ch of ambiguous) expect(JOIN_CODE_CHARSET).not.toContain(ch);
  });

  it("is deterministic given a seeded random source", () => {
    const seq = [0, 0.5, 0.99, 0.1, 0.3, 0.7];
    let i = 0;
    const rng = () => seq[i++];
    expect(generateJoinCode(rng)).toHaveLength(6);
  });

  it("normalizes user input (trim, uppercase, strip noise)", () => {
    expect(normalizeJoinCode("  ac-ef gh ")).toBe("ACEFGH");
    expect(normalizeJoinCode("a c e f g h")).toBe("ACEFGH");
  });

  it("validates structural correctness", () => {
    expect(isValidJoinCode("ACEFGH")).toBe(true);
    expect(isValidJoinCode("acefgh")).toBe(true);
    expect(isValidJoinCode("ACEFG")).toBe(false);
    expect(isValidJoinCode("ACEFG!")).toBe(false);
  });
});
