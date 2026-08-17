import { list, put } from "@vercel/blob";
import type { ContactMessage } from "@/lib/types/contact-message";

const BLOB_PATH = "odonexo/contact-messages.json";

function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

export function isContactMessagesBlobEnabled(): boolean {
  return Boolean(blobToken());
}

export async function readContactMessagesFromBlob(): Promise<
  ContactMessage[] | null
> {
  const token = blobToken();
  if (!token) return null;

  try {
    const { blobs } = await list({
      prefix: BLOB_PATH,
      limit: 10,
      token,
    });
    const exact =
      blobs.find((b) => b.pathname === BLOB_PATH) ||
      blobs.find((b) => b.pathname.endsWith("contact-messages.json"));
    if (!exact?.url) return null;

    const res = await fetch(exact.url, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as ContactMessage[];
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.error("Blob iletişim mesajı okuma hatası:", err);
    return null;
  }
}

export async function writeContactMessagesToBlob(
  messages: ContactMessage[]
): Promise<boolean> {
  const token = blobToken();
  if (!token) return false;

  try {
    await put(BLOB_PATH, JSON.stringify(messages, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token,
      cacheControlMaxAge: 0,
    });
    return true;
  } catch (err) {
    console.error("Blob iletişim mesajı yazma hatası:", err);
    return false;
  }
}
