#!/usr/bin/env node
// Decide whether to bump the plugin version based on conventional commits
// since the last v<version> tag, and write the new version into both
// .claude-plugin/plugin.json and .claude-plugin/marketplace.json.
//
// Outputs (for GitHub Actions):
//   bumped=true|false
//   from=<old version>
//   to=<new version>
//   level=major|minor|patch|none
//
// Local usage: `node scripts/auto-bump.mjs` (dry-run logs only if no GITHUB_OUTPUT).

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";

const PLUGIN = ".claude-plugin/plugin.json";
const MARKET = ".claude-plugin/marketplace.json";
const CODEX = ".codex-plugin/plugin.json";

const sh = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();
const tryRun = (cmd) => {
  try { return sh(cmd); } catch { return null; }
};

const setOutput = (key, value) => {
  console.log(`${key}=${value}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
};

const plugin = JSON.parse(readFileSync(PLUGIN, "utf8"));
const market = JSON.parse(readFileSync(MARKET, "utf8"));
const current = plugin.version;
const tag = `v${current}`;

setOutput("from", current);

const tagSha = tryRun(`git rev-parse --verify ${tag}`);
if (!tagSha) {
  console.log(`No baseline tag ${tag} exists. Skipping bump — create the tag once to start tracking.`);
  setOutput("bumped", "false");
  setOutput("level", "none");
  setOutput("to", current);
  process.exit(0);
}

const log = tryRun(`git log ${tag}..HEAD --pretty=format:%s%n%b%n----END----`);
if (!log) {
  console.log(`No commits since ${tag}.`);
  setOutput("bumped", "false");
  setOutput("level", "none");
  setOutput("to", current);
  process.exit(0);
}

const messages = log
  .split("----END----")
  .map((m) => m.trim())
  .filter(Boolean);

const breakingRe = /^[a-z]+(\([^)]*\))?!:|BREAKING CHANGE/m;
const featRe = /^feat(\([^)]*\))?!?:/m;
const fixRe = /^(fix|perf)(\([^)]*\))?!?:/m;

let level = "none";
for (const msg of messages) {
  if (breakingRe.test(msg)) { level = "major"; break; }
  if (featRe.test(msg)) { if (level === "none" || level === "patch") level = "minor"; }
  else if (fixRe.test(msg)) { if (level === "none") level = "patch"; }
}

if (level === "none") {
  console.log("Only docs/chore/refactor/style/test commits since last release. Skipping.");
  setOutput("bumped", "false");
  setOutput("level", "none");
  setOutput("to", current);
  process.exit(0);
}

const [maj, min, pat] = current.split(".").map(Number);
const next =
  level === "major" ? `${maj + 1}.0.0` :
  level === "minor" ? `${maj}.${min + 1}.0` :
                      `${maj}.${min}.${pat + 1}`;

plugin.version = next;
market.plugins[0].version = next;
writeFileSync(PLUGIN, JSON.stringify(plugin, null, 2) + "\n");
writeFileSync(MARKET, JSON.stringify(market, null, 2) + "\n");

if (existsSync(CODEX)) {
  const codex = JSON.parse(readFileSync(CODEX, "utf8"));
  codex.version = next;
  writeFileSync(CODEX, JSON.stringify(codex, null, 2) + "\n");
}

console.log(`Bumping ${current} -> ${next} (${level})`);
setOutput("bumped", "true");
setOutput("level", level);
setOutput("to", next);
