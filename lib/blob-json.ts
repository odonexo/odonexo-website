import { get, put } from "@vercel/blob";

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

export function isBlobJsonEnabled(): boolean {
  return Boolean(blobToken() || process.env.BLOB_STORE_ID?.trim());
}

/**
 * Sabit pathname ile private JSON oku.
 * list() kullanmaz → Advanced Operations tüketmez.
 */
export async function readJsonFromBlob<T>(
  pathname: string
): Promise<T | null> {
  const token = blobToken();
  try {
    const result = await get(pathname, {
      access: "private",
      ...(token ? { token } : {}),
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const text = await new Response(result.stream).text();
    if (!text.trim()) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    console.error(`Blob JSON okuma hatası (${pathname}):`, err);
    return null;
  }
}

export async function writeJsonToBlob(
  pathname: string,
  data: unknown
): Promise<boolean> {
  const token = blobToken();
  try {
    await put(pathname, JSON.stringify(data, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 0,
      ...(token ? { token } : {}),
    });
    return true;
  } catch (err) {
    console.error(`Blob JSON yazma hatası (${pathname}):`, err);
    return false;
  }
}
