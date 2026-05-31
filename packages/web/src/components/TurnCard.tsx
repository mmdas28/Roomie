import type { Chore, ChoreTurn } from "@roomie/core";
import { motion } from "framer-motion";
import { dueLabel } from "../lib/format.js";
import { useMemberLookup, turnStatus } from "../lib/selectors.js";
import { useStore } from "../store.js";
import { Avatar } from "./Avatar.js";
import { CheckIcon } from "./icons.js";
import { PriorityDot } from "./PriorityDot.js";

export function TurnCard({
  turn,
  chore,
}: {
  turn: ChoreTurn;
  chore: Chore;
}) {
  const lookup = useMemberLookup();
  const markDone = useStore((s) => s.markTurnDone);
  const currentId = useStore((s) => s.currentMemberId);

  const assignee = lookup(turn.assignedTo);
  const status = turnStatus(turn);
  const isMine = turn.assignedTo === currentId;
  const overdue = status === "overdue";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`card flex items-center gap-3 ${overdue ? "border-danger/30" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <PriorityDot priority={chore.priority} />
          <h3 className="truncate font-semibold text-ink">{chore.title}</h3>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-sm text-ink-muted">
          {assignee && <Avatar member={assignee} size="sm" />}
          <span className="truncate">
            {isMine ? "Your turn" : assignee?.displayName ?? "Unassigned"}
          </span>
          <span aria-hidden="true">·</span>
          <span className={overdue ? "font-medium text-danger" : ""}>
            {dueLabel(turn.dueDate)}
          </span>
        </div>
        {turn.assignedDespiteUnavailable && (
          <p className="mt-1 text-xs text-pending">
            Everyone's away — assigned anyway. Swap if you need to.
          </p>
        )}
        {!turn.assignedDespiteUnavailable && turn.skippedOver.length > 0 && (
          <p className="mt-1 text-xs text-ink-muted">
            Skipped {turn.skippedOver.length}{" "}
            {turn.skippedOver.length === 1 ? "roommate who's" : "roommates who're"}{" "}
            away
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => markDone(turn.id)}
        className="focusable flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/30 text-accent transition hover:bg-accent hover:text-white active:scale-95"
        aria-label={`Mark "${chore.title}" done`}
      >
        <CheckIcon className="h-5 w-5" />
      </button>
    </motion.div>
  );
}
