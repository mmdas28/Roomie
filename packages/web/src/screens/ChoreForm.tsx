import type { Priority } from "@roomie/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MemberPicker } from "../components/MemberPicker.js";
import { useActiveMembers } from "../lib/selectors.js";
import { useStore } from "../store.js";

const PRIORITIES: { value: Priority; label: string; hint: string }[] = [
  { value: "high", label: "High", hint: "daily" },
  { value: "medium", label: "Medium", hint: "weekly" },
  { value: "low", label: "Low", hint: "now & then" },
];

/**
 * The deliberately minimal custom-add form (§8C): exactly three controls —
 * Chore, Priority, Assign to. Frequency is inferred from priority.
 */
export function ChoreForm() {
  const navigate = useNavigate();
  const addChore = useStore((s) => s.addChore);
  const members = useActiveMembers();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assignees, setAssignees] = useState<string[]>(members.map((m) => m.id));

  const toggle = (id: string) =>
    setAssignees((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const canAdd = title.trim().length > 0 && assignees.length > 0;

  const submit = () => {
    if (!canAdd) return;
    addChore({ title, priority, memberIds: assignees });
    navigate("/chores");
  };

  return (
    <div className="flex flex-col px-5 py-5">
      <div className="mb-6 flex items-center justify-between">
        <button
          className="focusable text-sm font-medium text-ink-muted"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h1 className="text-base font-semibold text-ink">New chore</h1>
        <span className="w-12" />
      </div>

      <label className="block text-sm font-medium text-ink">
        Chore
        <input
          className="input mt-1.5"
          placeholder="e.g. Water the plants"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </label>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-ink">Priority</legend>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              aria-pressed={priority === p.value}
              className={`focusable rounded-xl border px-2 py-3 text-center transition active:scale-[0.98] ${
                priority === p.value
                  ? "border-accent bg-accent-soft"
                  : "border-black/10 bg-white"
              }`}
            >
              <span className="block text-sm font-semibold text-ink">
                {p.label}
              </span>
              <span className="block text-xs text-ink-muted">{p.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <p className="text-sm font-medium text-ink">Assign to</p>
        <p className="mb-2 text-xs text-ink-muted">
          Everyone selected takes turns, in order.
        </p>
        <MemberPicker
          members={members}
          selected={assignees}
          onToggle={toggle}
        />
      </div>

      <button className="btn-primary mt-8 w-full" disabled={!canAdd} onClick={submit}>
        Add chore
      </button>
    </div>
  );
}
