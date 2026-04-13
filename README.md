# Design System Viewer

A Next.js app that visualizes your shadcn monorepo's design system — typography, colors, radius, and component blocks.

Lives at `apps/design-system/` in a shadcn monorepo alongside `apps/web/` and `packages/ui/`.

## Setup

This template is automatically added by the `/create-new-project` skill. To add it manually:

```bash
gh repo clone addisonk/create-new-project apps/design-system -- --depth 1
rm -rf apps/design-system/.git
```

### One manual step: sync layout fonts

Copy the font imports from `apps/web/app/layout.tsx` into `apps/design-system/app/layout.tsx`. The fonts must match because `next/font` requires static imports.

Everything else is auto-detected:
- **Font names and labels** — parsed from `apps/web/app/layout.tsx` at build time
- **Icon library** — read from `packages/ui/components.json`, dynamically imported
- **Style** — read from `packages/ui/components.json`
- **Colors, radius** — from CSS theme variables
- **Blocks** — shadcn preview cards using `@workspace/ui` components

### Update components.json style

```bash
# Read the style from packages/ui and update design-system
STYLE=$(cat packages/ui/components.json | python3 -c "import sys,json; print(json.load(sys.stdin)['style'])")
# Update apps/design-system/components.json with the correct style
```

### Install dependencies

```bash
pnpm install
```

## Running

```bash
pnpm --filter design-system dev
```

Opens at the next available port (shown in terminal output).

## What it shows

- **Typography** — font name, Aa specimen, available weights, character overview for each font (Body, Heading, Mono)
- **Color Palette** — primary grid with foreground labels, utility colors with WCAG auto-contrast text, charts, sidebar
- **Radius** — visual scale from none to 4xl with resolved theme values
- **Blocks** — shadcn preview 01/02 masonry grid with toggle, scrollable container with inner shadow

## Features

- **Press D** to toggle dark mode (next-themes ThemeProvider)
- **Section filter** — Select dropdown to view one section at a time, uses URL params (`?section=color`)
- **Auto-contrast** — colorjs.io WCAG contrast with alpha compositing for readable labels on any color
- **Dynamic icons** — reads `iconLibrary` from components.json, imports the correct package via React context

## Dependencies

- `next` — app framework
- `@workspace/ui` — shared shadcn components
- `next-themes` — dark mode
- `recharts` (v3) — charts in block previews
- `colorjs.io` — WCAG contrast calculation
- `shadcn` — icon library access
- `react-qr-code` — QR code in block previews
- `lucide-react` — default icons (swapped by icon context if different library)

## File structure

```
app/
  page.tsx              — server component, reads config, renders DesignSystemView
  layout.tsx            — fonts + ThemeProvider (must match apps/web)
  tokens/               — color-block and font-block components (for sub-routes)
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
