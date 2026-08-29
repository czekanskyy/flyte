/**
 * Per-user first-run safety acknowledgement (SAFETY.md §1.1, FLY-019).
 *
 * Kept off the Better Auth `user` table on purpose (FLY-012). Re-prompt when
 * the stored version does not match the current product version string.
 */
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

export const safetyAcknowledgement = pgTable("safety_acknowledgement", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  acknowledgedAt: timestamp("acknowledged_at").notNull(),
});
