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

### Step 0 — Preflight check

**Run this BEFORE asking any questions.** Catches missing system dependencies in 5 seconds instead of letting the user discover them 10 minutes later when `xcodebuild` fails.

Run these checks and collect failures into a single report:

**Universal (all paths):**
- `command -v pnpm` — if missing: "Install pnpm: `corepack enable && corepack prepare pnpm@10 --activate`"
- `pnpm --version` — should be 10.x; if older: same fix as above
- `command -v gh` — if missing: "Install gh CLI: `brew install gh`" (needed to clone the design-system viewer)
- `node -v` — should be 20+; if older: "Upgrade Node to 20+ via `brew install node@20` or nvm"
- `command -v git` — if missing: "Install git: `xcode-select --install` or `brew install git`"

**Mobile (Both or Mobile-only paths only):**
- `xcode-select -p` — should print a path. If it errors or returns "no developer tools": "Install Xcode from the Mac App Store, then run `sudo xcode-select --install`"
- `xcodebuild -version` — should print something like `Xcode 26.4`. Extract the major version (e.g. `26`).
- `xcrun simctl list runtimes -j 2>/dev/null` — parse JSON; the `runtimes` array must contain at least one entry whose `name` matches the **same major version as Xcode**. For example, if Xcode is `26.4`, an `iOS 18.6` runtime is NOT enough — you need an `iOS 26.x` runtime. Xcode requires a matching iOS SDK to compile, even if you only ever target older simulators.
  - If no matching runtime: "Your Xcode is `{xcode_version}` but no `iOS {xcode_major}.x` simulator runtime is installed. Without it, `xcodebuild` fails on the very first build with `Unable to find a destination`. Install it from the CLI (no Xcode UI needed): `xcodebuild -downloadPlatform iOS` — note: this is ~8 GB and takes 15–20 minutes. Re-run the skill once it's done."
  - Do NOT just check for "any iOS runtime exists" — that's the bug we hit on 2026-04-13.
- `xcrun simctl list devices available -j 2>/dev/null` — at least one device must exist that uses a runtime matching Xcode's major version. Same fix if not.

**If ANY check fails:**
- STOP. Do not proceed to Step 1.
- Report ALL failures in a single block (not one at a time)
- For each failure, give the exact command to fix it
- Tell the user to run the skill again once fixed
- Do NOT start scaffolding with a known-broken environment

**If everything passes:** silently continue to Step 1. (Don't make the user wait through a "✓ all checks passed" wall of text — just move on.)

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

**Important — do NOT use `npx @react-native-reusables/cli@latest init`.** It requires interactive TTY input and hangs when piped, breaking automated runs. Instead, use the `create-expo-app` + manual layering pattern below. After the mobile app is up, you can layer reusables components on top with `npx @react-native-reusables/cli@latest add` (which runs interactively but doesn't hang).

The mobile app lives at `{parent}/{name}/apps/mobile/`.

**Step A4a — scaffold the Expo app:**

```bash
cd {parent}/{name}/apps
npx create-expo-app@latest mobile --template default
```

This creates `apps/mobile/` with Expo Router, the default tabs template, and TypeScript.

**Step A4b — pin SDK 55 and align packages:**

```bash
cd {parent}/{name}/apps/mobile
npx expo install expo@~55.0.0
npx expo install --fix
```

`create-expo-app`'s default template may lag behind the latest stable Expo SDK — these two commands ensure SDK 55 is installed and all peer packages (react-native, react-native-reanimated, etc.) align with what SDK 55 expects.

**Step A4c — install NativeWind v5 + Tailwind v4 + dependencies:**

Follow the **`expo-tailwind-setup` skill** for the canonical recipe. Specifically:

```bash
cd {parent}/{name}/apps/mobile
npx expo install tailwindcss@^4 nativewind@5.0.0-preview.3 \
  react-native-css@^3.0.7 @tailwindcss/postcss tailwind-merge clsx
pnpm add connect           # explicit dep — react-native-css-interop needs it at runtime
```

Then:
- Delete any `babel.config.js` and `tailwind.config.js` that `create-expo-app` may have created (NativeWind v5 is CSS-first, no babel preset required)
- Create `apps/mobile/postcss.config.mjs` → `{ plugins: { "@tailwindcss/postcss": {} } }`
- Create `apps/mobile/global.css` with Tailwind v4 imports + platform-specific font variables (per `expo-tailwind-setup`)
- Create `apps/mobile/tw/index.tsx` with CSS-enabled wrappers (`View`, `Text`, `Pressable`, `ScrollView`, `Link`) using `useCssElement` from react-native-css (per `expo-tailwind-setup`)
- Import `./global.css` from `apps/mobile/app/_layout.tsx`

**Step A4d — add reusables foundation files:**

Follow the **`react-native-reusables` skill** for these:
- `apps/mobile/lib/utils.ts` — exporting `cn()` (clsx + tailwind-merge)
- `apps/mobile/components.json` — reusables CLI config (so `@react-native-reusables/cli add` works later)
- `apps/mobile/components/ui/text.tsx` — Text component with `TextClassContext`
- `apps/mobile/components/ui/button.tsx` — Button component with CVA variants and `Platform.select` for hover/active
- `<PortalHost />` in `apps/mobile/app/_layout.tsx` (for dialogs/menus/popovers from reusables)

**Step A4e — install `@expo/ui` for native primitives:**

```bash
cd {parent}/{name}/apps/mobile
npx expo install @expo/ui
```

Follow the `expo-ui-swiftui` and `expo-ui-jetpack-compose` skills for the `Host` / `RNHostView` usage pattern. Note: `@expo/ui` requires a custom dev client — the app cannot run in Expo Go. First run must be `npx expo run:ios` or `npx expo run:android`.

**Step A4f — handle `react-native-svg` if present:**

If the dependency tree pulls in `react-native-svg` (from reusables, lucide-react-native, or any other source), add `buffer` as an explicit dep. Same pnpm strict-hoisting cause as the `connect` workaround.

```bash
cd {parent}/{name}/apps/mobile
pnpm add buffer
```

**To add more reusables components later** (run interactively from the user's terminal, not piped):

```bash
cd {parent}/{name}/apps/mobile
npx @react-native-reusables/cli@latest add
```

### A4g — Replace default Expo template with welcome screen

`create-expo-app`'s default template ships a generic "Welcome 👋" screen with placeholder text. Replace it with a purpose-built welcome that demonstrates the stack: NativeTabs (iOS 26+ liquid glass), a header right toolbar button, and a reusables Text + Button card.

This proves four things at first glance: NativeTabs work, Stack.Toolbar works, NativeWind v5 + reusables Text renders, and reusables Button is wired.

**Replace `apps/mobile/app/(tabs)/_layout.tsx`:**

```tsx
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon sf="safari.fill" md="explore" />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

**Replace `apps/mobile/app/(tabs)/index.tsx`** (substitute `{name}` with the actual project name):

```tsx
import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { View } from "@/tw";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "{name}" }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="plus.circle.fill" onPress={() => {}} />
      </Stack.Toolbar>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="flex-1 items-center justify-center gap-6 px-8 py-24">
          <Text className="text-3xl font-bold text-center">
            Welcome to {name}
          </Text>
          <Text className="text-base text-muted-foreground text-center">
            Your cross-platform scaffold is ready.{"\n"}
            Edit app/(tabs)/index.tsx to start building.
          </Text>
          <Button onPress={() => {}}>
            <Text>Get started</Text>
          </Button>
        </View>
      </ScrollView>
    </>
  );
}
```

**Replace `apps/mobile/app/(tabs)/explore.tsx`** (stub):

```tsx
import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { View } from "@/tw";
import { Text } from "@/components/ui/text";

export default function ExploreScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Explore" }} />
      <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic">
        <View className="flex-1 items-center justify-center px-8 py-24">
          <Text className="text-base text-muted-foreground text-center">
            Explore tab — replace this with your own content.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
```

**Create `apps/mobile/app/(tabs)/settings.tsx`** (new file, stub):

```tsx
import { ScrollView } from "react-native";
import { Stack } from "expo-router";
import { View } from "@/tw";
import { Text } from "@/components/ui/text";

export default function SettingsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior="automatic">
        <View className="flex-1 items-center justify-center px-8 py-24">
          <Text className="text-base text-muted-foreground text-center">
            Settings tab — replace this with your own content.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
```

**Notes:**
- `NativeTabs` from `expo-router/unstable-native-tabs` gets the iOS 26+ liquid glass tab bar automatically. On Android it falls back to Material 3 bottom navigation.
- `Stack.Toolbar` is **iOS only** (SDK 55+). On Android the top-right button just won't render — the tabs and content still work. That's acceptable for a starter; teammates can add an Android-specific toolbar later.
- SF Symbols (`sf="..."`) work without installing `expo-symbols` because NativeTabs and Stack.Toolbar accept them directly.
- The header right button (`plus.circle.fill`) is intentionally a no-op — it's there to demonstrate the Stack.Toolbar pattern, not to do anything.
- If a different (or older) template is being used and there's no `app/(tabs)/` directory, follow the `building-native-ui` skill's `route-structure.md` reference for the right place to put these files.

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
  inlineVariables: false,          // keeps PlatformColor working in CSS variables
  globalClassNamePolyfill: false,  // tw/ wrappers handle className explicitly
});
```

### A6. Patch root `package.json` with Expo-in-pnpm workarounds

Merge into `{parent}/{name}/package.json`. These overrides + packageExtensions are the proven nba-on-tv recipe — without them, Expo + pnpm strict hoisting breaks in subtle ways (missing `connect`, missing `metro-runtime`, React version mismatches, etc.).

```json
{
  "scripts": {
    "dev:web": "turbo --filter web dev",
    "dev:mobile": "turbo --filter mobile dev",
    "dev:design-system": "turbo --filter design-system dev"
  },
  "pnpm": {
    "overrides": {
      "react": "19.2.0",
      "react-dom": "19.2.0",
      "lightningcss": "1.30.1"
    },
    "onlyBuiltDependencies": ["unrs-resolver"],
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

Also create `{parent}/{name}/.npmrc` (single line — fixes another huge class of pnpm-strict-hoisting issues with Expo):

```
shamefully-hoist=true
```

And create `{parent}/{name}/tsconfig.base.json` for shared compiler options (extended by `apps/mobile/tsconfig.json` and the web app):

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true
  },
  "exclude": ["node_modules"]
}
```

Update `apps/mobile/tsconfig.json` to extend both Expo's base and the root base, with the `@/` path alias:

```json
{
  "extends": ["expo/tsconfig.base", "../../tsconfig.base.json"],
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ],
  "exclude": ["node_modules"]
}
```

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

Use `CI=true` and `--no-frozen-lockfile` to avoid two known pnpm pitfalls in automated runs:
- `CI=true` — prevents `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` (pnpm wants interactive confirmation to remove `node_modules`)
- `--no-frozen-lockfile` — prevents `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` (we added `pnpm.overrides` after the lockfile was first generated by `create-expo-app`, so the lockfile is stale relative to the new overrides)

```bash
cd {parent}/{name}
CI=true pnpm install --no-frozen-lockfile
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

- **react-native-reusables CLI `init` hangs when piped:** Don't use `@react-native-reusables/cli init` in the scaffold flow — it requires interactive TTY input and hangs in automated runs. The A4 steps use `create-expo-app` + manual NativeWind v5 layering instead, which is deterministic. Use `@react-native-reusables/cli add` (also interactive, but doesn't hang) for adding more reusables components after the initial scaffold.
- **Expo in pnpm monorepo:** the root `pnpm.overrides` + `packageExtensions` + `.npmrc shamefully-hoist=true` are all required. Without all three, resolution fails in different ways.
- **NativeWind v5 oklch text bug (severity: critical, may already be fixed):** on `nativewind@5.0.0-preview.2` + `react-native-css@nightly`, Tailwind v4's `oklch()` colors broke `<Text>` rendering — text became invisible because RN can't parse oklch. `useCssElement` also overwrote inline `style` props, blocking the workaround. **Fix attempt:** we now pin `nativewind@5.0.0-preview.3` + `react-native-css@^3.0.7`. If text still renders invisible after the first run, the workaround is to import `Text` directly from `react-native` (not from `@/tw`) and use inline style for colors. Watch for this on the first iOS simulator launch.
- **`@expo/ui` + Expo Go:** incompatible. First run of the mobile app must be `npx expo run:ios` or `expo run:android`, not `expo start`.
- **Font sync (web + design-system):** the one manual step in the web flow — easy to forget. Always verify the design-system app compiles after this step.
- **`react-native-svg` + `buffer`:** if the dependency tree pulls in `react-native-svg`, also add an explicit `buffer` dep. Same pnpm strict-hoisting cause as the `connect` workaround.
