import { Button } from "@flyte/ui";
import { getSafetyAckVersion } from "@flyte/db";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "../../../../i18n/navigation.ts";
import { getAuth } from "../../../../lib/auth.ts";
import { planningIsAllowed } from "../../../../lib/safety-ack.ts";
import { acceptSafetyAcknowledgement } from "./actions.ts";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AcknowledgePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("safety");
  const tPlan = await getTranslations("plan");
  const session = await getAuth().api.getSession({ headers: await headers() });
  const version = session ? await getSafetyAckVersion(session.user.id) : null;
  const accepted = planningIsAllowed(version);

  return (
    <main className="panel">
      <h1>{t("title")}</h1>
      <p>{t("statement")}</p>
      {accepted ? (
        <>
          <p className="tagline">{t("alreadyAccepted")}</p>
          <p>
            <Link href="/plan">{tPlan("title")}</Link>
          </p>
        </>
      ) : (
        <form action={acceptSafetyAcknowledgement}>
          <Button type="submit">{t("accept")}</Button>
        </form>
      )}
    </main>
  );
}
