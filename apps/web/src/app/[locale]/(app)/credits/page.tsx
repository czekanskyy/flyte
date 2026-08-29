import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CreditsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("credits");

  return (
    <main className="panel">
      <h1>{t("title")}</h1>
      <p className="tagline">{t("intro")}</p>
      <h2>{t("openaipTitle")}</h2>
      <p>{t("openaipBody")}</p>
      <h2>{t("pansaTitle")}</h2>
      <p>
        {t("pansaBody")}{" "}
        <a href={t("pansaHref")} rel="noreferrer" target="_blank">
          {t("pansaLink")}
        </a>
      </p>
      <h2>{t("weatherTitle")}</h2>
      <p>{t("weatherBody")}</p>
      <h2>{t("airacTitle")}</h2>
      <p>{t("airacBody")}</p>
      <h2>{t("printTitle")}</h2>
      <p>{t("printBody")}</p>
    </main>
  );
}
