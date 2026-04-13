# create-new-project

A Claude Code skill that scaffolds new cross-platform products — marketing site + iOS/Android app + shared design system — in a single command. Built on `shadcn/ui` for web, `react-native-reusables` + NativeWind v5 + `@expo/ui` for mobile, and a `pnpm` + Turborepo monorepo when you need both.

## Usage

Clone this repo and open it in Claude Code:

```bash
gh repo clone addisonk/create-new-project
cd create-new-project
claude
```

Tell Claude: **"create a new project"**.

Claude will ask (via interactive prompts):

1. Project name
2. Platforms — **Both** (web + mobile monorepo, default), **Web only**, or **Mobile only**
3. shadcn preset (for web)

It then scaffolds everything into `~/Projects/{name}/` and reports next steps.

## System requirements

The skill runs a preflight check before scaffolding and will stop if anything's missing. Required:

**Universal:**
- **Node 20+** — `node -v`
- **pnpm 10** — `corepack enable && corepack prepare pnpm@10 --activate`
- **gh CLI** — `brew install gh` (used to clone the design-system viewer)
- **git** — usually present; `xcode-select --install` if not

**Mobile (Both or Mobile-only paths):**
- **Xcode** — install from the Mac App Store, then run `sudo xcode-select --install`
- **At least one iOS Simulator runtime** — open Xcode → Settings → Components, install iOS (latest). About 3 GB.
- **Verify a device exists:** `xcrun simctl list devices available` should list at least one iPhone/iPad

If you skip the simulator step, the scaffold still finishes, but `npx expo run:ios` will fail at the very last step with `xcodebuild: error: Unable to find a destination`.

## Prerequisite skills

The mobile path treats these Claude skills as source of truth. Install them before running the scaffold on a mobile or "both" path, or the mobile quality drops:

- `expo-tailwind-setup` — NativeWind v5 + Tailwind v4 CSS-first recipe
- `react-native-reusables` — shadcn-philosophy components for React Native
- `expo-ui-swiftui` — `@expo/ui` SwiftUI primitives (iOS)
- `expo-ui-jetpack-compose` — `@expo/ui` Jetpack Compose primitives (Android)
- `building-native-ui` — Expo Router conventions
- `native-data-fetching` — network/data-fetching defaults

Web-only path has no extra prerequisites.

## What you get

### Both (default)

```
{name}/
├── apps/
│   ├── web/              # Next.js 16 + shadcn/ui (marketing site + web app)
│   ├── mobile/           # Expo SDK 55 + Expo Router + NativeWind v5 + reusables + @expo/ui
│   └── design-system/    # Web-only design system viewer
├── packages/
│   ├── ui/               # shadcn components (web)
│   └── shared/           # Empty placeholder for cross-platform types / API clients / utils
├── turbo.json
├── pnpm-workspace.yaml
└── package.json          # with pnpm overrides for Expo-in-monorepo
```

Run:

- `pnpm dev:web` — marketing site / web app
- `cd apps/mobile && npx expo run:ios` — first run (custom dev client required because `@expo/ui`)
- `pnpm dev:mobile` — after the first run
- `pnpm dev:design-system` — design system viewer

### Web only

```
{name}/
├── apps/
│   ├── web/              # Next.js 16 + shadcn/ui
│   └── design-system/    # Design system viewer
├── packages/
│   └── ui/               # shadcn components
├── turbo.json
└── pnpm-workspace.yaml
```

Run:

- `pnpm dev` — main app
- `pnpm --filter design-system dev` — viewer

### Mobile only

Standalone Expo app at `{name}/` with Expo Router, NativeWind v5, reusables components, and `@expo/ui`. No monorepo.

Run:

- `npx expo run:ios` — first run (custom dev client required)
- `pnpm dev` — after the first run

## Design system viewer

Lives at `apps/design-system/` in the monorepo (or at the root of this repo — it's the same Next.js app).

It visualizes your shadcn monorepo's design system: typography, colors, radius, and component blocks. Read-only, always-in-sync, for the web side.

### What it shows

- **Typography** — font name, Aa specimen, weights, character overview for each font (Body, Heading, Mono)
- **Color Palette** — primary grid with foreground labels, utility colors with WCAG auto-contrast, charts, sidebar
- **Radius** — visual scale from none to 4xl, resolved from theme
- **Blocks** — shadcn preview 01/02 masonry grid with a toggle, scrollable container

### Features

- **Press D** — toggle dark mode (next-themes)
- **Section filter** — `?section=color` URL param to view one section
- **Auto-contrast** — colorjs.io WCAG contrast with alpha compositing, readable labels on any color
- **Dynamic icons** — reads `iconLibrary` from `components.json`, imports the right package via React context

### One manual step: sync layout fonts

The skill handles this for you, but if you set up the viewer manually, copy the font imports from `apps/web/app/layout.tsx` into `apps/design-system/app/layout.tsx`. The fonts must match because `next/font` requires static imports.

Everything else is auto-detected:

- **Font names and labels** — parsed from `apps/web/app/layout.tsx` at build time
- **Icon library** — read from `packages/ui/components.json`, dynamically imported
- **Style** — read from `packages/ui/components.json`
- **Colors, radius** — from CSS theme variables
- **Blocks** — shadcn preview cards using `@workspace/ui` components

### Manual install (outside the skill)

```bash
gh repo clone addisonk/create-new-project apps/design-system -- --depth 1
rm -rf apps/design-system/.git
pnpm install
pnpm --filter design-system dev
```

### Viewer dependencies

- `next`
- `@workspace/ui`
- `next-themes`
- `recharts` (v3)
- `colorjs.io`
- `shadcn`
- `react-qr-code`
- `lucide-react` (default; swapped at runtime if `components.json` specifies another icon library)

### Viewer file structure

```
app/
  page.tsx              — server component, reads config, renders DesignSystemView
  layout.tsx            — fonts + ThemeProvider (must match apps/web)
  tokens/               — color-block and font-block components
components/
  design-system-view.tsx — main client component with all sections
  icon-context.tsx       — dynamic icon library provider
  theme-provider.tsx     — next-themes wrapper with D hotkey
  blocks/
    preview/             — shadcn preview 01 cards
    preview-02/          — shadcn preview 02 cards
lib/
  config.ts             — reads components.json + parses layout.tsx for fonts
```
