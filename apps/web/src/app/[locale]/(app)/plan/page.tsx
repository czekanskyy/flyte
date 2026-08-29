import { getSafetyAckVersion } from "@flyte/db";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "../../../../i18n/navigation.ts";
import { getAuth } from "../../../../lib/auth.ts";
import { planningDestination } from "../../../../lib/safety-ack.ts";
import { ManualOfpForm } from "./manual-ofp-form.tsx";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PlanPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect({ href: "/login", locale });
  }

  const version = session ? await getSafetyAckVersion(session.user.id) : null;
  const destination = planningDestination(version);
  if (destination !== "/plan") {
    redirect({ href: destination, locale });
  }

  const t = await getTranslations("plan");

  return (
    <main className="panel">
      <h1>{t("title")}</h1>
      <p className="tagline">{t("lead")}</p>
      <p className="ofp-note">{t("frame")}</p>
      <ManualOfpForm />
    </main>
  );
}
