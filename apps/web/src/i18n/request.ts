import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing.ts";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const common = (await import(`../../../../messages/${locale}/common.json`)).default;
  const auth = (await import(`../../../../messages/${locale}/auth.json`)).default;
  const theme = (await import(`../../../../messages/${locale}/theme.json`)).default;
  const safety = (await import(`../../../../messages/${locale}/safety.json`)).default;
  const credits = (await import(`../../../../messages/${locale}/credits.json`)).default;
  const pwa = (await import(`../../../../messages/${locale}/pwa.json`)).default;
  const plan = (await import(`../../../../messages/${locale}/plan.json`)).default;

  return {
    locale,
    messages: { ...common, ...auth, ...theme, ...safety, ...credits, ...pwa, ...plan },
  };
});
