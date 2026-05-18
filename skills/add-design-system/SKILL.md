---
name: add-design-system
description: Retrofit the design-system viewer app into an existing create-new-project-style pnpm monorepo (Next.js + shadcn/ui in apps/web, packages/ui present). Use when a project was scaffolded before this feature existed, or when the user wants to add apps/design-system to a compatible monorepo without re-scaffolding.
---

# Add Design System

Drop the design-system viewer (`apps/design-system`) into an existing monorepo that was scaffolded by `create-new-project`, or any monorepo that follows the same layout (Next.js + shadcn/ui in `apps/web`, `packages/ui` containing the shadcn components, pnpm workspaces).

## When to Use

Use when:

- The user explicitly says "add design-system", "add the design system viewer", "retrofit design-system", or similar.
- The user has an existing project (often one that pre-dates this feature in `create-new-project`) and wants the design-system viewer without re-running the full scaffold.

Don't use when starting a brand-new project — that's the `create-new-project` skill, which already includes the design-system viewer.

## Design principle — agent orchestrates, scripts execute

The agent's job is narrow:

1. Run universal preflight (pnpm / gh / node / git).
2. Ask the user for the target project root (default: current working directory).
3. Invoke `scripts/add.mjs` with `--root`.
4. Report next steps.

All preflight against the target monorepo (workspace markers, required files, "already installed?" idempotency) lives inside `add.mjs`, not here.

## Interaction Method

Gather inputs through the host agent's interactive user-input mechanism. In Claude Code, use `AskUserQuestion`. In Codex, use the available user-input flow when present; otherwise ask one concise question in chat and wait for the reply.

## Steps

### Step 0 — Universal preflight

Run these checks in parallel and collect failures into a single report. Don't proceed until all pass.

- `command -v pnpm && pnpm --version` — need pnpm 10.x. Fix: `corepack enable && corepack prepare pnpm@10 --activate`
- `command -v gh` — needed to clone the design-system viewer. Fix: `brew install gh`
- `node -v` — Node 20+. Fix: `brew install node@20` or nvm
- `command -v git` — Fix: `xcode-select --install`

If ANY check fails: stop, report ALL failures in a single block, give each fix command, tell the user to re-run the skill once fixed.

### Step 1 — Collect inputs

Ask once (skip if already provided in the skill invocation args):

1. **Project root** — absolute path to the monorepo root. Default to `process.cwd()` if it looks like a monorepo (has `pnpm-workspace.yaml`); otherwise ask. Tilde-expand if the user types `~/...`.

### Step 2 — Invoke the script

Run:

```bash
node "$SKILL_DIR/scripts/add.mjs" --root "<project-root>"
```

Where `$SKILL_DIR` is this skill's base directory (the one containing `SKILL.md`).

The script:

1. **Preflight against the target.** Bail with a clear message if any of these fail:
   - `package.json` exists at root
   - `pnpm-workspace.yaml` exists at root (monorepo marker)
   - `apps/web/app/layout.tsx` exists (font sync source)
   - `packages/ui/components.json` exists (shadcn target)
   - `packages/ui/src/styles/globals.css` exists (CSS patch target)
   - `apps/design-system/` does NOT already exist (idempotency — bail instead of clobbering)
2. Clones `addisonk/create-new-project` (depth 1) into `apps/design-system/`, removes its `.git`.
3. Runs the sibling skill's `patch-design-system.mjs` (syncs `style` + fonts from `apps/web`, adds `sleep 2` to the dev script).
4. Runs the sibling skill's `patch-ui-globals.mjs` (appends Tailwind safelist + `.ds-color-picker` overrides to `packages/ui/src/styles/globals.css`).
5. Adds a `dev:design-system` script to root `package.json` (only if not already present — doesn't touch other scripts).
6. Runs `pnpm install --no-frozen-lockfile` so the viewer's new deps resolve.

Stream the script's output. If it errors, surface the last ~50 lines.

### Step 3 — Report next steps

Show the user:

- Path: `<root>/apps/design-system/`
- Start it solo: `pnpm dev:design-system` (or `pnpm --filter design-system dev`)
- If the project uses turbo, `pnpm dev` will pick it up automatically.
- First load: port collision with `apps/web` is handled by a `sleep 2` in design-system's dev script (web claims the lowest free port first).

## Why this lives in a separate skill

`create-new-project` scaffolds a *new* monorepo end-to-end. Routing "I have an existing project, just add this one piece" through that skill would mean teaching `bootstrap.mjs` to skip large chunks of itself — error-prone and hard to test. Keeping retrofit features as single-purpose skills (this one, future `add-mobile`, future `add-shared-package`) keeps each path narrow and testable.

The shared atomic operations (`patch-design-system.mjs`, `patch-ui-globals.mjs`) already take `--root` and are idempotent, so this skill reuses them directly via a relative path into `../create-new-project/scripts/` rather than duplicating logic.
