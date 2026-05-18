#!/usr/bin/env node
// Retrofit the design-system viewer (`apps/design-system`) into an existing
// create-new-project-style monorepo. Idempotent: bails clearly if
// apps/design-system already exists, or if the target doesn't look like the
// expected monorepo shape.
//
// Usage:
//   node add.mjs --root <project-root>
//
// Reuses the sibling skill's patch helpers (patch-design-system.mjs,
// patch-ui-globals.mjs) — both take --root and are idempotent.

import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
// Sibling skill's scripts dir. Layout: skills/<this-skill>/scripts/add.mjs
//   → ../../create-new-project/scripts
const CNP_SCRIPTS = resolve(HERE, "../../create-new-project/scripts");

// ── arg parsing ────────────────────────────────────────────────────────────
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

const rootRaw = args.root || process.cwd();
const root = resolve(rootRaw.replace(/^~/, process.env.HOME || ""));

// ── preflight: is this actually the right kind of monorepo? ────────────────
const failures = [];

const requiredFiles = [
  ["package.json", "root package.json (is this a project root?)"],
  ["pnpm-workspace.yaml", "pnpm-workspace.yaml (monorepo marker — this skill only works on pnpm workspaces)"],
  ["apps/web/app/layout.tsx", "apps/web/app/layout.tsx (font sync source — Next.js app in apps/web is required)"],
  ["packages/ui/components.json", "packages/ui/components.json (shadcn target — shared UI package must live at packages/ui)"],
  ["packages/ui/src/styles/globals.css", "packages/ui/src/styles/globals.css (CSS patch target)"],
];

for (const [rel, why] of requiredFiles) {
  if (!existsSync(join(root, rel))) failures.push(`missing ${rel} — ${why}`);
}

// Idempotency: never clobber an existing apps/design-system.
if (existsSync(join(root, "apps/design-system"))) {
  failures.push(
    "apps/design-system/ already exists — nothing to do. Delete it first if you want to re-add."
  );
}

// Confirm package.json is private (real monorepo root). Not a hard fail, but
// a useful sanity check — if private is false/missing the user is probably
// pointing at the wrong directory.
const pkgPath = join(root, "package.json");
if (existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    if (pkg.private !== true) {
      failures.push(
        `package.json at ${root} is not marked "private": true — this doesn't look like a monorepo root. Pass --root pointing at the workspace root, not an individual app.`
      );
    }
  } catch (e) {
    failures.push(`failed to parse ${pkgPath}: ${e.message}`);
  }
}

if (failures.length) {
  console.error(`\n✗ preflight failed in ${root}:\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    `\nThis skill expects a create-new-project-style monorepo: pnpm workspaces, Next.js + shadcn/ui in apps/web, shared UI package at packages/ui. Resolve the failures above and re-run.`
  );
  process.exit(1);
}

console.log(`✓ preflight passed in ${root}`);

// ── helpers ────────────────────────────────────────────────────────────────
function runIn(cwd, cmd) {
  console.log(`\n→ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

// ── 1. clone the design-system viewer (depth 1, drop .git) ─────────────────
runIn(root, `gh repo clone addisonk/create-new-project apps/design-system -- --depth 1`);
rmSync(join(root, "apps/design-system/.git"), { recursive: true, force: true });

// ── 2. patch design-system (style + fonts + sleep 2) ───────────────────────
runIn(
  root,
  `node ${JSON.stringify(join(CNP_SCRIPTS, "patch-design-system.mjs"))} --root .`
);

// ── 3. patch packages/ui globals (safelist + .ds-color-picker CSS) ─────────
runIn(
  root,
  `node ${JSON.stringify(join(CNP_SCRIPTS, "patch-ui-globals.mjs"))} --root .`
);

// ── 4. add dev:design-system script to root package.json (idempotent) ──────
// We intentionally DON'T call patch-root-package.mjs — that script also
// rewrites `dev` / `dev:mobile` / pnpm overrides, which would clobber the
// host project's choices. We only add the one script the new app needs.
{
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts["dev:design-system"]) {
    pkg.scripts["dev:design-system"] = "turbo --filter design-system dev";
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`\n→ added "dev:design-system" script to root package.json`);
  } else {
    console.log(`\n→ "dev:design-system" script already present — skipped`);
  }
}

// ── 5. resolve the viewer's new deps ───────────────────────────────────────
runIn(root, `CI=true pnpm install --no-frozen-lockfile`);

console.log(`\n✓ design-system added at ${join(root, "apps/design-system")}`);
console.log(`  start it: pnpm dev:design-system  (or: pnpm --filter design-system dev)`);
