import { useState } from "react";
import { useStore } from "../store.js";
import { useActiveMembers, useCurrentMember } from "../lib/selectors.js";
import { Avatar } from "./Avatar.js";
import { Sheet } from "./Sheet.js";

/**
 * Top bar: party name + the "acting as" switcher. In Phase 1 (single device)
 * switching members lets you experience the consent flow from each roommate's
 * side — approving a proposal as someone else, etc.
 */
export function AppHeader({ title }: { title?: string }) {
  const party = useStore((s) => s.party);
  const current = useCurrentMember();
  const members = useActiveMembers();
  const setCurrent = useStore((s) => s.setCurrentMember);
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 mx-auto flex max-w-app items-center justify-between gap-3 border-b border-black/5 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-ink">
          {title ?? party?.name ?? "Roomie"}
        </p>
        {!title && (
          <p className="text-xs text-ink-muted">living together, easy</p>
        )}
      </div>

      {current && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focusable flex items-center gap-2 rounded-full border border-black/10 py-1 pl-1 pr-2.5 active:scale-[0.98]"
          aria-label={`Acting as ${current.displayName}. Tap to switch.`}
        >
          <Avatar member={current} size="sm" />
          <span className="max-w-[6rem] truncate text-xs font-medium text-ink">
            {current.displayName}
          </span>
        </button>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="You're acting as">
        <p className="mb-3 text-sm text-ink-muted">
          Roomie is single-device for now — switch roommate to see the app from
          their side.
        </p>
        <ul className="flex flex-col gap-1">
          {members.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  setCurrent(m.id);
                  setOpen(false);
                }}
                className="focusable flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-surface aria-[current=true]:bg-accent-soft"
                aria-current={m.id === current?.id}
              >
                <Avatar member={m} />
                <span className="flex-1 text-sm font-medium text-ink">
                  {m.displayName}
                </span>
                {m.role === "owner" && (
                  <span className="text-[11px] font-medium text-ink-muted">
                    Owner
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </header>
  );
}
