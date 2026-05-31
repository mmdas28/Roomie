import {
  type Priority,
  type ProposalPayload,
  computeAffectedMemberIds,
} from "@roomie/core";
import { useMemo, useState } from "react";
import {
  type FreqChoice,
  FREQ_LABELS,
  choiceToFreq,
  freqToChoice,
} from "../lib/frequency.js";
import { useActiveMembers, useMemberLookup } from "../lib/selectors.js";
import { useStore } from "../store.js";
import { MemberPicker } from "./MemberPicker.js";
import { Sheet } from "./Sheet.js";

const PRIORITIES: Priority[] = ["high", "medium", "low"];
const FREQS: FreqChoice[] = ["daily", "weekly", "biweekly"];

/**
 * View + edit a chore. Any change that affects other roommates is routed
 * through the consent engine (store.propose) — which auto-applies instantly
 * when no one else is affected, and otherwise creates a pending proposal.
 */
export function ChoreDetail({
  choreId,
  onClose,
}: {
  choreId: string;
  onClose: () => void;
}) {
  const chore = useStore((s) => s.chores.find((c) => c.id === choreId));
  const members = useActiveMembers();
  const lookup = useMemberLookup();
  const currentId = useStore((s) => s.currentMemberId);
  const propose = useStore((s) => s.propose);
  const proposals = useStore((s) => s.proposals);

  const [title, setTitle] = useState(chore?.title ?? "");
  const [priority, setPriority] = useState<Priority>(chore?.priority ?? "medium");
  const [freq, setFreq] = useState<FreqChoice>(
    chore ? freqToChoice(chore.frequency) : "weekly",
  );
  const [rotation, setRotation] = useState<string[]>(
    chore?.rotationMemberIds ?? [],
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const pending = proposals.find(
    (p) =>
      p.status === "pending" &&
      "choreId" in p.payload &&
      p.payload.choreId === choreId,
  );

  // Preview who'd need to approve the pending edits, given current selections.
  const editPayload: ProposalPayload | null = useMemo(() => {
    if (!chore) return null;
    const changes: Record<string, unknown> = {};
    if (title.trim() && title.trim() !== chore.title) changes.title = title.trim();
    if (priority !== chore.priority) changes.priority = priority;
    const newFreq = choiceToFreq(freq);
    if (freqToChoice(chore.frequency) !== freq) changes.frequency = newFreq;
    if (Object.keys(changes).length === 0) return null;
    return { type: "chore_edit", choreId, changes } as ProposalPayload;
  }, [chore, title, priority, freq, choreId]);

  const rotationChanged =
    chore &&
    (rotation.length !== chore.rotationMemberIds.length ||
      rotation.some((id, i) => chore.rotationMemberIds[i] !== id));

  const rotationPayload: ProposalPayload | null =
    chore && rotationChanged && rotation.length > 0
      ? { type: "chore_rotation_change", choreId, rotationMemberIds: rotation }
      : null;

  if (!chore) return null;

  const affectedCount = (payload: ProposalPayload | null): number => {
    if (!payload || !currentId) return 0;
    return computeAffectedMemberIds(payload, {
      proposerId: currentId,
      members,
      chore,
      newRotationMemberIds:
        payload.type === "chore_rotation_change"
          ? payload.rotationMemberIds
          : undefined,
    }).length;
  };

  const submit = (payload: ProposalPayload | null) => {
    if (!payload) return;
    const affected = affectedCount(payload);
    propose(payload);
    if (affected > 0) {
      setSent(`Sent to ${affected} ${affected === 1 ? "roommate" : "roommates"} for approval.`);
    } else {
      onClose();
    }
  };

  const editAffected = affectedCount(editPayload);
  const rotationAffected = affectedCount(rotationPayload);

  return (
    <Sheet open onClose={onClose} title={chore.title}>
      {pending && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-pending/10 px-3 py-2 text-sm text-pending">
          <span aria-hidden="true">⏳</span>
          Waiting on{" "}
          {pending.affectedMemberIds
            .map((id) => lookup(id)?.displayName.split(" ")[0])
            .filter(Boolean)
            .join(", ")}
        </div>
      )}

      {sent ? (
        <div className="py-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-2xl">
            📨
          </div>
          <p className="text-sm text-ink">{sent}</p>
          <button className="btn-primary mt-5 w-full" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto pb-2">
          <label className="block text-sm font-medium text-ink">
            Title
            <input
              className="input mt-1.5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Priority</p>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <Chip key={p} on={priority === p} onClick={() => setPriority(p)}>
                  {p[0].toUpperCase() + p.slice(1)}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">How often</p>
            <div className="grid grid-cols-3 gap-2">
              {FREQS.map((f) => (
                <Chip key={f} on={freq === f} onClick={() => setFreq(f)}>
                  {FREQ_LABELS[f]}
                </Chip>
              ))}
            </div>
          </div>

          {editPayload && (
            <button className="btn-primary w-full" onClick={() => submit(editPayload)}>
              {editAffected > 0
                ? `Propose changes · ${editAffected} to approve`
                : "Save changes"}
            </button>
          )}

          <hr className="border-black/5" />

          <div>
            <p className="text-sm font-medium text-ink">Who's in the rotation</p>
            <p className="mb-2 text-xs text-ink-muted">
              Changing this needs the okay of everyone involved.
            </p>
            <MemberPicker
              members={members}
              selected={rotation}
              onToggle={(id) =>
                setRotation((r) =>
                  r.includes(id) ? r.filter((x) => x !== id) : [...r, id],
                )
              }
            />
            {rotationPayload && (
              <button
                className="btn-ghost mt-3 w-full"
                onClick={() => submit(rotationPayload)}
              >
                {rotationAffected > 0
                  ? `Propose rotation · ${rotationAffected} to approve`
                  : "Update rotation"}
              </button>
            )}
          </div>

          <hr className="border-black/5" />

          {!confirmDelete ? (
            <button
              className="text-sm font-medium text-danger"
              onClick={() => setConfirmDelete(true)}
            >
              Delete this chore
            </button>
          ) : (
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-3">
              <p className="text-sm text-ink">
                Delete “{chore.title}”?{" "}
                {affectedCount({ type: "chore_delete", choreId }) > 0
                  ? "Your roommates will need to approve."
                  : "This can't be undone."}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  className="btn-ghost flex-1"
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep it
                </button>
                <button
                  className="btn flex-1 bg-danger text-white"
                  onClick={() => submit({ type: "chore_delete", choreId })}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`focusable rounded-xl border px-2 py-2.5 text-sm font-medium transition active:scale-[0.98] ${
        on ? "border-accent bg-accent-soft text-accent-ink" : "border-black/10 bg-white text-ink"
      }`}
    >
      {children}
    </button>
  );
}
