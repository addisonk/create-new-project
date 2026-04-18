---
name: create-new-project
description: One-shot scaffold for a new cross-platform product — Next.js + shadcn/ui (web) and/or Expo + NativeWind v5 + react-native-reusables + @expo/ui (mobile), wired into a single pnpm monorepo. The LLM orchestrates questions and environment checks; everything file-level is vendored as templates + scripts so runs are deterministic.
---

# Create New Project

Scaffold a Next.js + shadcn monorepo, an Expo mobile app, and a design-system viewer — together or individually — with one shell command.

## When to Use

Use when the user wants to start a new project — a marketing site, a mobile app, or both. Default is **both** (the primary use case).

## Design principle — LLM orchestrates, scripts execute

Every deterministic file write is in `templates/` and every deterministic transform is in `scripts/`. The LLM's job is narrow:

1. Run preflight checks (diagnostic, adapts to user's environment).
2. Ask the user 3 questions (project name, platform, preset).
3. Invoke `scripts/bootstrap.mjs` with the answers.
4. Report next steps.

Do NOT copy template content into prose and ask the model to reproduce it — that reintroduces drift. If a new template file is needed, add it under `templates/` and extend `bootstrap.mjs`.

## Interaction Method

**IMPORTANT:** Gather all inputs via the `AskUserQuestion` tool. Do NOT print questions as plain text — use the tool so the user gets a proper interactive prompt. One question at a time.

## Prerequisite skills

Not required to run, but worth reading for context on what the mobile templates assume:

- `expo-tailwind-setup` — NativeWind v5 + Tailwind v4 CSS-first recipe
- `react-native-reusables` — shadcn-philosophy components for React Native
- `expo-ui-swiftui` / `expo-ui-jetpack-compose` — native primitives
- `building-native-ui` — Expo Router conventions
- `native-data-fetching` — use `expo/fetch` over axios

## Steps

### Step 0 — Preflight check

Run these checks in parallel and collect failures into a single report. Don't proceed to Step 1 until everything passes.

**Universal (all paths):**
- `command -v pnpm && pnpm --version` — need pnpm 10.x. Fix: `corepack enable && corepack prepare pnpm@10 --activate`
- `command -v gh` — needed to clone the design-system viewer. Fix: `brew install gh`
- `node -v` — Node 20+. Fix: `brew install node@20` or nvm
- `command -v git` — Fix: `xcode-select --install`

**Mobile (both / mobile paths):**
- `xcode-select -p` — must print a path. Fix: install Xcode from the App Store, then `sudo xcode-select --install`.
- `xcodebuild -version` — extract Xcode's **major.minor** (e.g. `26.4`).
- `xcrun simctl list runtimes -j` — parse JSON; require a runtime whose `version` matches Xcode's **exact major.minor**. Near-misses fail `xcodebuild` later with `Unable to find a destination`. Fix: `xcodebuild -downloadPlatform iOS` (~8 GB, 15–20 min).
- `xcrun simctl list devices available -j` — require at least one device on the matching runtime.

If ANY check fails: stop, report ALL failures in a single block, give each fix command, tell the user to re-run the skill once fixed. Don't start scaffolding with a known-broken environment.

### Step 1 — Collect inputs via AskUserQuestion

Ask in order (skip a question if the value was already provided in the slash-command args):

1. **Project name** — e.g. `my-app`
2. **Platform** — `Both (recommended)` / `Web only` / `Mobile only`
3. **Preset** — accept a shadcn preset ID, a full `https://ui.shadcn.com/create?preset=...` URL (extract the ID), or press enter for the default (`b0`)
4. **Parent directory** — if `~/Projects/` exists, default to it without asking. Otherwise ask.

If the user's preset input looks malformed (non-alphanumeric, whitespace, etc.), confirm once via AskUserQuestion before proceeding — don't silently guess.

### Step 2 — Invoke the bootstrap script

Run:

```bash
node "$SKILL_DIR/scripts/bootstrap.mjs" \
  --name "<name>" \
  --parent "<parent>" \
  --platform both|web|mobile \
  --preset "<preset-id>"
```

Where `$SKILL_DIR` is this skill's base directory (the one containing `SKILL.md`). The script:

1. Runs `pnpm dlx shadcn init --monorepo` (web + packages/ui + turbo.json)
2. Installs all ~55 shadcn components
3. Clones the design-system viewer into `apps/design-system/`
4. Runs `patch-design-system.mjs` (style sync, font sync, 2s dev delay)
5. Scaffolds the Expo app (if mobile), pins SDK 55, installs NativeWind v5 + reusables + @expo/ui + lucide
6. Overlays `templates/mobile/*` onto `apps/mobile/` via `install-mobile-templates.mjs`
7. Copies root `.npmrc` + `tsconfig.base.json` from `templates/root/`
8. Creates `packages/shared/` placeholder
9. Vendors `scripts/sync-mobile-tokens.mjs` into the project
10. Patches root `package.json` (dev scripts + pnpm overrides) via `patch-root-package.mjs`
11. `pnpm install`, `pnpm sync:tokens` (generates mobile `global.css`)
12. `git init` + first commit

Stream the script's output. If it errors, surface the last ~50 lines.

### Step 3 — Report next steps

Show the user:

- Project path, structure tree, component counts (web: count `packages/ui/src/components/*.tsx`, mobile: `apps/mobile/components/ui/*.tsx`)
- **Both / mobile paths:** first run of the mobile app MUST be `npx expo run:ios` inside `apps/mobile/` — `@expo/ui` needs a custom dev client and won't work in Expo Go. After that, `pnpm dev` from the repo root starts everything (web + mobile + design-system) with mobile attached to the built dev client.
- **Both / web paths:** `pnpm dev:web` / `pnpm dev:design-system` for solo runs.

## Repository layout

```
.claude/skills/create-new-project/
├── SKILL.md                  ← this file (thin orchestration layer)
├── scripts/
│   ├── bootstrap.mjs         ← main orchestrator (shell + node, no LLM)
│   ├── patch-root-package.mjs
│   ├── patch-design-system.mjs
│   ├── install-mobile-templates.mjs
│   └── sync-mobile-tokens.mjs  ← also vendored into the scaffolded project
└── templates/
    ├── root/                 ← .npmrc, tsconfig.base.json
    ├── shared/               ← packages/shared placeholder
    └── mobile/
        ├── postcss.config.mjs
        ├── components.json
        ├── tsconfig.json
        ├── metro.config.js
        ├── lib/utils.ts
        ├── tw/index.tsx       ← uses styled() from react-native-css
        └── app/
            ├── _layout.tsx     ← OS-driven dark mode, PortalHost
            └── (tabs)/
                ├── _layout.tsx  ← NativeTabs (liquid glass on iOS 26+)
                ├── index.tsx    ← Home: pure @expo/ui SwiftUI primitives
                ├── explore.tsx  ← Browse: Card feed with lucide icons
                └── settings.tsx ← iOS-style grouped rows
```

Note: `templates/mobile/components/ui/` intentionally does NOT contain `text.tsx` / `button.tsx`. The reusables CLI's bulk install (`yes | npx @react-native-reusables/cli add -a -y -o`) writes canonical versions of these files directly, and layering our stubs on top has historically been a drift source. Everything else in `templates/mobile/` overlays cleanly.

## Known sharp edges

- **Expo in pnpm monorepo:** the root `pnpm.overrides` + `packageExtensions` + `.npmrc shamefully-hoist=true` are all required. `patch-root-package.mjs` + `templates/root/.npmrc` handle this.
- **NativeWind v5 oklch text bug:** pinned to `nativewind@5.0.0-preview.3` + `react-native-css@^3.0.7`. If text renders invisible on first launch, import `Text` from `react-native` directly and use inline style for colors (workaround only).
- **`@expo/ui` + Expo Go:** incompatible. First mobile run must be `npx expo run:ios` (not `expo start`). For subsequent `pnpm dev` runs, mobile's `dev` script uses `expo start --ios --dev-client` — the `--dev-client` flag is critical; plain `--ios` tries to open the Expo Go URL scheme and fails.
- **`lucide-react-native` under pnpm strict hoisting:** installed explicitly in bootstrap because the reusables CLI doesn't always land it in `apps/mobile/node_modules`. Without the explicit install, Metro's first bundle fails to resolve `lucide-react-native`.
- **Port 3000 race between web and design-system:** both default to 3000. `patch-design-system.mjs` adds a 2s `sleep` to design-system's `dev` script so web always claims the lowest free port first. Don't pin explicit ports — users often have other projects holding 3000/3001.
- **Xcode ↔ iOS SDK exact-version match:** Xcode `X.Y` requires iOS `X.Y` simulator runtime, not just `X.*`. Preflight checks this.
