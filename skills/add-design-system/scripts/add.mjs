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

import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
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

// ── helpers ────────────────────────────────────────────────────────────────

// Detect the host monorepo's package namespace by reading packages/ui's name.
// e.g. "@g14/ui" → "@g14". The cloned viewer ships with "@workspace/*" deps
// (shadcn's init --monorepo default) which we must rewrite to whatever the
// host actually uses.
function detectHostNamespace(root) {
  const uiPkg = JSON.parse(
    readFileSync(join(root, "packages/ui/package.json"), "utf-8")
  );
  const m = (uiPkg.name || "").match(/^(@[^/]+)\//);
  if (!m) {
    throw new Error(
      `packages/ui/package.json has unscoped name "${uiPkg.name}" — can't detect host namespace. ` +
        `Rename it to "@<your-scope>/ui" or scaffold via shadcn init --monorepo.`
    );
  }
  return m[1];
}

// If the host has packages/typescript-config/, return its package name; else
// null (caller falls back to extending the root tsconfig.json).
function detectHostTsConfigPkg(root) {
  const p = join(root, "packages/typescript-config/package.json");
  if (!existsSync(p)) return null;
  const pkg = JSON.parse(readFileSync(p, "utf-8"));
  return pkg.name || null;
}

// Remap @workspace/* references in the cloned viewer to match the host's
// namespace + tsconfig setup. Operates in-place on viewer files. Run after
// `gh repo clone` and before `pnpm install`.
function remapViewer(viewerDir, hostNs, hostTsConfigName) {
  // 1. package.json deps
  const vpPath = join(viewerDir, "package.json");
  const vp = JSON.parse(readFileSync(vpPath, "utf-8"));
  for (const depsKey of ["dependencies", "devDependencies", "peerDependencies"]) {
    if (!vp[depsKey]) continue;
    const next = {};
    for (const [name, ver] of Object.entries(vp[depsKey])) {
      if (name === "@workspace/typescript-config") {
        if (hostTsConfigName) next[hostTsConfigName] = ver;
        // else: drop — tsconfig is rewritten to point at the root file
      } else if (name.startsWith("@workspace/")) {
        next[`${hostNs}/${name.slice("@workspace/".length)}`] = ver;
      } else {
        next[name] = ver;
      }
    }
    vp[depsKey] = next;
  }
  writeFileSync(vpPath, JSON.stringify(vp, null, 2) + "\n");

  // 2. tsconfig.json — string-based to tolerate JSONC comments.
  const tsPath = join(viewerDir, "tsconfig.json");
  if (existsSync(tsPath)) {
    let text = readFileSync(tsPath, "utf-8");
    if (hostTsConfigName) {
      text = text.replace(/@workspace\/typescript-config/g, hostTsConfigName);
    } else {
      // apps/design-system is 2 levels under root → ../../tsconfig.json
      text = text.replace(
        /"extends"\s*:\s*"@workspace\/typescript-config[^"]*"/,
        `"extends": "../../tsconfig.json"`
      );
    }
    writeFileSync(tsPath, text);
  }

  // 3. Source file imports: any remaining @workspace/* → @<hostNs>/*
  const srcExts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css"];
  const skipDirs = new Set(["node_modules", ".next", ".turbo", "dist", "build"]);
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        walk(join(dir, entry.name));
      } else if (srcExts.some((ext) => entry.name.endsWith(ext))) {
        const full = join(dir, entry.name);
        const src = readFileSync(full, "utf-8");
        if (src.includes("@workspace/")) {
          writeFileSync(full, src.replace(/@workspace\//g, `${hostNs}/`));
        }
      }
    }
  }
  walk(viewerDir);

  console.log(
    `remapped @workspace/* → ${hostNs}/* in viewer (tsconfig: ${hostTsConfigName || "root fallback"})`
  );
}

// Add a script to package.json while preserving the host's existing
// indentation + trailing newline. Avoids the giant cosmetic diff that a
// naive JSON.parse → JSON.stringify produces on files with non-default
// formatting. Returns true if the file changed.
function addScriptPreservingFormat(pkgPath, name, value) {
  const text = readFileSync(pkgPath, "utf-8");
  const pkg = JSON.parse(text);
  if (pkg.scripts?.[name] === value) return false;
  pkg.scripts = pkg.scripts || {};
  pkg.scripts[name] = value;
  const indentMatch = text.match(/^([ \t]+)\S/m);
  const indent = indentMatch ? indentMatch[1] : "  ";
  const trailing = text.endsWith("\n") ? "\n" : "";
  const out = JSON.stringify(pkg, null, indent) + trailing;
  if (out === text) return false;
  writeFileSync(pkgPath, out);
  return true;
}

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

// ── detect host shape ──────────────────────────────────────────────────────
const hostNs = detectHostNamespace(root);
const hostTsConfigName = detectHostTsConfigPkg(root);
console.log(`  host namespace: ${hostNs}`);
console.log(
  `  host typescript-config: ${hostTsConfigName || "(none — viewer will extend root tsconfig.json)"}`
);

// If host has no typescript-config package, we MUST have a root tsconfig.json
// for the viewer to extend.
if (!hostTsConfigName && !existsSync(join(root, "tsconfig.json"))) {
  console.error(
    `\n✗ host has no packages/typescript-config and no root tsconfig.json — the viewer needs something to extend. ` +
      `Add a tsconfig.json at the repo root and re-run.`
  );
  process.exit(1);
}

function runIn(cwd, cmd) {
  console.log(`\n→ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

// ── 1. clone the design-system viewer (depth 1, drop .git) ─────────────────
runIn(root, `gh repo clone addisonk/create-new-project apps/design-system -- --depth 1`);
rmSync(join(root, "apps/design-system/.git"), { recursive: true, force: true });

// ── 1b. remap @workspace/* → host namespace (deps, tsconfig, imports) ──────
remapViewer(join(root, "apps/design-system"), hostNs, hostTsConfigName);

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
// host project's choices. We only add the one script the new app needs, and
// we preserve the host's existing indentation/whitespace to keep the diff
// to a single line.
{
  const added = addScriptPreservingFormat(
    pkgPath,
    "dev:design-system",
    "turbo --filter design-system dev"
  );
  console.log(
    added
      ? `\n→ added "dev:design-system" script to root package.json (format preserved)`
      : `\n→ "dev:design-system" script already present — skipped`
  );
}

// ── 5. resolve the viewer's new deps ───────────────────────────────────────
runIn(root, `CI=true pnpm install --no-frozen-lockfile`);

console.log(`\n✓ design-system added at ${join(root, "apps/design-system")}`);
console.log(`  start it: pnpm dev:design-system  (or: pnpm --filter design-system dev)`);
