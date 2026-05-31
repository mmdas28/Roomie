import { useState } from "react";
import { Avatar } from "../components/Avatar.js";
import { Sheet } from "../components/Sheet.js";
import { CheckIcon, CopyIcon, ShareIcon, XIcon } from "../components/icons.js";
import { useCurrentMember } from "../lib/selectors.js";
import { useStore } from "../store.js";

export function Party() {
  const party = useStore((s) => s.party);
  const members = useStore((s) => s.members);
  const me = useCurrentMember();
  const approveMember = useStore((s) => s.approveMember);
  const declineMember = useStore((s) => s.declineMember);
  const addRoommate = useStore((s) => s.addRoommate);
  const removeMember = useStore((s) => s.removeMember);
  const propose = useStore((s) => s.propose);
  const renameParty = useStore((s) => s.renameParty);
  const regenerateJoinCode = useStore((s) => s.regenerateJoinCode);

  const [copied, setCopied] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  if (!party || !me) return null;

  const active = members.filter((m) => m.status === "active");
  const pending = members.filter((m) => m.status === "pending");
  const iAmOwner = me.role === "owner";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(party.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; the code is visible regardless */
    }
  };

  const share = async () => {
    const text = `Join our household "${party.name}" on Roomie with code ${party.joinCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Roomie", text });
      } catch {
        /* user dismissed */
      }
    } else {
      copyCode();
    }
  };

  const startRemove = (memberId: string) => {
    // Removing someone else needs everyone else's consent (§4a).
    propose({ type: "member_remove", targetMemberId: memberId });
    setRemoveTarget(null);
  };

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">{party.name}</h1>
        {iAmOwner && (
          <button
            className="text-sm font-medium text-accent"
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        )}
      </div>

      {/* Join code card */}
      <section className="card text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Join code
        </p>
        <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em] text-ink">
          {party.joinCode}
        </p>
        <p className="mt-1.5 text-xs text-ink-muted">
          Share this so roommates can join.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button className="btn-ghost flex-1" onClick={copyCode}>
            {copied ? <CheckIcon className="h-5 w-5" /> : <CopyIcon className="h-5 w-5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button className="btn-ghost flex-1" onClick={share}>
            <ShareIcon className="h-5 w-5" /> Share
          </button>
        </div>
      </section>

      {/* Pending requests */}
      {pending.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-ink">
            Wants to join ({pending.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {pending.map((m) => (
              <li key={m.id} className="card flex items-center gap-3 py-3">
                <Avatar member={m} />
                <span className="flex-1 font-medium text-ink">{m.displayName}</span>
                <button
                  className="focusable flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-ink-muted hover:bg-surface"
                  onClick={() => declineMember(m.id)}
                  aria-label={`Decline ${m.displayName}`}
                  disabled={!iAmOwner}
                >
                  <XIcon className="h-5 w-5" />
                </button>
                <button
                  className="focusable flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-ink disabled:opacity-40"
                  onClick={() => approveMember(m.id)}
                  aria-label={`Approve ${m.displayName}`}
                  disabled={!iAmOwner}
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
          {!iAmOwner && (
            <p className="mt-1 text-xs text-ink-muted">
              Only the owner approves new members.
            </p>
          )}
        </section>
      )}

      {/* Roster */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">
            Roommates ({active.length})
          </h2>
          <button
            className="text-sm font-medium text-accent"
            onClick={() => setAddOpen(true)}
          >
            Add roommate
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {active.map((m) => (
            <li key={m.id} className="card flex items-center gap-3 py-3">
              <Avatar member={m} />
              <div className="flex-1">
                <span className="font-medium text-ink">{m.displayName}</span>
                {m.id === me.id && (
                  <span className="ml-1 text-xs text-ink-muted">(you)</span>
                )}
              </div>
              {m.role === "owner" ? (
                <span className="text-xs font-medium text-ink-muted">Owner</span>
              ) : m.id === me.id ? (
                <button
                  className="text-xs font-medium text-danger"
                  onClick={() => removeMember(m.id)}
                >
                  Leave
                </button>
              ) : (
                <button
                  className="text-xs font-medium text-ink-muted hover:text-danger"
                  onClick={() => setRemoveTarget(m.id)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 px-2 text-center text-xs text-ink-muted">
        Roomie is peer-to-peer: the owner keeps the lights on, but can't change
        your chores or schedule without your say-so.
      </p>

      {/* Add roommate sheet (Phase 1 demo) */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add a roommate">
        <p className="mb-3 text-sm text-ink-muted">
          Normally roommates join with the code and you approve them. For now you
          can add them here directly.
        </p>
        <input
          className="input"
          placeholder="Their name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <div className="mt-4 flex flex-col gap-2">
          <button
            className="btn-primary w-full"
            disabled={!newName.trim()}
            onClick={() => {
              addRoommate(newName, "active");
              setNewName("");
              setAddOpen(false);
            }}
          >
            Add to household
          </button>
          <button
            className="btn-ghost w-full"
            disabled={!newName.trim()}
            onClick={() => {
              addRoommate(newName, "pending");
              setNewName("");
              setAddOpen(false);
            }}
          >
            Simulate a join request
          </button>
        </div>
      </Sheet>

      {/* Remove confirmation */}
      <Sheet
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title="Remove roommate"
      >
        <p className="text-sm text-ink">
          This asks every other roommate to approve. They can't be removed until
          everyone agrees — no one gets booted unilaterally.
        </p>
        <div className="mt-4 flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => setRemoveTarget(null)}>
            Cancel
          </button>
          <button
            className="btn flex-1 bg-danger text-white"
            onClick={() => removeTarget && startRemove(removeTarget)}
          >
            Propose removal
          </button>
        </div>
      </Sheet>

      {/* Owner settings */}
      <Sheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Household settings"
      >
        <label className="block text-sm font-medium text-ink">
          Household name
          <input
            className="input mt-1.5"
            defaultValue={party.name}
            onBlur={(e) => renameParty(e.target.value)}
          />
        </label>
        <button
          className="btn-ghost mt-4 w-full"
          onClick={() => {
            regenerateJoinCode();
          }}
        >
          Generate a new join code
        </button>
        <p className="mt-3 text-xs text-ink-muted">
          Owner controls are administrative only — they never override another
          roommate's chores or schedule.
        </p>
      </Sheet>
    </div>
  );
}
