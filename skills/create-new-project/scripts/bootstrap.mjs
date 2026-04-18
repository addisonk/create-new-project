#!/usr/bin/env node
// Bootstrap a cross-platform monorepo. One command, deterministic.
//
// Usage:
//   node bootstrap.mjs \
//     --name <project-name> \
//     --parent <parent-dir> \
//     --platform both|web|mobile \
//     --preset <shadcn-preset-id>
//
// The LLM's job is to ask the user for --name / --platform / --preset / --parent
// and then invoke this script. Everything else is shell + node.

import {
  existsSync,
  mkdirSync,
  cpSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES = resolve(SKILL_DIR, "templates");
const SCRIPTS = resolve(SKILL_DIR, "scripts");

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

const name = args.name;
const parentRaw = args.parent || resolve(process.env.HOME, "Projects");
const parent = resolve(parentRaw.replace(/^~/, process.env.HOME));
const platform = (args.platform || "both").toLowerCase();
const preset = args.preset || "b0";

if (!name) {
  console.error("--name is required");
  process.exit(1);
}
if (!["both", "web", "mobile"].includes(platform)) {
  console.error(`--platform must be one of: both, web, mobile (got ${platform})`);
  process.exit(1);
}

const project = resolve(parent, name);
if (existsSync(project)) {
  console.error(`target already exists: ${project}`);
  process.exit(1);
}

function run(cmd, opts = {}) {
  console.log(`\n→ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

function runIn(cwd, cmd) {
  run(cmd, { cwd });
}

// ───────────────────────────────────────────────────────────────────────────
// WEB (includes the monorepo scaffolding for both "web" and "both")
// ───────────────────────────────────────────────────────────────────────────
if (platform === "both" || platform === "web") {
  // 1. shadcn init --monorepo (pipe project name to its interactive prompt)
  run(
    `echo ${JSON.stringify(name)} | pnpm dlx shadcn@latest init --preset ${preset} --template next --monorepo`,
    { cwd: parent }
  );

  // 2. Drop the .npmrc immediately so EVERY subsequent pnpm operation runs
  //    under shamefully-hoist=true. If we wait until after the mobile installs,
  //    we end up mixing hoisting modes and pnpm trips when later commands
  //    (e.g. `pnpm add -Dw culori`) try to mutate a tree that was built under
  //    different rules.
  cpSync(join(TEMPLATES, "root/.npmrc"), join(project, ".npmrc"));

  // 3. Install all shadcn components into packages/ui
  runIn(project, `pnpm dlx shadcn@latest add --all -c packages/ui`);

  // 4. Clone design-system viewer
  runIn(project, `gh repo clone addisonk/create-new-project apps/design-system -- --depth 1`);
  rmSync(join(project, "apps/design-system/.git"), { recursive: true, force: true });

  // 5. Patch design-system (style sync + font sync + sleep 2)
  runIn(project, `node ${JSON.stringify(join(SCRIPTS, "patch-design-system.mjs"))} --root .`);
}

// ───────────────────────────────────────────────────────────────────────────
// MOBILE-ONLY branch (standalone, no monorepo)
// ───────────────────────────────────────────────────────────────────────────
if (platform === "mobile") {
  console.error("mobile-only path: not yet orchestrated by bootstrap.mjs. Use platform=both.");
  process.exit(1);
}

// ───────────────────────────────────────────────────────────────────────────
// MOBILE (add to the monorepo for "both")
// ───────────────────────────────────────────────────────────────────────────
if (platform === "both") {
  const appsDir = join(project, "apps");
  const mobile = join(appsDir, "mobile");

  // 1. Scaffold the Expo app (default template, then pin SDK 55)
  runIn(appsDir, `npx create-expo-app@latest mobile --template default`);
  runIn(mobile, `rm -f package-lock.json`);
  runIn(mobile, `npx expo install expo@~55.0.0`);
  runIn(mobile, `npx expo install --fix`);

  // 2. Install NativeWind v5 + Tailwind v4 + CSS deps + connect (hoisting fix)
  runIn(
    mobile,
    `npx expo install tailwindcss@^4 nativewind@5.0.0-preview.3 react-native-css@^3.0.7 @tailwindcss/postcss tailwind-merge clsx class-variance-authority`
  );
  runIn(mobile, `pnpm add connect buffer`);

  // 3. Bulk install ALL reusables components
  runIn(mobile, `yes | npx @react-native-reusables/cli@latest add -a -y -o || true`);

  // 4. Install @expo/ui, lucide-react-native, react-native-svg
  runIn(mobile, `npx expo install @expo/ui lucide-react-native react-native-svg`);

  // 5. Overlay mobile templates (tw, metro.config, welcome screens, etc.)
  runIn(project, `node ${JSON.stringify(join(SCRIPTS, "install-mobile-templates.mjs"))} --root .`);
}

// ───────────────────────────────────────────────────────────────────────────
// SHARED PACKAGE + ROOT CONFIG
// ───────────────────────────────────────────────────────────────────────────

// Root tsconfig.base.json (the .npmrc was already copied up-front — see
// "step 2" above — so subsequent pnpm operations all ran under the same
// hoisting mode).
cpSync(join(TEMPLATES, "root/tsconfig.base.json"), join(project, "tsconfig.base.json"));

// packages/shared placeholder (both-only)
if (platform === "both") {
  const shared = join(project, "packages/shared");
  mkdirSync(join(shared, "src"), { recursive: true });
  cpSync(join(TEMPLATES, "shared/package.json"), join(shared, "package.json"));
  cpSync(join(TEMPLATES, "shared/src/index.ts"), join(shared, "src/index.ts"));
}

// Vendor sync-mobile-tokens.mjs into the project's scripts/
if (platform === "both") {
  mkdirSync(join(project, "scripts"), { recursive: true });
  cpSync(
    join(SCRIPTS, "sync-mobile-tokens.mjs"),
    join(project, "scripts/sync-mobile-tokens.mjs")
  );
}

// Patch the root package.json (add scripts + pnpm config + culori devDep).
// culori is declared here rather than via a separate `pnpm add -Dw` because
// running `pnpm add` mid-bootstrap against a partially-installed tree was a
// reliable source of hoisting mismatches.
const includeMobile = platform === "both" ? "--include-mobile" : "";
runIn(project, `node ${JSON.stringify(join(SCRIPTS, "patch-root-package.mjs"))} --root . ${includeMobile}`);

// Full install with overrides — this resolves culori (and every other dep)
// under the shamefully-hoist .npmrc already in place.
runIn(project, `CI=true pnpm install --no-frozen-lockfile`);

// Generate mobile/global.css (both only)
if (platform === "both") {
  runIn(project, `pnpm sync:tokens`);
}

// ───────────────────────────────────────────────────────────────────────────
// GIT
// ───────────────────────────────────────────────────────────────────────────
if (!existsSync(join(project, ".git"))) {
  runIn(project, `git init -q`);
}
runIn(project, `git add -A`);
try {
  runIn(project, `git commit -q -m "chore: scaffold cross-platform shadcn + expo monorepo"`);
} catch {
  console.log("(nothing to commit)");
}

console.log(`\n✓ scaffold complete: ${project}`);
