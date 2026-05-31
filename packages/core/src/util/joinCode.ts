/**
 * Unambiguous charset for join codes. Excludes easily-confused glyphs
 * (0/O, 1/I/L, 5/S, 8/B, etc.) so codes read cleanly aloud.
 */
export const JOIN_CODE_CHARSET = "ACEFGHJKMNPQRTVWXY234679";
export const JOIN_CODE_LENGTH = 6;

/** Source of randomness; injectable for deterministic tests. */
export type RandomFn = () => number;

/** Generate a 6-character, human-friendly join code. */
export function generateJoinCode(random: RandomFn = Math.random): string {
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    const idx = Math.floor(random() * JOIN_CODE_CHARSET.length);
    code += JOIN_CODE_CHARSET[idx];
  }
  return code;
}

/** Normalize user-typed input (trim, uppercase, strip stray chars). */
export function normalizeJoinCode(input: string): string {
  return input
    .toUpperCase()
    .split("")
    .filter((ch) => JOIN_CODE_CHARSET.includes(ch))
    .join("");
}

/** True if `input` is a structurally valid join code. */
export function isValidJoinCode(input: string): boolean {
  return normalizeJoinCode(input).length === JOIN_CODE_LENGTH;
}
