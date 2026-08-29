import { sql } from "drizzle-orm";
import { getDb } from "./client.ts";
import { user } from "./schema/auth.ts";

export async function userExistsByEmail(email: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: user.id })
    .from(user)
    .where(sql`lower(${user.email}) = ${email}`)
    .limit(1);
  return Boolean(rows[0]);
}
