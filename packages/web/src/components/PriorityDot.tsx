import type { Priority } from "@roomie/core";

const STYLES: Record<Priority, { dot: string; label: string; text: string }> = {
  high: { dot: "bg-danger", label: "High", text: "text-danger" },
  medium: { dot: "bg-pending", label: "Medium", text: "text-pending" },
  low: { dot: "bg-ink-muted", label: "Low", text: "text-ink-muted" },
};

export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${STYLES[priority].dot}`}
      aria-hidden="true"
    />
  );
}

export function PriorityPill({ priority }: { priority: Priority }) {
  const s = STYLES[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
      <PriorityDot priority={priority} />
      {s.label}
    </span>
  );
}
