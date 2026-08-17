import { promises as fs } from "fs";
import path from "path";
import type { ContactMessage } from "@/lib/types/contact-message";
import { getReadableDataDir, getWritableDataDir } from "@/lib/data-paths";
import {
  isContactMessagesBlobEnabled,
  readContactMessagesFromBlob,
  writeContactMessagesToBlob,
} from "@/lib/contact-messages-blob";

function messagesPath(dir: string) {
  return path.join(dir, "contact-messages.json");
}

const globalStore = globalThis as typeof globalThis & {
  __odonexoContactMessagesCache?: ContactMessage[];
};

function normalizeMessage(raw: ContactMessage): ContactMessage {
  return {
    id: String(raw.id || ""),
    name: String(raw.name || "").trim(),
    email: String(raw.email || "").trim(),
    phone: String(raw.phone || "").trim(),
    subject: String(raw.subject || "").trim(),
    message: String(raw.message || "").trim(),
    locale: raw.locale === "en" || raw.locale === "tr" ? raw.locale : "sq",
    read: Boolean(raw.read),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt,
  };
}

function mergeMessageLists(
  ...lists: (ContactMessage[] | null | undefined)[]
): ContactMessage[] {
  const map = new Map<string, ContactMessage>();

  for (const list of lists) {
    if (!list) continue;
    for (const raw of list) {
      const message = normalizeMessage(raw);
      if (!message.id) continue;
      const existing = map.get(message.id);
      if (!existing) {
        map.set(message.id, message);
        continue;
      }
      const existingTime = new Date(
        existing.updatedAt || existing.createdAt
      ).getTime();
      const nextTime = new Date(
        message.updatedAt || message.createdAt
      ).getTime();
      if (nextTime >= existingTime) {
        map.set(message.id, message);
      }
    }
  }

  return Array.from(map.values());
}

async function readMessagesFrom(file: string): Promise<ContactMessage[] | null> {
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw) as ContactMessage[];
    if (!Array.isArray(parsed)) return null;
    return parsed.map(normalizeMessage);
  } catch {
    return null;
  }
}

async function readAllMessagesRaw(): Promise<ContactMessage[]> {
  const fromBlob = isContactMessagesBlobEnabled()
    ? await readContactMessagesFromBlob()
    : null;
  const fromWritable = await readMessagesFrom(
    messagesPath(getWritableDataDir())
  );
  const fromRepo = await readMessagesFrom(messagesPath(getReadableDataDir()));
  const fromMemory = globalStore.__odonexoContactMessagesCache || null;

  const merged = mergeMessageLists(
    fromRepo,
    fromWritable,
    fromMemory,
    fromBlob
  );
  globalStore.__odonexoContactMessagesCache = merged;
  return merged;
}

async function writeMessages(messages: ContactMessage[]): Promise<void> {
  const normalized = messages.map(normalizeMessage);
  globalStore.__odonexoContactMessagesCache = normalized;

  if (isContactMessagesBlobEnabled()) {
    const ok = await writeContactMessagesToBlob(normalized);
    if (!ok) {
      console.error("Blob yazılamadı — yerel /tmp yedeğine devam");
    }
  }

  const dir = getWritableDataDir();
  const file = messagesPath(dir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(normalized, null, 2), "utf-8");

  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    try {
      const repoDir = getReadableDataDir();
      await fs.mkdir(repoDir, { recursive: true });
      await fs.writeFile(
        messagesPath(repoDir),
        JSON.stringify(normalized, null, 2),
        "utf-8"
      );
    } catch {
      /* ignore */
    }
  }
}

export async function readAllContactMessages(): Promise<ContactMessage[]> {
  const messages = await readAllMessagesRaw();
  return messages.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getContactMessageById(
  id: string
): Promise<ContactMessage | null> {
  const messages = await readAllMessagesRaw();
  return messages.find((m) => m.id === id) || null;
}

export async function countUnreadContactMessages(): Promise<number> {
  const messages = await readAllMessagesRaw();
  return messages.filter((m) => !m.read).length;
}

export async function saveContactMessage(
  message: ContactMessage
): Promise<ContactMessage> {
  const messages = await readAllMessagesRaw();
  const next: ContactMessage = {
    ...normalizeMessage(message),
    updatedAt: message.updatedAt || new Date().toISOString(),
  };

  const withoutDup = messages.filter((m) => m.id !== next.id);
  withoutDup.unshift(next);

  try {
    await writeMessages(withoutDup);
  } catch (err) {
    console.error("İletişim mesajı dosyaya yazılamadı:", err);
    globalStore.__odonexoContactMessagesCache = withoutDup;
  }

  return next;
}

export async function updateContactMessage(
  id: string,
  patch: { read?: boolean }
): Promise<ContactMessage | null> {
  const messages = await readAllMessagesRaw();
  const index = messages.findIndex((m) => m.id === id);
  if (index === -1) return null;

  messages[index] = {
    ...messages[index],
    read: patch.read !== undefined ? Boolean(patch.read) : messages[index].read,
    updatedAt: new Date().toISOString(),
  };

  try {
    await writeMessages(messages);
  } catch (err) {
    console.error("İletişim mesajı güncellenemedi:", err);
    globalStore.__odonexoContactMessagesCache = messages;
  }

  return messages[index];
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const messages = await readAllMessagesRaw();
  const next = messages.filter((m) => m.id !== id);
  if (next.length === messages.length) return false;

  try {
    await writeMessages(next);
  } catch (err) {
    console.error("İletişim mesajı silinemedi:", err);
    globalStore.__odonexoContactMessagesCache = next;
  }

  return true;
}
