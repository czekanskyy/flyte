import { eq } from "drizzle-orm";
import { getDb } from "./client.ts";
import { safetyAcknowledgement } from "./schema/safety-ack.ts";

export async function getSafetyAckVersion(userId: string): Promise<string | null> {
  const rows = await getDb()
    .select({ version: safetyAcknowledgement.version })
    .from(safetyAcknowledgement)
    .where(eq(safetyAcknowledgement.userId, userId))
    .limit(1);
  return rows[0]?.version ?? null;
}

export async function recordSafetyAck(input: {
  userId: string;
  version: string;
  acknowledgedAt: Date;
}): Promise<void> {
  await getDb()
    .insert(safetyAcknowledgement)
    .values({
      userId: input.userId,
      version: input.version,
      acknowledgedAt: input.acknowledgedAt,
    })
    .onConflictDoUpdate({
      target: safetyAcknowledgement.userId,
      set: {
        version: input.version,
        acknowledgedAt: input.acknowledgedAt,
      },
    });
}
