import type { Member } from "@roomie/core";
import { Avatar } from "./Avatar.js";

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
            className={`focusable flex items-center gap-2 rounded border py-1 pl-1 pr-3 text-sm font-semibold transition active:scale-[0.98] ${
              on
                ? "border-ink bg-ink text-white"
                : "border-border bg-white text-ink hover:border-ink"
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
