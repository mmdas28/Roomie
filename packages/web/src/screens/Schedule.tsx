import { useState } from "react";
import { Avatar } from "../components/Avatar.js";
import { EmptyState } from "../components/EmptyState.js";
import { Sheet } from "../components/Sheet.js";
import { PlusIcon, TrashIcon } from "../components/icons.js";
import { shortDate } from "../lib/format.js";
import { useActiveMembers, useCurrentMember } from "../lib/selectors.js";
import { today } from "../lib/time.js";
import { useStore } from "../store.js";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Schedule() {
  const blocks = useStore((s) => s.blocks);
  const removeBlock = useStore((s) => s.removeBlock);
  const members = useActiveMembers();
  const me = useCurrentMember();
  const [addOpen, setAddOpen] = useState(false);

  const byMember = members.map((m) => ({
    member: m,
    blocks: blocks
      .filter((b) => b.memberId === m.id)
      .sort((a, b) => a.startDate.localeCompare(b.startDate)),
  }));

  const anyBlocks = blocks.length > 0;

  return (
    <div className="px-4 py-5">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Schedule</h1>
        <button
          className="focusable flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-ink"
          onClick={() => setAddOpen(true)}
        >
          <PlusIcon className="h-4 w-4" /> Mark away
        </button>
      </div>
      <p className="mb-4 text-sm text-ink-muted">
        Mark when you're away and Roomie skips your chore turns automatically.
      </p>

      {!anyBlocks ? (
        <EmptyState
          emoji="🗓️"
          title="Nobody's away"
          body="When someone's traveling, on a night shift, or just out, mark it here so chores route around them."
          action={
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              Mark yourself away
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          {byMember.map(({ member, blocks: mb }) => (
            <section key={member.id}>
              <div className="mb-2 flex items-center gap-2">
                <Avatar member={member} size="sm" />
                <h2 className="text-sm font-semibold text-ink">
                  {member.displayName}
                  {member.id === me?.id && (
                    <span className="ml-1 text-xs font-normal text-ink-muted">
                      (you)
                    </span>
                  )}
                </h2>
              </div>
              {mb.length === 0 ? (
                <p className="rounded border border-dashed border-border px-3 py-3 text-sm text-ink-muted">
                  Around — no away time set.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {mb.map((b) => (
                    <li
                      key={b.id}
                      className="card flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="font-medium text-ink">{b.label}</p>
                        <p className="text-xs text-ink-muted">
                          {shortDate(b.startDate)} – {shortDate(b.endDate)}
                          {b.recurrence &&
                            ` · ${b.recurrence.daysOfWeek
                              .map((d) => WEEKDAY_NAMES[d])
                              .join(", ")}`}
                        </p>
                      </div>
                      {b.memberId === me?.id && (
                        <button
                          className="focusable flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-danger"
                          onClick={() => removeBlock(b.id)}
                          aria-label="Remove away time"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <AddBlockSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function AddBlockSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addBlock = useStore((s) => s.addBlock);
  const me = useCurrentMember();

  const [label, setLabel] = useState("");
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const [recurring, setRecurring] = useState(false);
  const [days, setDays] = useState<number[]>([]);

  const reset = () => {
    setLabel("");
    setStart(today());
    setEnd(today());
    setRecurring(false);
    setDays([]);
  };

  const valid =
    label.trim().length > 0 &&
    start <= end &&
    (!recurring || days.length > 0);

  const submit = () => {
    if (!me || !valid) return;
    addBlock({
      memberId: me.id,
      label: label.trim(),
      startDate: start,
      endDate: end,
      ...(recurring ? { recurrence: { type: "weekly", daysOfWeek: days } } : {}),
    });
    reset();
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Mark yourself away">
      <div className="flex flex-col gap-4">
        <label className="block text-sm font-medium text-ink">
          What's up?
          <input
            className="input mt-1.5"
            placeholder="Out of town, night shift…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-ink">
            From
            <input
              type="date"
              className="input mt-1.5"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            To
            <input
              type="date"
              className="input mt-1.5"
              value={end}
              min={start}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 accent-accent"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
          />
          Only certain weekdays (e.g. a recurring shift)
        </label>

        {recurring && (
          <div className="flex justify-between gap-1">
            {WEEKDAYS.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setDays((ds) =>
                    ds.includes(i) ? ds.filter((x) => x !== i) : [...ds, i],
                  )
                }
                aria-pressed={days.includes(i)}
                aria-label={WEEKDAY_NAMES[i]}
                className={`focusable h-10 w-10 rounded-full text-sm font-semibold transition ${
                  days.includes(i)
                    ? "bg-ink text-white"
                    : "bg-surface text-ink-muted hover:border hover:border-ink"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        <button className="btn-primary mt-1 w-full" disabled={!valid} onClick={submit}>
          Save
        </button>
      </div>
    </Sheet>
  );
}
