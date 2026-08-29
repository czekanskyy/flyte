import { userExistsByEmail } from "@flyte/db";
import { NextResponse } from "next/server";
import { isAuthConfigured } from "../../../../lib/auth.ts";
import { normalizeLoginEmail } from "../../../../lib/login-email.ts";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ exists: false }, { status: 400 });
  }

  const email = normalizeLoginEmail(
    body && typeof body === "object" && "email" in body ? body.email : undefined,
  );
  if (!email) {
    return NextResponse.json({ exists: false }, { status: 400 });
  }

  if (!isAuthConfigured()) {
    return NextResponse.json({ exists: false }, { status: 503 });
  }

  const exists = await userExistsByEmail(email);
  return NextResponse.json({ exists });
}
