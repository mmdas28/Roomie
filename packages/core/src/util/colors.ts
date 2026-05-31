/**
 * Warm, distinct avatar palette assigned on join. Picked for contrast against
 * Roomie's white surfaces and from each other.
 */
export const AVATAR_PALETTE = [
  "#E07A5F", // terracotta
  "#5C8B5A", // sage (accent)
  "#3D7EA6", // denim
  "#E6A23C", // amber
  "#9B5DE5", // violet
  "#D1495B", // rose
  "#2A9D8F", // teal
  "#C77DFF", // orchid
] as const;

/** Deterministically pick the next color, spreading by member count. */
export function pickAvatarColor(existingCount: number): string {
  return AVATAR_PALETTE[existingCount % AVATAR_PALETTE.length];
}
