#!/usr/bin/env node
/**
 * House style check: no em-dashes anywhere in the repository.
 *
 * Flyte uses en-dashes (U+2013) throughout. This runs in CI and fails the build
 * on any em-dash (U+2014) in documentation, code, comments, config or translations.
 *
 * Scope comes from `git ls-files`, not from a list of extensions. An allowlist
 * silently misses whatever nobody remembered to add - dotfiles, Dockerfiles,
 * .env.example - and a gate with a blind spot is worse than no gate, because it
 * reports success. Deriving the file list from the repository means new file
 * types are covered the moment they are committed, and gitignored files are
 * excluded for free.
 *
 * Usage:  node scripts/lint-prose.mjs [--fix]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const FIX = process.argv.includes("--fix");

// Built from codepoints, never written literally: this file is scanned by its own
// rule, and --fix would otherwise rewrite these constants and silently disarm the
// tool - leaving a check that passes because it compares a character to itself.
const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);

/** Extensions that are binary by nature. Content sniffing catches the rest. */
const BINARY_EXT = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".bmp",
  ".pdf", ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".zip", ".gz", ".tar", ".7z", ".mp4", ".webm", ".mp3", ".wav",
  ".mbtiles", ".pmtiles", ".tif", ".tiff",
]);

function trackedFiles() {
  try {
    return execFileSync("git", ["ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
      .split("\0")
      .filter(Boolean);
  } catch (error) {
    console.error("lint:prose - could not run `git ls-files`. Is this a git repository?");
    console.error(String(error.message || error));
    process.exit(2);
  }
}

/** A NUL byte in the first 8 KB is the usual heuristic for "not text". */
function isBinary(buffer) {
  return buffer.subarray(0, 8192).includes(0);
}

let offences = 0;
let filesFixed = 0;
let filesScanned = 0;

for (const file of trackedFiles()) {
  if (BINARY_EXT.has(path.extname(file).toLowerCase())) continue;
  if (!fs.existsSync(file)) continue; // staged deletion

  const buffer = fs.readFileSync(file);
  if (isBinary(buffer)) continue;

  filesScanned += 1;
  const text = buffer.toString("utf8");
  if (!text.includes(EM_DASH)) continue;

  if (FIX) {
    fs.writeFileSync(file, text.replaceAll(EM_DASH, EN_DASH), "utf8");
    filesFixed += 1;
    console.log(`fixed  ${file}`);
    continue;
  }

  text.split("\n").forEach((line, i) => {
    if (!line.includes(EM_DASH)) return;
    offences += 1;
    console.error(
      `${file}:${i + 1}:${line.indexOf(EM_DASH) + 1}  em-dash (U+2014) - use an en-dash (U+2013)`
    );
    console.error(`    ${line.trim()}`);
  });
}

if (FIX) {
  console.log(`lint:prose - fixed ${filesFixed} file(s) of ${filesScanned} scanned`);
  process.exit(0);
}

if (offences > 0) {
  console.error(`\nlint:prose FAILED - ${offences} em-dash(es) across ${filesScanned} tracked files.`);
  console.error("Run `node scripts/lint-prose.mjs --fix` to correct them.");
  process.exit(1);
}

console.log(`lint:prose - clean (${filesScanned} tracked files)`);
