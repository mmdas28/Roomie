import type { Member } from "@roomie/core";
import { initials } from "../lib/format.js";

const SIZES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

export function Avatar({
  member,
  size = "md",
  ring = false,
}: {
  member: Pick<Member, "displayName" | "avatarColor">;
  size?: keyof typeof SIZES;
  ring?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${SIZES[size]} ${
        ring ? "ring-2 ring-white" : ""
      }`}
      style={{ backgroundColor: member.avatarColor }}
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
  members: Pick<Member, "id" | "displayName" | "avatarColor">[];
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
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[11px] font-semibold text-ink-muted ring-2 ring-white">
          +{extra}
        </span>
      )}
    </span>
  );
}
