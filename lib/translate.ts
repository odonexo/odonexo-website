export type Lang = "tr" | "sq" | "en";

const memoryCache = new Map<string, string>();
const TRANSLATE_TIMEOUT_MS = 8_000;

function cacheKey(text: string, from: Lang, to: Lang) {
  return `${from}|${to}|${text}`;
}

/** Metni sunucu API üzerinden çevirir; zaman aşımı / hata olursa orijinali döner. */
export async function translateText(
  text: string,
  from: Lang,
  to: Lang
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || from === to) return text;

  const key = cacheKey(trimmed, from, to);
  const cached = memoryCache.get(key);
  if (cached) return cached;

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed, from, to }),
      signal: AbortSignal.timeout(TRANSLATE_TIMEOUT_MS),
    });

    if (res.ok) {
      const data = await res.json();
      const translated =
        typeof data.translated === "string" ? data.translated : trimmed;
      memoryCache.set(key, translated);
      return translated;
    }
  } catch {
    /* timeout / network — kaydı engelleme */
  }

  return text;
}
