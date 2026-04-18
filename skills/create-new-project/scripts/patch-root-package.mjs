#!/usr/bin/env node
// Merge monorepo scaffolding into the root package.json.
// Preserves existing fields; only adds/overrides scripts and pnpm config.
//
// Usage: node patch-root-package.mjs --root <monorepo-root> [--include-mobile]
//
// Without --include-mobile: adds dev:web / dev:design-system scripts and basic pnpm block.
// With --include-mobile: also adds sync:tokens, dev:mobile, Expo-in-pnpm overrides and packageExtensions.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

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

const root = args.root ? resolve(args.root) : process.cwd();
const includeMobile = !!args["include-mobile"];

const pkgPath = resolve(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

pkg.scripts = pkg.scripts || {};
pkg.scripts["dev:web"] = "turbo --filter web dev";
pkg.scripts["dev:design-system"] = "turbo --filter design-system dev";

if (includeMobile) {
  pkg.scripts["sync:tokens"] = "node scripts/sync-mobile-tokens.mjs";
  pkg.scripts["dev:mobile"] = "pnpm sync:tokens && turbo --filter mobile dev";
  pkg.scripts["dev"] = "pnpm sync:tokens && turbo dev";

  // culori powers scripts/sync-mobile-tokens.mjs (oklch → hex). Declaring it
  // here instead of via `pnpm add -Dw` means it's resolved as part of the
  // single final install pass, avoiding hoisting-mode mismatches mid-run.
  pkg.devDependencies = { ...(pkg.devDependencies || {}), culori: "^4.0.2" };
}

// Pin packageManager to the version the skill was tested on.
pkg.packageManager = "pnpm@10.20.0";
pkg.engines = { ...(pkg.engines || {}), node: ">=20" };

// Expo-in-pnpm strict-hoisting workarounds live under `pnpm`.
if (includeMobile) {
  pkg.pnpm = pkg.pnpm || {};
  pkg.pnpm.overrides = {
    ...(pkg.pnpm.overrides || {}),
    react: "19.2.0",
    "react-dom": "19.2.0",
    lightningcss: "1.30.1",
  };
  pkg.pnpm.onlyBuiltDependencies = Array.from(
    new Set([...(pkg.pnpm.onlyBuiltDependencies || []), "unrs-resolver"])
  );
  pkg.pnpm.packageExtensions = {
    ...(pkg.pnpm.packageExtensions || {}),
    "react-native-css-interop": { dependencies: { connect: "^3.7.0" } },
    "@expo/cli": { dependencies: { "metro-runtime": "*" } },
  };
}

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`patched ${pkgPath}${includeMobile ? " (with mobile overrides)" : ""}`);
