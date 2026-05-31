import { isMemberUnavailable } from "@roomie/core";
import { AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Avatar } from "../components/Avatar.js";
import { EmptyState } from "../components/EmptyState.js";
import { TurnCard } from "../components/TurnCard.js";
import { dueLabel } from "../lib/format.js";
import {
  openTurns,
  useActiveMembers,
  useCurrentMember,
  turnStatus,
} from "../lib/selectors.js";
import { today } from "../lib/time.js";
import { useStore } from "../store.js";

export function Home() {
  const chores = useStore((s) => s.chores);
  const turns = useStore((s) => s.turns);
  const blocks = useStore((s) => s.blocks);
  const members = useActiveMembers();
  const me = useCurrentMember();

  const choreById = new Map(chores.map((c) => [c.id, c]));
  const open = openTurns(turns).filter((t) => choreById.has(t.choreId));

  const mine = open.filter((t) => t.assignedTo === me?.id);
  const overdue = open.filter((t) => turnStatus(t) === "overdue");
  const dueSoon = open.filter(
    (t) => turnStatus(t) !== "overdue" && t.assignedTo !== me?.id,
  );

  const awayToday = members.filter((m) =>
    isMemberUnavailable(m.id, today(), blocks),
  );

  const firstName = me?.displayName.split(" ")[0] ?? "there";

  if (chores.length === 0) {
    return (
      <EmptyState
        emoji="🌱"
        title={`Hey ${firstName}!`}
        body="Your household is set up. Add a few chores and Roomie will share them out fairly."
        action={
          <Link to="/chores" className="btn-primary">
            Add chores
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Hey {firstName} 👋</h1>
        <p className="text-sm text-ink-muted">Here's what's happening at home.</p>
      </div>

      {awayToday.length > 0 && (
        <section className="rounded-2xl bg-accent-soft px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-ink">
            Away today
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {awayToday.map((m) => (
              <span key={m.id} className="flex items-center gap-1.5 text-sm text-ink">
                <Avatar member={m} size="sm" /> {m.displayName.split(" ")[0]}
              </span>
            ))}
          </div>
        </section>
      )}

      <Section title="Your turns" count={mine.length} empty="You're all caught up. Nice.">
        <AnimatePresence>
          {mine.map((t) => (
            <TurnCard key={t.id} turn={t} chore={choreById.get(t.choreId)!} />
          ))}
        </AnimatePresence>
      </Section>

      {overdue.length > 0 && (
        <Section title="Overdue">
          <AnimatePresence>
            {overdue.map((t) => (
              <TurnCard key={t.id} turn={t} chore={choreById.get(t.choreId)!} />
            ))}
          </AnimatePresence>
        </Section>
      )}

      {dueSoon.length > 0 && (
        <Section title="Coming up">
          <AnimatePresence>
            {dueSoon.slice(0, 6).map((t) => (
              <TurnCard key={t.id} turn={t} chore={choreById.get(t.choreId)!} />
            ))}
          </AnimatePresence>
        </Section>
      )}

      <p className="pb-2 text-center text-xs text-ink-muted">
        Next up after this:{" "}
        {open[0] ? dueLabel(open[0].dueDate).toLowerCase() : "nothing scheduled"}.
      </p>
    </div>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count?: number;
  empty?: string;
  children: React.ReactNode;
}) {
  const isEmpty = count === 0;
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-semibold text-ink">{title}</h2>
      {isEmpty && empty ? (
        <p className="rounded-2xl border border-dashed border-black/10 px-4 py-6 text-center text-sm text-ink-muted">
          {empty}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">{children}</div>
      )}
    </section>
  );
}
