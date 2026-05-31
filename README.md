# Roomie

> Living together, easy.

Roomie is an open-source app for roommates to coordinate **chores, schedules,
and shared-living logistics** — fairly. It's a shared household calendar plus a
fair rotation engine, not a manager-assigns-tasks tool. Everyone is a peer.

The defining idea: **no hierarchy.** A household is a "party" with a join code.
One person owns it for administrative purposes, but the owner _cannot_
unilaterally change things that affect other people — chore turns, rotations,
or anyone else's schedule. Changes that affect others go through a lightweight
**consent/proposal** flow: one tap to approve, no bureaucracy.

---

## Status

**Phase 1 — Web MVP.** A responsive, mobile-UI-first web app backed by a
platform-agnostic TypeScript core. Runs fully offline (localStorage); no backend
or account required yet. See the [build plan](#roadmap) for what's next.

## Why it's built this way

The product's rules — fair rotation, the anti-hierarchy consent model — are the
valuable part, so they live in a **pure, framework-free core** (`@roomie/core`)
that is unit-tested in isolation and shared across every platform. The web app
is a thin React client on top of it; the planned iOS and Android ports reuse the
same core, so the logic that makes Roomie _fair_ is written once.

```
packages/
  core/   @roomie/core — models, rotation engine, consent engine (no DOM/React)
  web/    @roomie/web   — React + Vite + Tailwind + Framer Motion client
```

## Quick start

Requires **Node ≥ 20** and **pnpm**.

```bash
pnpm install        # install the workspace
pnpm test           # run the core unit tests (rotation + consent rules)
pnpm dev            # start the web app at http://localhost:5173
```

Other useful scripts:

```bash
pnpm build          # build core, then the web bundle
pnpm typecheck      # typecheck every package
```

There are **no secrets or environment variables** required to run Phase 1.

## How it works

### The rotation engine

Each chore has an ordered rotation of members and a pointer to whose turn is
next. When a turn is due, the engine walks the rotation from the current pointer
and assigns the first member who is **active and available** on that date,
recording anyone skipped for being away. A skipped person keeps their place —
their turn slides past that one instance, and no one downstream gets a double
turn. If _everyone_ is away, the turn-holder is assigned anyway and flagged so
they can swap. See [`packages/core/src/engine/rotation.ts`](packages/core/src/engine/rotation.ts).

### The consent engine

Anything that affects other roommates — editing a shared chore, changing who's
in a rotation, deleting a chore, removing a member — becomes a **proposal**. The
"relevant people" (everyone affected, never including the proposer) get a simple
approve/decline. The change only applies once everyone approves; a single
decline closes it. Proposals auto-expire at the lesser of a time window or the
next affected chore's due date.

Notable rules ([`packages/core/src/engine/consent.ts`](packages/core/src/engine/consent.ts)):

- **You can't veto your own removal**, but removing someone still needs _every
  other_ active member's approval — so no one (not even the owner) can remove a
  roommate unilaterally.
- **Leaving is always your right** — no proposal needed to remove yourself.
- When a member leaves, their proposals are cancelled, they're dropped from the
  affected set of others' proposals (which may then resolve), and they're
  stripped from every rotation with the pointer re-normalized.

These rules are covered by unit tests in [`packages/core/tests`](packages/core/tests).

## Design

White theme, lots of whitespace, one calm sage-green accent, system fonts, and
tasteful motion. Mobile-UI-first: a single-column, bottom-tab layout that feels
like a native app and centers to a phone-width column on desktop. Accessible by
default — keyboard focus rings, labels, reduced-motion support.

## Roadmap

- **Phase 1 — Web MVP** ✅ — core engine + offline web app _(you are here)_
- **Phase 2 — Backend & real multiplayer** — Express + Drizzle, accounts, real
  join codes and owner approval across devices, owner permission toggles
- **Phase 3 — Polish & PWA** — web push reminders, swap-my-turn, fairness stats
- **Phase 4 — Native** — Expo (iOS + Android) reusing `@roomie/core`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: the core's rotation and consent
logic is pure and must stay that way — add tests for any change to it.

## License

[MIT](LICENSE) © Roomie contributors
