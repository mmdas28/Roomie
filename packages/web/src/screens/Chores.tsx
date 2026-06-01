import {
  CHORE_PRESETS,
  describeFrequency,
  priorityRank,
} from "@roomie/core";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AvatarStack } from "../components/Avatar.js";
import { ChoreDetail } from "../components/ChoreDetail.js";
import { EmptyState } from "../components/EmptyState.js";
import { PriorityDot } from "../components/PriorityDot.js";
import { Sheet } from "../components/Sheet.js";
import { PlusIcon } from "../components/icons.js";
import { useActiveMembers, useMemberLookup } from "../lib/selectors.js";
import { useStore } from "../store.js";

export function Chores() {
  const navigate = useNavigate();
  const chores    = useStore((s) => s.chores);
  const proposals = useStore((s) => s.proposals);
  const lookup    = useMemberLookup();
  const [openId, setOpenId]       = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const sorted = [...chores].sort(
    (a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      a.title.localeCompare(b.title),
  );

  const pendingChoreIds = new Set(
    proposals
      .filter((p) => p.status === "pending" && "choreId" in p.payload)
      .map((p) => ("choreId" in p.payload ? p.payload.choreId : "")),
  );

  if (chores.length === 0) {
    return (
      <>
        <EmptyState
          emoji="🧹"
          title="No chores yet"
          body="Add one and decide who goes first. Roomie keeps the turns fair from there."
          action={
            <div className="flex flex-col gap-2">
              <button className="btn-primary" onClick={() => navigate("/chores/new")}>
                Add a chore
              </button>
              <button className="btn-ghost" onClick={() => setPresetsOpen(true)}>
                Add from presets
              </button>
            </div>
          }
        />
        <PresetsSheet open={presetsOpen} onClose={() => setPresetsOpen(false)} />
      </>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Chores</h1>
        <button
          className="focusable text-sm font-semibold text-ink-muted hover:text-ink"
          onClick={() => setPresetsOpen(true)}
        >
          Add presets
        </button>
      </div>

      <ul className="flex flex-col gap-2.5">
        <AnimatePresence>
          {sorted.map((chore) => {
            const rotationMembers = chore.rotationMemberIds
              .map((id) => lookup(id))
              .filter((m): m is NonNullable<typeof m> => Boolean(m));
            return (
              <motion.li
                layout
                key={chore.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.12 }}
              >
                <button
                  className="focusable card flex w-full items-center gap-3 text-left active:scale-[0.99]"
                  onClick={() => setOpenId(chore.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <PriorityDot priority={chore.priority} />
                      <span className="truncate font-bold text-ink">
                        {chore.title}
                      </span>
                      {!chore.isActive && (
                        <span className="shrink-0 rounded border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                          needs someone
                        </span>
                      )}
                      {pendingChoreIds.has(chore.id) && (
                        <span className="shrink-0 rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                          pending
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {describeFrequency(chore.frequency)}
                    </p>
                  </div>
                  {rotationMembers.length > 0 && (
                    <AvatarStack members={rotationMembers} />
                  )}
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {/* FAB — solid black circle, stays within the column */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-20 mx-auto flex max-w-app justify-end px-4">
        <button
          className="btn-primary pointer-events-auto !min-h-[52px] !w-[52px] !rounded-full !px-0"
          onClick={() => navigate("/chores/new")}
          aria-label="Add a chore"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>

      {openId && <ChoreDetail choreId={openId} onClose={() => setOpenId(null)} />}
      <PresetsSheet open={presetsOpen} onClose={() => setPresetsOpen(false)} />
    </div>
  );
}

function PresetsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const chores = useStore((s) => s.chores);
  const addPresetChores = useStore((s) => s.addPresetChores);
  const members = useActiveMembers();

  const existing = new Set(chores.map((c) => c.title.toLowerCase()));
  const available = CHORE_PRESETS.filter(
    (p) => !existing.has(p.title.toLowerCase()),
  );
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const toggle = (title: string) =>
    setSelected((s) => ({ ...s, [title]: !s[title] }));

  const chosen = available.filter((p) => selected[p.title]);

  const add = () => {
    if (chosen.length > 0) {
      addPresetChores(chosen, members.map((m) => m.id));
    }
    setSelected({});
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add from presets">
      {available.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-muted">
          You've already added all the presets. Nice and tidy.
        </p>
      ) : (
        <>
          <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
            {available.map((p) => (
              <button
                key={p.title}
                type="button"
                onClick={() => toggle(p.title)}
                aria-pressed={Boolean(selected[p.title])}
                className="focusable flex items-center gap-3 rounded border border-border px-3 py-2.5 text-left hover:border-ink"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border font-bold text-sm transition ${
                    selected[p.title]
                      ? "border-ink bg-ink text-white"
                      : "border-border"
                  }`}
                >
                  {selected[p.title] && "✓"}
                </span>
                <span className="flex-1 text-sm font-semibold text-ink">
                  {p.title}
                </span>
                <PriorityDot priority={p.priority} />
              </button>
            ))}
          </div>
          <button
            className="btn-primary mt-4 w-full"
            disabled={chosen.length === 0}
            onClick={add}
          >
            Add {chosen.length > 0 ? chosen.length : ""}{" "}
            {chosen.length === 1 ? "chore" : "chores"}
          </button>
        </>
      )}
    </Sheet>
  );
}
