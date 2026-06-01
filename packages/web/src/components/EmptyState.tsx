import { motion } from "framer-motion";
import type { ReactNode } from "react";

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
      transition={{ duration: 0.15 }}
      className="flex flex-col items-center px-6 py-16 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-surface text-2xl">
        <span aria-hidden="true">{emoji}</span>
      </div>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-xs text-sm text-ink-muted">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
