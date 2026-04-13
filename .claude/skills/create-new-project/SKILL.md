# Create New Project

One-shot scaffold for a new cross-platform product: Next.js + shadcn/ui (web) and/or Expo + NativeWind v5 + react-native-reusables + `@expo/ui` (iOS/Android), wired into a single pnpm monorepo when both are requested.

## When to Use

Use when the user wants to start a new project — a marketing site, a mobile app, or both. Default is "both" (the primary use case).

## Interaction Method

**IMPORTANT:** Always use the `AskUserQuestion` tool for gathering input. Do NOT print questions as plain text — use the tool so the user gets a proper interactive prompt. Ask one question at a time.

## Prerequisite skills (mobile path)

The mobile path treats these skills as source of truth for the detailed setup. Read them and follow them when running mobile steps:

- `expo-tailwind-setup` — NativeWind v5 + Tailwind v4 CSS-first recipe (exact install command, metro config flags, `tw/` wrapper pattern, no babel.config.js)
- `react-native-reusables` — shadcn-philosophy component library for React Native (`@rn-primitives/*`, CVA variants, TextClassContext)
- `expo-ui-swiftui` — `@expo/ui/swift-ui` primitives for iOS (Host, RNHostView, SwiftUI mirror API)
- `expo-ui-jetpack-compose` — `@expo/ui/jetpack-compose` primitives for Android (Host, LazyColumn, modifiers)
- `building-native-ui` — Expo Router conventions, route structure, tabs, file naming
- `native-data-fetching` — Default preference: `expo/fetch` over axios

If any of these skills are not installed, tell the user which ones are missing and offer to proceed with general knowledge (mobile quality will be lower). Do NOT silently fall back.

## Steps

### Step 1 — Project name

Use `AskUserQuestion` (skip if provided as an argument):
- Q: "What should the project be called?"

### Step 2 — Platform

Use `AskUserQuestion`:
- Q: "What platforms do you need?"
- Options:
  - **Both** — "Web + iOS/Android monorepo (recommended): Next.js marketing/web app + Expo mobile app + design system viewer, all in one pnpm monorepo."
  - **Web only** — "Next.js + shadcn/ui monorepo (web only)."
  - **Mobile only** — "Standalone Expo app with react-native-reusables (no monorepo)."

### Step 3 — shadcn preset (skip for "Mobile only")

Use `AskUserQuestion`:
- Q: "Do you want to use a shadcn preset? Enter a preset ID or URL, or press enter for the default (b2D0wqNxT — Radix Luma)."
- If a URL like `https://ui.shadcn.com/create?preset=b2D0wqNxT`, extract just the preset ID.
- If empty / "no" / "default", use `b2D0wqNxT`.

### Step 4 — Parent directory

- If `~/Projects/` exists, use it (no question).
- If not, use `AskUserQuestion`: "Where do you keep your projects? (e.g., ~/Code, ~/dev, ~/workspace)"

### Step 5 — Branch on platform

Jump to the matching path below.

---

## Path A — Both (web + mobile monorepo)

Produces:

```
{name}/
├── apps/
│   ├── web/              # Next.js 16 + shadcn/ui
│   ├── mobile/           # Expo SDK 55 + NativeWind v5 + reusables + @expo/ui
│   └── design-system/    # Web-only viewer (cloned from create-new-project)
├── packages/
│   ├── ui/               # shadcn components (web)
│   └── shared/           # Empty placeholder for cross-platform types/utils
├── turbo.json
├── pnpm-workspace.yaml
└── package.json          # with pnpm overrides for Expo-in-monorepo
```

### A1. Scaffold the web monorepo (shadcn)

```bash
cd {parent}
echo "{name}" | pnpm dlx shadcn@latest init --preset {preset-id} --template next --monorepo
```

Notes:
- `--monorepo` is a boolean flag — do NOT pass a project name after it
- shadcn creates the project folder itself
- Pipe the name via `echo` because the CLI prompts interactively
- Use a 5-minute timeout

Creates `{parent}/{name}/` with `apps/web/`, `packages/ui/`, `turbo.json`, `pnpm-workspace.yaml`.

### A2. Install all shadcn components

```bash
cd {parent}/{name}
pnpm dlx shadcn@latest add --all -c packages/ui
```

`-c packages/ui` is required in monorepo mode. 5-minute timeout.

### A3. Add the design-system viewer

```bash
cd {parent}/{name}
gh repo clone addisonk/create-new-project apps/design-system -- --depth 1
rm -rf apps/design-system/.git
```

Update the viewer's style to match:

```bash
cd {parent}/{name}
STYLE=$(cat packages/ui/components.json | python3 -c "import sys,json; print(json.load(sys.stdin)['style'])")
```

Write `$STYLE` into `apps/design-system/components.json` (the `style` field).

**Manual step — font sync.** Copy font imports, variables, and className setup from `apps/web/app/layout.tsx` into `apps/design-system/app/layout.tsx`. Keep the viewer's `ThemeProvider` and `TooltipProvider` wrapping. Everything else in the viewer (fonts, icons, colors, blocks) is auto-detected — do NOT edit `page.tsx` or `design-system-view.tsx`.

### A4. Scaffold the mobile app

**Follow the `react-native-reusables` skill as the source of truth for reusables initialization.** Follow the `expo-tailwind-setup` skill for the NativeWind v5 + Tailwind v4 CSS-first recipe — prefer it over any Tailwind v3 + babel.config.js setup the reusables CLI might produce (strip and replace if needed).

The mobile app lives at `{parent}/{name}/apps/mobile/`. If the reusables CLI creates it in a different location, move it to `apps/mobile/` afterward.

Required results after this step:
- `apps/mobile/package.json` with Expo SDK 55, Expo Router, `nativewind@5.0.0-preview.2`, `tailwindcss@^4`, `react-native-css@0.0.0-nightly.5ce6396`, `@tailwindcss/postcss`, `tailwind-merge`, `clsx`
- `apps/mobile/resolutions` (via root `package.json` or `apps/mobile/package.json`) with `lightningcss: "1.30.1"`
- `apps/mobile/postcss.config.mjs` → `{ plugins: { "@tailwindcss/postcss": {} } }`
- `apps/mobile/global.css` with Tailwind v4 imports + platform-specific font variables (per `expo-tailwind-setup`)
- `apps/mobile/tw/index.tsx` — CSS-enabled wrappers (`View`, `Text`, `Pressable`, `ScrollView`, `Link`) using `useCssElement` from react-native-css (per `expo-tailwind-setup`)
- No `apps/mobile/babel.config.js` (CSS-first means no babel preset needed)
- `apps/mobile/components/ui/` — reusables components (per `react-native-reusables` skill)
- `apps/mobile/app/` — Expo Router routes, kebab-case file names, route matching `/` (per `building-native-ui`)

Then install `@expo/ui` for native primitives:

```bash
cd {parent}/{name}/apps/mobile
npx expo install @expo/ui
```

**Follow the `expo-ui-swiftui` and `expo-ui-jetpack-compose` skills** for the `Host` / `RNHostView` usage pattern. Note: `@expo/ui` requires a custom dev client — the app will no longer run in Expo Go. First run: `npx expo run:ios` (iOS) or `npx expo run:android` (Android).

### A5. Patch `apps/mobile/metro.config.js` for the monorepo

Replace/write the metro config to watch the monorepo root and resolve from both app and root `node_modules`:

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const monorepoRoot = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);

// Monorepo: watch root, resolve from both app and root node_modules
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineVariables: false,          // keeps PlatformColor working
  globalClassNamePolyfill: false,  // tw/ wrappers handle className explicitly
});
```

### A6. Patch root `package.json` with Expo-in-pnpm workarounds

Merge into `{parent}/{name}/package.json`:

```json
{
  "scripts": {
    "dev:web": "turbo --filter web dev",
    "dev:mobile": "turbo --filter mobile dev",
    "dev:design-system": "turbo --filter design-system dev"
  },
  "pnpm": {
    "overrides": {
      "@expo/log-box": "55.0.3"
    },
    "packageExtensions": {
      "react-native-css-interop": {
        "dependencies": { "connect": "^3.7.0" }
      },
      "@expo/cli": {
        "dependencies": { "metro-runtime": "*" }
      }
    }
  }
}
```

These are required for Expo to resolve correctly inside a pnpm workspace.

### A7. Create `packages/shared` placeholder

`{parent}/{name}/packages/shared/package.json`:

```json
{
  "name": "@workspace/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" }
}
```

`{parent}/{name}/packages/shared/src/index.ts`:

```ts
// Cross-platform types, API clients, and pure utilities go here.
// Safe to import from both apps/web and apps/mobile.
export {};
```

Ensure `pnpm-workspace.yaml` already includes `packages/*` (shadcn init creates it).

### A8. Install and git init

```bash
cd {parent}/{name}
pnpm install
git init
git add -A
git commit -m "chore: scaffold cross-platform shadcn + expo monorepo"
```

### A9. Report

- Project path
- Structure tree
- Component count (`packages/ui/src/components/*.tsx`)
- Next steps:
  - `cd {name} && pnpm dev:web`
  - `cd {name}/apps/mobile && npx expo run:ios` (first run — custom dev client required because `@expo/ui`)
  - After first run: `pnpm dev:mobile`
  - `pnpm dev:design-system`

---

## Path B — Web only

Produces the same shape as the "Both" path minus `apps/mobile/`, minus `packages/shared/`, and minus the Expo/pnpm workarounds.

Steps:

1. **Scaffold web monorepo** — same as A1
2. **Install all shadcn components** — same as A2
3. **Add design-system viewer** — same as A3 (clone, style sync, font sync)
4. **Install** — `cd {parent}/{name} && pnpm install`
5. **Git init + commit** — `git init && git add -A && git commit -m "chore: scaffold shadcn web monorepo"`
6. **Report** — project path, structure, component count, next steps (`pnpm dev`, `pnpm --filter design-system dev`)

---

## Path C — Mobile only (standalone)

Produces a standalone Expo app at `{parent}/{name}/`. No monorepo, no shared packages.

**Follow the `react-native-reusables` skill** for scaffolding. Goal:

- Expo SDK 55 + Expo Router
- NativeWind v5 + Tailwind v4 CSS-first (per `expo-tailwind-setup` — prefer over any v3+babel setup)
- react-native-reusables primitives + components in `components/ui/`
- `tw/` wrappers using `useCssElement` (per `expo-tailwind-setup`)
- `@expo/ui` installed (per `expo-ui-swiftui` + `expo-ui-jetpack-compose`)

Steps:

1. **Scaffold**:
   ```bash
   cd {parent}
   npx @react-native-reusables/cli@latest init -t {name}
   ```
   If the CLI produces a Tailwind v3 + babel setup, strip it and replace with the `expo-tailwind-setup` recipe.

2. **Add native UI**:
   ```bash
   cd {parent}/{name}
   npx expo install @expo/ui
   ```

3. **Install + git**:
   ```bash
   pnpm install  # or bun/npm depending on what the CLI set up
   git init && git add -A && git commit -m "chore: scaffold standalone expo app"
   ```

4. **Report**:
   - Project path
   - Next steps: `npx expo run:ios` (first run, required for `@expo/ui`), then `pnpm dev`

---

## Known sharp edges to watch for during testing

- **react-native-reusables CLI Tailwind version:** the CLI may still default to v3 + babel. If so, strip it and apply the `expo-tailwind-setup` v4 CSS-first recipe after init.
- **Expo in pnpm monorepo:** the root `pnpm.overrides` + `packageExtensions` above are required; without them, resolution fails.
- **`@expo/ui` + Expo Go:** incompatible. First run of the mobile app must be `npx expo run:ios` or `expo run:android`, not `expo start`.
- **Font sync (web + design-system):** the one manual step in the web flow — easy to forget. Always verify the design-system app compiles after this step.
