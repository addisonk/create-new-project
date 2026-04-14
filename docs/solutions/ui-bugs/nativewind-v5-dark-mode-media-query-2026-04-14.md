---
title: "NativeWind v5 + Tailwind v4 dark mode requires @media (prefers-color-scheme: dark) on native"
date: 2026-04-14
category: ui-bugs
module: mobile-theming
problem_type: ui_bug
component: tooling
symptoms:
  - "bg-card and other themed utilities stay light-mode values when color scheme is set to dark on native"
  - ".dark { ... } override block in global.css is dead CSS at runtime on iOS/Android"
  - "setColorScheme('dark') has no visible effect on NativeWind-styled components that depend on CSS variable overrides"
  - "color-scheme: light dark + light-dark() CSS function also fails to switch tokens on native"
root_cause: wrong_api
resolution_type: code_fix
severity: high
tags:
  - nativewind
  - tailwind-v4
  - dark-mode
  - expo
  - global-css
  - prefers-color-scheme
---

# NativeWind v5 + Tailwind v4 dark mode requires @media (prefers-color-scheme: dark) on native

## Problem

NativeWind v5 preview + Tailwind v4 CSS-first dark mode broke on React Native: toggling dark mode (via OS or an in-app `setColorScheme("dark")` call) correctly flipped the screen background and text, but `<Card>` components using `bg-card` stayed white because the `--color-card` CSS variable override lived in a `.dark { ... }` block, and on native that block is dead CSS.

## Symptoms

- Screen background and foreground text flipped to dark correctly, but every `<Card>` rendered with a white `#ffffff` background.
- Reproduced with both the iOS Simulator OS appearance toggle and an in-app `setColorScheme("dark")` call.
- Other `bg-card`-dependent surfaces (settings rows, list items) stayed light alongside the cards.
- The same token set worked fine on web — only the native target was broken.

## What Didn't Work

- **`light-dark(#ffffff, #171717)` with `color-scheme: light dark`.** The `expo-tailwind-setup` skill recommends SwiftUI's `light-dark()` CSS function paired with a declared `color-scheme` on `:root`. Tried rewriting one token this way and reloaded. Card still stayed white. Reason: NativeWind's `setColorScheme()` toggles internal state that maps to `prefers-color-scheme`, but it never mutates an element's actual `color-scheme` property — so `light-dark()` always returned the light branch.
- **Adding `@custom-variant dark (&:where(.dark, .dark *));`.** Ruled out on inspection: NativeWind never attaches a `.dark` class to any node in the RN render tree, so the directive would compile the selector but nothing would ever match it.
- **Consulting the `vercel-react-native-skills` skill for dark-mode guidance.** That skill covers perf, animations, and UI patterns but has nothing on CSS variable overrides for dark mode. Dead end.
- **(session history) Prior workaround in a different project: hardcoded dark hex values.** In an earlier `nba-tonight` monorepo migration session (2026-03-19/20), the same NativeWind v5 + Tailwind v4 + `@theme` color-token setup crashed `react-native-css` at runtime. That team punted to hardcoded zinc-950 colors and commented "the dark background works in both light and dark mode since we're using hardcoded colors" — a pragmatic punt, not a token-driven solution.

## Solution

Change the sync script (or edit `apps/mobile/global.css` directly) so it emits a `@media (prefers-color-scheme: dark) { :root { ... } }` block instead of a `.dark { ... }` block.

**Before** (in the template's `scripts/sync-mobile-tokens.mjs`):

```js
function generateMobileCSS(lightTokens, darkTokens) {
  const lightBlock = buildThemeBlock(lightTokens);
  const darkBlock = buildThemeBlock(darkTokens);
  return `
@theme {
${lightBlock}
}

.dark {
${darkBlock}
}
`;
}
```

**After**:

```js
function generateMobileCSS(lightTokens, darkTokens) {
  const lightBlock = buildThemeBlock(lightTokens);
  const darkBlock = buildThemeBlock(darkTokens);
  return `
@theme {
${lightBlock}
}

@media (prefers-color-scheme: dark) {
  :root {
${darkBlock.replace(/^/gm, "  ")}
  }
}
`;
}
```

The same swap applies when hand-editing `apps/mobile/global.css` — replace the `.dark { ... }` block with `@media (prefers-color-scheme: dark) { :root { ... } }`, reload, and cards flip to their dark values immediately. No sync rerun needed.

## Why This Works

NativeWind v5 preview implements its own CSS interpreter on native and maps the runtime color scheme (driven by `useColorScheme()` / `setColorScheme()`) onto the `prefers-color-scheme` media query — not onto a `.dark` class on any element. When the active scheme is dark, NativeWind evaluates `@media (prefers-color-scheme: dark)` blocks and applies their declarations to the root, so CSS custom properties like `--color-card` get overridden and every `bg-card` utility resolves to the new value.

Class-based selectors like `.dark` compile but never match, because no node in the React Native render tree ever receives that class. This is why the identical `.dark` setup works on web (`<html class="dark">` cascades normally), but that DOM mechanism doesn't exist in RN. Effectively, web and native have different dark-mode contracts, and the media-query form is the only one NativeWind's native runtime honors.

**(session history)** The `globalClassNamePolyfill` option in `metro.config.js` is a related but distinct concern: it controls whether NativeWind's `className=` prop pass-through works on any RN primitive (e.g., `RNText`, `Pressable`). Setting it to `true` enables className support globally — but it does **not** add a `.dark` ancestor class to any element in the tree, so it doesn't rescue `.dark { ... }` selectors. The two issues are orthogonal.

## Prevention

- For any NativeWind v5 + Tailwind v4 CSS-first setup, always emit `@media (prefers-color-scheme: dark) { :root { ... } }` on native. Never use `.dark { ... }`.
- Don't mix strategies: `.dark` is web-only, and `light-dark()` requires runtime `color-scheme` updates that NativeWind doesn't perform. Stick with `@media (prefers-color-scheme: dark)`.
- Token sync scripts that generate mobile CSS from web CSS must translate `.dark` selectors into `@media (prefers-color-scheme: dark) { :root { ... } }` blocks — treat web and native as separate output targets, not shared CSS.
- Prefer OS-driven dark mode on native via React Native's `useColorScheme()` over an in-app toggle. Less code, no `ThemeContext`, and users get platform-native switching via Control Center. Delete `lib/theme.tsx` / any custom ThemeProvider unless you have a hard requirement for a per-app override independent of the OS.
- If you find yourself reaching for `globalClassNamePolyfill: true`, understand what it does (className prop pass-through on arbitrary RN primitives) and what it doesn't (magically enable `.dark` class selectors). They are separate concerns.

## Related Issues

- [`nativewind/nativewind#1448`](https://github.com/nativewind/nativewind/issues/1448) — "Dark styles applied in light color scheme" (closed, needs reproduction). Symptoms adjacent to this one.
- [`nativewind/nativewind#1489`](https://github.com/nativewind/nativewind/issues/1489) — "Cannot manually set color scheme, as dark mode is type 'media'" (open, v4). Directly addresses `prefers-color-scheme` vs manual class mode.
- [`nativewind/nativewind#1759`](https://github.com/nativewind/nativewind/issues/1759) — "v5: Expand test coverage to match v4 utility coverage" (open). Context for why v5 + Tailwind v4 has known coverage gaps on native.
- Skill patch in the same session: `03f16a1` in `addisonk/create-new-project` — updates the `sync-mobile-tokens.mjs` script template in `.claude/skills/create-new-project/SKILL.md` to emit the `@media` block.
