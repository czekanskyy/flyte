import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main>
      <h1>{t("title")}</h1>
      <p className="tagline">{t("tagline")}</p>
      <p>{t("body")}</p>
    </main>
  );
}
