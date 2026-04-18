# Create New Project

A Claude Code plugin that scaffolds a full cross-platform product in one shot — Next.js + shadcn/ui on the web side, Expo + NativeWind v5 + react-native-reusables + `@expo/ui` on the mobile side, and a design-system viewer — all wired into a single pnpm monorepo.

Invoke with `/create-new-project` and answer three questions: project name, platforms, shadcn preset. Everything else is deterministic.

## Philosophy

**Scripts execute, the LLM orchestrates.**

Scaffolding is a deterministic task. When an LLM has to faithfully reproduce config files, JSON merges, and component code on every run, drift creeps in — wrong paths, dropped function arguments, lost `package.json` scripts. This plugin narrows the LLM's job to three things:

1. Check the environment (adapts to the user's machine).
2. Collect inputs through interactive prompts.
3. Invoke one shell script that does everything else.

Every file that gets written is a template vendored in this repo. Every transform (package.json merges, font sync, token sync, style sync) is a Node script. No freehand regeneration, no "manually copy these fields," no "carefully reproduce this file."

## Install

### Claude Code

```bash
/plugin marketplace add addisonk/create-new-project
/plugin install create-new-project@create-new-project
```

Then invoke with:

```
/create-new-project
```

### System requirements

Checked automatically via preflight — the plugin stops and tells you what to fix if anything's missing.

**Universal:**
- **Node 20+** — `node -v`
- **pnpm 10** — `corepack enable && corepack prepare pnpm@10 --activate`
- **gh CLI** — `brew install gh` (clones the design-system viewer)
- **git**

**Mobile paths (Both / Mobile only):**
- **Xcode** — from the Mac App Store, then `sudo xcode-select --install`
- **iOS simulator runtime matching your Xcode version exactly.** Xcode `26.4` requires iOS `26.4` simulator — having only an older runtime like iOS `18.6` is not enough. Xcode needs a matching SDK to compile.
  - CLI install: `xcodebuild -downloadPlatform iOS` (~8 GB, 15–20 min)
  - Or: Xcode → Settings → Platforms → `+` → iOS

## Usage

```
/create-new-project
```

The skill asks:

1. **Project name** — e.g. `my-app`
2. **Platform** — `Both` (web + mobile monorepo, recommended), `Web only`, `Mobile only`
3. **Preset** — shadcn preset ID or full `https://ui.shadcn.com/create?preset=...` URL. Default: `b0`.

The scaffold runs in one pass. First mobile run needs a custom dev client build (because `@expo/ui` isn't Expo Go-compatible):

```bash
cd {name}/apps/mobile
npx expo run:ios
```

After that, `pnpm dev` from the repo root starts web + mobile + design-system together.

## Updating

```
/plugin marketplace update create-new-project
```

Updates only trigger when the `version` field bumps in `.claude-plugin/plugin.json` — commits alone don't trigger them. Check [releases](https://github.com/addisonk/create-new-project/releases) for what's in each version.

## What you get

### Both (default)

```
{name}/
├── apps/
│   ├── web/              # Next.js 16 + shadcn/ui + Turbopack
│   ├── mobile/           # Expo SDK 55 + NativeWind v5 + reusables + @expo/ui
│   └── design-system/    # Theme tinker, block explorer, color/font editors
│                         # (saves changes back to packages/ui globals.css)
├── packages/
│   ├── ui/               # 55+ shadcn components (web)
│   ├── shared/           # Cross-platform types / utilities
│   ├── eslint-config/
│   └── typescript-config/
├── scripts/sync-mobile-tokens.mjs  ← web oklch → mobile hex
├── turbo.json
├── pnpm-workspace.yaml
├── .npmrc                # shamefully-hoist=true for Expo
└── package.json          # pnpm overrides + packageExtensions
```

Run:

- `pnpm dev` — all three apps in parallel (web + mobile + design-system)
- `pnpm dev:web` — web only
- `pnpm dev:design-system` — design-system only
- `cd apps/mobile && npx expo run:ios` — first-time mobile build (required)
- `pnpm dev:mobile` — after first run

### Web only

Next.js + shadcn monorepo with the design-system viewer, no mobile. `pnpm dev` for the main app, `pnpm dev:design-system` for the viewer.

### Mobile only

Standalone Expo app with Expo Router, NativeWind v5, reusables, and `@expo/ui`. No monorepo. `npx expo run:ios` first, then `pnpm dev`.

## Mobile starter screens

The mobile app ships with a three-tab starter that demonstrates both halves of the stack:

- **Home** — pure `@expo/ui` SwiftUI primitives. SF Symbol grid, system fonts, liquid-glass-ready. Demonstrates the fully-native escape hatch.
- **Browse** — Cards + lucide icons using NativeWind + reusables. Demonstrates the cross-platform path (covers ~90% of screens).
- **Settings** — iOS-style grouped rows with Avatar, Badge, Separator.

OS-driven dark mode via `useColorScheme()`. NativeTabs for iOS 26+ liquid glass on iOS, Material 3 bottom nav on Android.

## Design-system viewer

Lives at `apps/design-system/` in the scaffolded project. It visualizes your shadcn monorepo's design system and lets you edit themes live — changes save back to `packages/ui/src/styles/globals.css`.

**What it shows**
- **Typography** — font name, Aa specimen, weights, character overview per font
- **Color Palette** — primary grid with foreground labels, utility colors with WCAG auto-contrast, charts, sidebar
- **Radius** — visual scale from none to 4xl, resolved from theme
- **Blocks** — shadcn preview 01 / 02 masonry grid

**Features**
- **Press D** — toggle dark mode
- Click-to-edit color pickers with a sticky save bar
- Inline font editing via Command palette (Figma-style hover hints)
- **Section filter** — `?section=color` URL param
- **Auto-contrast** — WCAG contrast with alpha compositing
- **Dynamic icons** — reads `iconLibrary` from `components.json`

**Manual install (outside the plugin)**

```bash
gh repo clone addisonk/create-new-project apps/design-system -- --depth 1
rm -rf apps/design-system/.git
pnpm install
pnpm --filter design-system dev
```

## Sharp edges

The scaffold handles these automatically — worth knowing so you don't wonder why things are the way they are:

- **Expo in pnpm monorepo** — the root `pnpm.overrides` + `packageExtensions` + `.npmrc shamefully-hoist=true` are all required. Without all three, mobile resolution fails.
- **`@expo/ui` + Expo Go** — incompatible. First mobile run must be `npx expo run:ios`. Afterwards, mobile's `dev` script uses `expo start --ios --dev-client` — without `--dev-client` it tries to open the Expo Go URL scheme and fails with `xcrun simctl openurl ... exited with non-zero code: 60`.
- **Port 3000 race** — web and design-system both default to port 3000. Scaffold adds a 2s `sleep` to design-system's dev script so web always claims the lowest free port first. Auto-fallback preserved so nothing collides with other projects on your machine.
- **`lucide-react-native` under pnpm strict hoisting** — the reusables CLI doesn't always hoist it into `apps/mobile/node_modules`. Scaffold installs it explicitly.
- **Xcode ↔ iOS SDK exact-version match** — preflight enforces `major.minor` match (not just `major.*`), because `xcodebuild` fails with `Unable to find a destination` otherwise.

## Local development

For editing this plugin and testing changes immediately:

```bash
# one-time setup
git clone git@github.com:addisonk/create-new-project.git ~/Projects/create-new-project
ln -s ~/Projects/create-new-project/skills/create-new-project ~/.claude/skills/create-new-project
```

The symlink means edits under `skills/create-new-project/` are picked up immediately by Claude Code — no reinstall needed.

Repo layout:

```
.
├── .claude-plugin/
│   ├── plugin.json          ← plugin manifest (bump version to ship updates)
│   └── marketplace.json     ← self-hosted marketplace catalog
└── skills/create-new-project/
    ├── SKILL.md             ← thin orchestration layer
    ├── scripts/
    │   ├── bootstrap.mjs                ← main orchestrator
    │   ├── patch-root-package.mjs       ← merges pnpm overrides
    │   ├── patch-design-system.mjs      ← style + font sync, stagger dev
    │   ├── install-mobile-templates.mjs ← overlays mobile templates
    │   └── sync-mobile-tokens.mjs       ← oklch → hex for RN
    └── templates/
        ├── root/            ← .npmrc, tsconfig.base.json
        ├── shared/          ← packages/shared placeholder
        └── mobile/          ← postcss, metro, tsconfig, tw/, welcome screens
```

### Shipping an update

1. Make changes under `skills/create-new-project/`.
2. Test locally (symlink means no reinstall).
3. Bump `version` in **both** `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.
4. Commit and push. Users get it on their next `/plugin marketplace update`.

## Prerequisite skills

The mobile path treats these Claude skills as source of truth. If you're on the Both or Mobile path and haven't installed them, quality drops:

- [`expo-tailwind-setup`](https://github.com/addisonk/ak-skills) — NativeWind v5 + Tailwind v4 CSS-first recipe
- [`react-native-reusables`](https://github.com/addisonk/ak-skills) — shadcn-philosophy components for React Native
- [`expo-ui-swiftui`](https://github.com/addisonk/ak-skills) — `@expo/ui` SwiftUI primitives (iOS)
- [`expo-ui-jetpack-compose`](https://github.com/addisonk/ak-skills) — `@expo/ui` Jetpack Compose primitives (Android)
- [`building-native-ui`](https://github.com/addisonk/ak-skills) — Expo Router conventions
- [`native-data-fetching`](https://github.com/addisonk/ak-skills) — network / data-fetching defaults

## License

MIT
