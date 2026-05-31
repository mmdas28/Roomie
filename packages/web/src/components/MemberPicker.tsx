import type { Member } from "@roomie/core";
import { Avatar } from "./Avatar.js";

/** Multi-select roster of active members, shown as toggleable chips. */
export function MemberPicker({
  members,
  selected,
  onToggle,
}: {
  members: Member[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {members.map((m) => {
        const on = selected.includes(m.id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onToggle(m.id)}
            aria-pressed={on}
            className={`focusable flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition active:scale-[0.98] ${
              on
                ? "border-accent bg-accent-soft text-accent-ink"
                : "border-black/10 bg-white text-ink-muted"
            }`}
          >
            <Avatar member={m} size="sm" />
            {m.displayName.split(" ")[0]}
          </button>
        );
      })}
    </div>
  );
}
