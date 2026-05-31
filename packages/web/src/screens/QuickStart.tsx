import { CHORE_PRESETS, type Priority } from "@roomie/core";
import { motion } from "framer-motion";
import { useState } from "react";
import { PriorityPill } from "../components/PriorityDot.js";
import { useActiveMembers } from "../lib/selectors.js";
import { useStore } from "../store.js";

/**
 * One-screen Quick start (§8B). Every common chore is toggled ON by default;
 * the owner unchecks what doesn't apply and adds them all in one tap.
 */
export function QuickStart() {
  const addPresetChores = useStore((s) => s.addPresetChores);
  const finish = useStore((s) => s.finishQuickStart);
  const members = useActiveMembers();

  const [selected, setSelected] = useState<boolean[]>(
    () => CHORE_PRESETS.map(() => true),
  );

  const chosen = CHORE_PRESETS.filter((_, i) => selected[i]);

  const grouped: { priority: Priority; label: string }[] = [
    { priority: "high", label: "Every day" },
    { priority: "medium", label: "Weekly" },
    { priority: "low", label: "Now and then" },
  ];

  const toggle = (i: number) =>
    setSelected((s) => s.map((v, idx) => (idx === i ? !v : v)));

  const addThem = () => {
    if (chosen.length > 0) {
      addPresetChores(
        chosen,
        members.map((m) => m.id),
      );
    }
    finish();
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-app flex-col px-5 pb-28 pt-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-ink">Quick start</h1>
        <p className="mt-1.5 text-ink-muted">
          We picked some common chores. Keep what fits, ditch the rest — you can
          always add more later.
        </p>
      </motion.div>

      <div className="mt-6 flex flex-col gap-6">
        {grouped.map(({ priority, label }) => (
          <section key={priority}>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-ink">{label}</h2>
              <PriorityPill priority={priority} />
            </div>
            <div className="flex flex-col gap-2">
              {CHORE_PRESETS.map((preset, i) =>
                preset.priority === priority ? (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => toggle(i)}
                    className="focusable flex items-center gap-3 rounded-xl border border-black/5 bg-white px-4 py-3 text-left shadow-card active:scale-[0.99]"
                    aria-pressed={selected[i]}
                  >
                    <Checkbox checked={selected[i]} />
                    <span className="flex-1 text-sm font-medium text-ink">
                      {preset.title}
                    </span>
                  </button>
                ) : null,
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-app border-t border-black/5 bg-white/95 px-5 py-4 backdrop-blur">
        <button className="btn-primary w-full" onClick={addThem}>
          {chosen.length > 0
            ? `Add ${chosen.length} ${chosen.length === 1 ? "chore" : "chores"}`
            : "Skip for now"}
        </button>
        {chosen.length > 0 && (
          <button
            className="mt-2 w-full text-center text-sm font-medium text-ink-muted"
            onClick={finish}
          >
            I'll add chores myself
          </button>
        )}
      </div>
    </div>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
        checked ? "border-accent bg-accent text-white" : "border-black/20 bg-white"
      }`}
      aria-hidden="true"
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 12.5 5 5 11-11" />
        </svg>
      )}
    </span>
  );
}
