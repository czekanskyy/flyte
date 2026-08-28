import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAuth, getAuthFeatures, isAuthConfigured } from "../../../../lib/auth.ts";
import { AuthForms } from "./auth-forms.tsx";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const features = getAuthFeatures();

  let email = "";
  let signedIn = false;
  if (isAuthConfigured()) {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (session) {
      signedIn = true;
      email = session.user.email;
    }
  }

  return (
    <main className="panel">
      <h1>{signedIn ? t("accountTitle") : t("signInTitle")}</h1>
      <AuthForms features={features} signedIn={signedIn} email={email} />
    </main>
  );
}
