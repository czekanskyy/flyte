import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { getAuth, getAuthFeatures, isAuthConfigured } from "../../../../lib/auth.ts";
import { AuthForms } from "./auth-forms.tsx";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
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
      <AuthForms features={features} signedIn={signedIn} email={email} />
    </main>
  );
}
