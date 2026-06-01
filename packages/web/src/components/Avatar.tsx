import type { Member } from "@roomie/core";
import { initials } from "../lib/format.js";

const SIZES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

/**
 * Deterministic filled vs outlined variant, so adjacent avatars in a stack are
 * visually distinct with no color — differentiation by fill only.
 */
function avatarVariant(id: string): "filled" | "outlined" {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return sum % 2 === 0 ? "filled" : "outlined";
}

export function Avatar({
  member,
  size = "md",
  ring = false,
}: {
  member: Pick<Member, "id" | "displayName">;
  size?: keyof typeof SIZES;
  ring?: boolean;
}) {
  const variant = avatarVariant(member.id);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZES[size]} ${
        variant === "filled"
          ? "bg-ink text-white"
          : "border-2 border-ink bg-white text-ink"
      } ${ring ? "ring-2 ring-white" : ""}`}
      aria-hidden="true"
      title={member.displayName}
    >
      {initials(member.displayName)}
    </span>
  );
}

/** Overlapping stack of avatars (e.g. a chore rotation). */
export function AvatarStack({
  members,
  max = 4,
}: {
  members: Pick<Member, "id" | "displayName">[];
  max?: number;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <span className="flex items-center -space-x-2">
      {shown.map((m) => (
        <Avatar key={m.id} member={m} size="sm" ring />
      ))}
      {extra > 0 && (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-surface text-[11px] font-semibold text-ink-muted">
          +{extra}
        </span>
      )}
    </span>
  );
}
