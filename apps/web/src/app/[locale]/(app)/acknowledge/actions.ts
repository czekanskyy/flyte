"use server";

import { getSafetyAckVersion, recordSafetyAck } from "@flyte/db";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "../../../../i18n/navigation.ts";
import { getAuth } from "../../../../lib/auth.ts";
import { planningIsAllowed, SAFETY_ACK_VERSION } from "../../../../lib/safety-ack.ts";

export async function acceptSafetyAcknowledgement() {
  const locale = await getLocale();
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect({ href: "/login", locale });
    return;
  }

  const existing = await getSafetyAckVersion(session.user.id);
  if (!planningIsAllowed(existing)) {
    await recordSafetyAck({
      userId: session.user.id,
      version: SAFETY_ACK_VERSION,
      acknowledgedAt: new Date(),
    });
  }

  redirect({ href: "/plan", locale });
}
