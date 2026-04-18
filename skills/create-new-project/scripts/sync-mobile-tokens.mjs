#!/usr/bin/env node
// Generate apps/mobile/global.css from packages/ui/src/styles/globals.css
// Converts oklch() colors to hex since React Native can't parse oklch.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parse, formatHex } from "culori";

const ROOT = process.cwd();
const WEB_TOKENS = resolve(ROOT, "packages/ui/src/styles/globals.css");
const MOBILE_TOKENS = resolve(ROOT, "apps/mobile/global.css");

const MOBILE_TOKEN_NAMES = [
  "background", "foreground",
  "card", "card-foreground",
  "popover", "popover-foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "muted", "muted-foreground",
  "accent", "accent-foreground",
  "destructive", "destructive-foreground",
  "border", "input", "ring",
];

function parseTokenBlock(css, selector) {
  const re = new RegExp(`${selector.replace(/[.]/g, "\\.")}\\s*\\{([^}]+)\\}`);
  const match = css.match(re);
  if (!match) return {};
  const out = {};
  for (const line of match[1].split("\n")) {
    const m = line.trim().match(/^--([\w-]+):\s*([^;]+);?$/);
    if (!m) continue;
    out[m[1]] = m[2].trim();
  }
  return out;
}

function toHex(value) {
  try {
    const parsed = parse(value);
    return parsed ? formatHex(parsed) : null;
  } catch { return null; }
}

function buildThemeBlock(tokens) {
  const lines = [];
  for (const name of MOBILE_TOKEN_NAMES) {
    const value = tokens[name];
    if (!value) continue;
    const hex = toHex(value);
    if (!hex) continue;
    lines.push(`  --color-${name}: ${hex};`);
  }
  if (!lines.find((l) => l.includes("--color-destructive-foreground"))) {
    lines.push(`  --color-destructive-foreground: #ffffff;`);
  }
  return lines.join("\n");
}

function generateMobileCSS(lightTokens, darkTokens) {
  const lightBlock = buildThemeBlock(lightTokens);
  const darkBlock = buildThemeBlock(darkTokens);
  return `/*
 * DO NOT EDIT — generated from packages/ui/src/styles/globals.css.
 * Run \`pnpm sync:tokens\` from the monorepo root to regenerate.
 */

@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@media android {
  :root { --font-mono: monospace; --font-sans: normal; }
}
@media ios {
  :root { --font-mono: ui-monospace; --font-sans: system-ui; }
}

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

const webCss = readFileSync(WEB_TOKENS, "utf-8");
const lightTokens = parseTokenBlock(webCss, ":root");
const darkTokens = parseTokenBlock(webCss, ".dark");
const mobileCss = generateMobileCSS(lightTokens, darkTokens);
mkdirSync(dirname(MOBILE_TOKENS), { recursive: true });
writeFileSync(MOBILE_TOKENS, mobileCss);
console.log(`wrote ${MOBILE_TOKENS} (${Object.keys(lightTokens).length} tokens)`);
