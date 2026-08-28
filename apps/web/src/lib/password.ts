import argon2 from "argon2";

/**
 * Argon2id hashing for Better Auth. The library's default algorithm is scrypt
 * (Better Auth 1.7.2 email/password docs); ADR 0005 requires Argon2id.
 *
 * Cost parameters are argon2 0.45 defaults (memoryCost 65536, timeCost 3,
 * parallelism 4), matching the Better Auth docs' custom-hashing example.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(data: { password: string; hash: string }): Promise<boolean> {
  return argon2.verify(data.hash, data.password);
}
