import nodemailer from "nodemailer";
import type { ContactMessage } from "@/lib/types/contact-message";
import type { SiteSettings } from "@/lib/types/site-settings";
import { resolveSmtp } from "@/lib/order-email";
import { sendTelegramContactNotification } from "@/lib/telegram-notify";

export async function sendContactMessageEmail(
  message: ContactMessage,
  settings: SiteSettings
): Promise<{ ok: boolean; error?: string }> {
  const to = settings.email?.trim();
  if (!to) {
    return { ok: false, error: "İşletme e-posta adresi yok" };
  }

  const smtp = resolveSmtp(settings);
  if (!smtp.host || !smtp.user || !smtp.pass || !smtp.from) {
    return {
      ok: false,
      error: "SMTP ayarları eksik",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    const text = [
      "odonexo.com iletişim formundan yeni mesaj:",
      "",
      `Ad Soyad: ${message.name}`,
      `E-posta: ${message.email}`,
      `Telefon: ${message.phone}`,
      `Konu: ${message.subject}`,
      `Dil: ${message.locale.toUpperCase()}`,
      `Tarih: ${message.createdAt}`,
      "",
      message.message,
    ].join("\n");

    await transporter.sendMail({
      from: smtp.from,
      to,
      replyTo: message.email,
      subject: `Yeni iletişim mesajı — ${message.subject}`,
      text,
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "E-posta gönderilemedi",
    };
  }
}

export async function sendContactMessageNotifications(
  message: ContactMessage,
  settings: SiteSettings
): Promise<void> {
  try {
    await sendTelegramContactNotification(message, settings);
  } catch (err) {
    console.error("İletişim Telegram bildirimi hatası:", err);
  }

  try {
    await sendContactMessageEmail(message, settings);
  } catch (err) {
    console.error("İletişim e-posta bildirimi hatası:", err);
  }
}
