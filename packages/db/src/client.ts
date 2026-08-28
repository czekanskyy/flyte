import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { requireDatabaseUrl } from "./load-env.ts";
import * as schema from "./schema/index.ts";

export function getDb() {
  const sql = neon(requireDatabaseUrl());
  return drizzle({ client: sql, schema });
}
