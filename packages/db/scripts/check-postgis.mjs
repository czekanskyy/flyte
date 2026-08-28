/**
 * Confirms PostGIS is enabled on DATABASE_URL (the Neon dev branch).
 * Prints only the PostGIS version string, never the connection URL.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const file = resolve(repoRoot, name);
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      if (process.env[key] !== undefined) continue;
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

loadEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL is not set. Copy .env.example to .env.local (Neon dev branch).",
  );
  process.exit(2);
}

const sql = neon(url);
const rows = await sql`SELECT PostGIS_Version() AS version`;
const version = rows[0]?.version;
if (!version) {
  console.error("PostGIS_Version() returned no row. Is the fly012 migration applied?");
  process.exit(1);
}
console.log(`PostGIS ${version}`);
