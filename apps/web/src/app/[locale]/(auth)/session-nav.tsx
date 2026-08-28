"use client";

import { useTranslations } from "next-intl";
import { authClient } from "../../../lib/auth-client.ts";
import { Link, usePathname, useRouter } from "../../../i18n/navigation.ts";
import "./login/auth-forms.css";

export function SessionNav() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const session = authClient.useSession();

  if (session.isPending) {
    return null;
  }

  if (session.data) {
    return (
      <button
        type="button"
        disabled={session.isPending}
        onClick={() => {
          void authClient.signOut().then(() => {
            router.push("/login");
            router.refresh();
          });
        }}
      >
        {t("signOut")}
      </button>
    );
  }

  if (pathname === "/login") {
    return null;
  }

  return <Link href="/login">{tNav("signIn")}</Link>;
}
