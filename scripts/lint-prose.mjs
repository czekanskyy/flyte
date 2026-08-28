#!/usr/bin/env node
/**
 * House style check: no em-dashes anywhere in the repository.
 *
 * Flyte uses en-dashes (U+2013) throughout. This runs in CI and fails the build
 * on any em-dash (U+2014) in documentation, code, comments or translations.
 *
 * Usage:  node scripts/lint-prose.mjs [--fix]
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FIX = process.argv.includes("--fix");

const SKIP_DIRS = new Set([
  ".git", "node_modules", ".next", ".turbo", "dist", "build",
  "coverage", "playwright-report", "test-results", ".claude", ".pnpm-store",
]);

const CHECK_EXT = new Set([
  ".md", ".mdx", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".yml", ".yaml", ".css", ".html", ".txt",
]);

const EM_DASH = "\u2014";
const EN_DASH = "\u2013";

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP_DIRS.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return CHECK_EXT.has(path.extname(entry.name)) ? [full] : [];
  });
}

let offences = 0;
let filesFixed = 0;

for (const file of walk(ROOT)) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes(EM_DASH)) continue;

  const rel = path.relative(ROOT, file).split(path.sep).join("/");

  if (FIX) {
    fs.writeFileSync(file, text.replaceAll(EM_DASH, EN_DASH), "utf8");
    filesFixed += 1;
    continue;
  }

  text.split("\n").forEach((line, i) => {
    if (!line.includes(EM_DASH)) return;
    offences += 1;
    const col = line.indexOf(EM_DASH) + 1;
    console.error(`${rel}:${i + 1}:${col}  em-dash (U+2014) - use an en-dash (U+2013)`);
    console.error(`    ${line.trim()}`);
  });
}

if (FIX) {
  console.log(`lint:prose - fixed ${filesFixed} file(s)`);
  process.exit(0);
}

if (offences > 0) {
  console.error(`\nlint:prose FAILED - ${offences} em-dash(es) found.`);
  console.error("Run `node scripts/lint-prose.mjs --fix` to correct them.");
  process.exit(1);
}

console.log("lint:prose - clean");
