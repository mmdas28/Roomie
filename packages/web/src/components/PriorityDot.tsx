import type { Priority } from "@roomie/core";

/**
 * Priority reads in monochrome through SHAPE, not color:
 *   high   → filled black square  (urgent, dense)
 *   medium → filled grey circle   (present but softer)
 *   low    → outlined grey circle (barely there)
 */
const SHAPES: Record<Priority, string> = {
  high:   "h-2 w-2 rounded-[1px] bg-ink",
  medium: "h-2 w-2 rounded-full bg-ink/40",
  low:    "h-2 w-2 rounded-full border border-ink/30",
};

const LABELS: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-block shrink-0 ${SHAPES[priority]}`}
      aria-hidden="true"
    />
  );
}

export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
      <PriorityDot priority={priority} />
      {LABELS[priority]}
    </span>
  );
}
