import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Friendly empty state with a soft illustrated glyph, a headline, and copy.
 * Used on every screen's first-run state to keep cognitive load low.
 */
export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center px-6 py-16 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-3xl">
        <span aria-hidden="true">{emoji}</span>
      </div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-xs text-sm text-ink-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
