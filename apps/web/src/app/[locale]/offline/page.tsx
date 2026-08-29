import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppChrome } from "../../../components/app-chrome.tsx";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OfflinePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pwa");

  return (
    <AppChrome>
      <main className="panel">
        <h1>{t("offlineTitle")}</h1>
        <p>{t("offlineBody")}</p>
      </main>
    </AppChrome>
  );
}
