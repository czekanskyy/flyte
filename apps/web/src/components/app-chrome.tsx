import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "../i18n/navigation.ts";
import { LanguageSwitch } from "./language-switch.tsx";

type Props = {
  children: ReactNode;
};

export async function AppChrome({ children }: Props) {
  const t = await getTranslations("nav");
  const tApp = await getTranslations();

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" href="/">
          {tApp("appName")}
        </Link>
        <nav className="nav" aria-label={tApp("appName")}>
          <Link href="/">{t("home")}</Link>
          <Link href="/login">{t("signIn")}</Link>
          <LanguageSwitch />
        </nav>
      </header>
      {children}
    </div>
  );
}
