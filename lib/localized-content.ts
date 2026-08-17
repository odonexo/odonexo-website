import type { Locale } from "@/lib/i18n/translations";

/** Dil sırası: istenen dil → diğerleri. */
export function pickLocalized(
  locale: Locale,
  sq: string,
  en: string,
  tr: string
): string {
  const s = sq.trim();
  const e = en.trim();
  const t = tr.trim();
  if (locale === "sq") return s || e || t;
  if (locale === "en") return e || s || t;
  return t || e || s;
}
