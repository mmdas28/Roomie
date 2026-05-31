# Contributing to Roomie

Thanks for helping build Roomie! This is the official repo, so we keep things
tidy and well-tested.

## Setup

Requires Node ≥ 20 and pnpm.

```bash
pnpm install
pnpm test         # core unit tests
pnpm dev          # web app at http://localhost:5173
pnpm typecheck    # all packages
```

## Project layout

```
packages/core   @roomie/core — pure domain logic. NO DOM, React, or I/O.
packages/web    @roomie/web   — React client that consumes the core.
```

## Ground rules

1. **Keep the core pure.** `@roomie/core` must not import React, the DOM, or any
   runtime/platform API. It's shared across web and the future native ports.
2. **Test the rules.** The rotation engine and consent engine encode the
   fairness guarantees that define the product. Any change to them needs unit
   tests in `packages/core/tests`. Run `pnpm test` before pushing.
3. **Respect the anti-hierarchy model.** No feature should let one person
   override another's chores or schedule without consent. When in doubt, route
   the change through a proposal.
4. **Typed throughout.** No `any` without a good reason. `pnpm typecheck` must
   pass.
5. **Accessible UI.** Keyboard focus, labels, and sufficient contrast are not
   optional.

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`. Scope by package where
it helps, e.g. `feat(core): …` or `fix(web): …`.

## Pull requests

- Keep them focused and describe the change.
- Make sure `pnpm test` and `pnpm typecheck` pass.
- For UI changes, a screenshot or short clip is appreciated.
