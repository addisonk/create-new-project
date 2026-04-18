#!/usr/bin/env node
// Copy templates/mobile/* into apps/mobile/ and patch mobile's package.json.
// Safe to re-run: overwrites files under apps/mobile with the canonical
// template versions.
//
// Usage: node install-mobile-templates.mjs --root <monorepo-root>

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, arr) => {
    if (arg.startsWith("--")) {
      const k = arg.slice(2);
      const next = arr[i + 1];
      acc.push([k, next && !next.startsWith("--") ? next : true]);
    }
    return acc;
  }, [])
);

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES = resolve(SKILL_DIR, "templates/mobile");
const root = args.root ? resolve(args.root) : process.cwd();
const mobile = resolve(root, "apps/mobile");

if (!existsSync(mobile)) {
  console.error(`apps/mobile not found at ${mobile}`);
  process.exit(1);
}

// Remove babel.config.js / tailwind.config.* that create-expo-app may have left.
// NativeWind v5 is CSS-first and doesn't need either.
for (const stale of ["babel.config.js", "tailwind.config.js", "tailwind.config.ts"]) {
  const p = join(mobile, stale);
  if (existsSync(p)) {
    rmSync(p);
    console.log(`removed stale ${stale}`);
  }
}

// Copy the whole mobile template directory on top of apps/mobile.
// cpSync with recursive + force overwrites existing files and creates dirs.
cpSync(TEMPLATES, mobile, { recursive: true, force: true });
console.log(`copied templates/mobile/* → apps/mobile/`);

// Patch mobile's package.json scripts (dev needs --dev-client for @expo/ui).
const pkgPath = join(mobile, "package.json");
if (existsSync(pkgPath)) {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.dev = "expo start --ios --dev-client";
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`patched mobile package.json (dev = expo start --ios --dev-client)`);
}
