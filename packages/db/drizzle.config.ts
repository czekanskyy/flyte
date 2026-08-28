import { defineConfig } from "drizzle-kit";
import { requireDatabaseUrl } from "./src/load-env.ts";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: requireDatabaseUrl(),
  },
});
