import type { Proposal } from "@roomie/core";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Avatar } from "../components/Avatar.js";
import { EmptyState } from "../components/EmptyState.js";
import { CheckIcon, ClockIcon, XIcon } from "../components/icons.js";
import { expiresInLabel } from "../lib/format.js";
import {
  liveProposals,
  useCurrentMember,
  useMemberLookup,
} from "../lib/selectors.js";
import { useStore } from "../store.js";

export function Proposals() {
  const rawProposals = useStore((s) => s.proposals);
  const me = useCurrentMember();
  const proposals = liveProposals(rawProposals);

  if (!me) return null;

  const needsMe = proposals.filter(
    (p) =>
      p.status === "pending" &&
      p.affectedMemberIds.includes(me.id) &&
      p.votes[me.id] === undefined,
  );
  const mine = proposals.filter(
    (p) => p.status === "pending" && p.proposedBy === me.id,
  );
  const waiting = proposals.filter(
    (p) =>
      p.status === "pending" &&
      p.proposedBy !== me.id &&
      (p.votes[me.id] !== undefined || !p.affectedMemberIds.includes(me.id)),
  );
  const resolved = proposals
    .filter((p) => p.status !== "pending")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  const nothing =
    needsMe.length + mine.length + waiting.length + resolved.length === 0;

  return (
    <div className="px-4 py-5">
      <h1 className="mb-1 text-xl font-bold text-ink">Inbox</h1>
      <p className="mb-4 text-sm text-ink-muted">
        Changes that affect the household land here.
      </p>

      {nothing ? (
        <EmptyState
          emoji="✨"
          title="All clear"
          body="No decisions waiting. When someone proposes a change that affects you, you'll get a quick yes/no here."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {needsMe.length > 0 && (
            <Group title="Needs your okay">
              <AnimatePresence>
                {needsMe.map((p) => (
                  <VoteCard key={p.id} proposal={p} />
                ))}
              </AnimatePresence>
            </Group>
          )}

          {mine.length > 0 && (
            <Group title="You proposed">
              {mine.map((p) => (
                <MineCard key={p.id} proposal={p} />
              ))}
            </Group>
          )}

          {waiting.length > 0 && (
            <Group title="Waiting on others">
              {waiting.map((p) => (
                <StatusCard key={p.id} proposal={p} note="Pending other roommates" />
              ))}
            </Group>
          )}

          {resolved.length > 0 && (
            <Group title="Recently settled">
              {resolved.map((p) => (
                <StatusCard
                  key={p.id}
                  proposal={p}
                  note={
                    p.status === "approved"
                      ? "Approved"
                      : p.status === "declined"
                        ? "Declined"
                        : p.status === "expired"
                          ? "Expired"
                          : "Withdrawn"
                  }
                />
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-sm font-semibold text-ink">{title}</h2>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

function ProposerLine({ proposal }: { proposal: Proposal }) {
  const lookup = useMemberLookup();
  const proposer = lookup(proposal.proposedBy);
  return (
    <div className="flex items-center gap-2 text-xs text-ink-muted">
      {proposer && <Avatar member={proposer} size="sm" />}
      <span className="inline-flex items-center gap-1">
        <ClockIcon className="h-3.5 w-3.5" />
        {expiresInLabel(proposal.expiresAt)}
      </span>
    </div>
  );
}

function VoteCard({ proposal }: { proposal: Proposal }) {
  const vote = useStore((s) => s.vote);
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="card"
    >
      <p className="font-medium text-ink">{proposal.description}</p>
      <div className="mt-2">
        <ProposerLine proposal={proposal} />
      </div>

      {!declining ? (
        <div className="mt-4 flex gap-2">
          <button
            className="btn flex-1 border border-black/10 bg-white text-danger hover:bg-danger/5"
            onClick={() => setDeclining(true)}
          >
            <XIcon className="h-5 w-5" /> Not for me
          </button>
          <button
            className="btn flex-1 bg-accent text-white hover:bg-accent-ink"
            onClick={() => vote(proposal.id, "approve")}
          >
            <CheckIcon className="h-5 w-5" /> Looks good
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3"
        >
          <textarea
            className="input min-h-[64px] resize-none py-2"
            placeholder="Add a reason (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <button
              className="btn-ghost flex-1"
              onClick={() => {
                setDeclining(false);
                setNote("");
              }}
            >
              Back
            </button>
            <button
              className="btn flex-1 bg-danger text-white"
              onClick={() => vote(proposal.id, "decline", note)}
            >
              Decline
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function MineCard({ proposal }: { proposal: Proposal }) {
  const lookup = useMemberLookup();
  const withdraw = useStore((s) => s.withdrawProposal);
  const waitingOn = proposal.affectedMemberIds.filter(
    (id) => proposal.votes[id] === undefined,
  );

  return (
    <div className="card">
      <p className="font-medium text-ink">{proposal.description}</p>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span>Waiting on</span>
          <span className="flex -space-x-1.5">
            {waitingOn.map((id) => {
              const m = lookup(id);
              return m ? <Avatar key={id} member={m} size="sm" ring /> : null;
            })}
          </span>
        </div>
        <button
          className="text-xs font-medium text-ink-muted hover:text-danger"
          onClick={() => withdraw(proposal.id)}
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}

function StatusCard({ proposal, note }: { proposal: Proposal; note: string }) {
  const tone =
    proposal.status === "approved"
      ? "text-success"
      : proposal.status === "declined"
        ? "text-danger"
        : "text-ink-muted";
  return (
    <div className="card flex items-center justify-between gap-3 py-3 opacity-90">
      <p className="text-sm text-ink">{proposal.description}</p>
      <span className={`shrink-0 text-xs font-semibold ${tone}`}>{note}</span>
    </div>
  );
}
