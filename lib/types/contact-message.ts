import type { Locale } from "@/lib/i18n/translations";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  locale: Locale;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  locale?: Locale;
}
