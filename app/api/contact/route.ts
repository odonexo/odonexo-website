import { NextResponse } from "next/server";
import { readSiteSettings } from "@/lib/site-settings-store";
import { saveContactMessage } from "@/lib/contact-messages-store";
import { sendContactMessageNotifications } from "@/lib/contact-notify";
import type { ContactMessageInput } from "@/lib/types/contact-message";
import type { Locale } from "@/lib/i18n/translations";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 120;
const MAX_PHONE = 40;
const MAX_SUBJECT = 160;
const MAX_MESSAGE = 4000;

function normalizeLocale(value: unknown): Locale {
  if (value === "en" || value === "tr" || value === "sq") return value;
  return "sq";
}

export async function POST(request: Request) {
  let body: ContactMessageInput;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();
  const locale = normalizeLocale(body.locale);

  if (!name || !email || !phone || !subject || !message) {
    return NextResponse.json(
      { error: "Ad, e-posta, telefon, konu ve mesaj zorunludur" },
      { status: 400 }
    );
  }

  if (
    name.length > MAX_NAME ||
    phone.length > MAX_PHONE ||
    subject.length > MAX_SUBJECT
  ) {
    return NextResponse.json({ error: "Alanlar çok uzun" }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: "Mesaj çok uzun" },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Geçerli bir e-posta girin" },
      { status: 400 }
    );
  }

  const saved = await saveContactMessage({
    id: `MSG-${Date.now()}`,
    name,
    email,
    phone,
    subject,
    message,
    locale,
    read: false,
    createdAt: new Date().toISOString(),
  });

  try {
    const settings = await readSiteSettings();
    await sendContactMessageNotifications(saved, settings);
  } catch (err) {
    console.error("İletişim bildirimi hatası:", err);
  }

  return NextResponse.json({ success: true, id: saved.id });
}
