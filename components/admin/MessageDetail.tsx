"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Trash2 } from "lucide-react";
import type { ContactMessage } from "@/lib/types/contact-message";
import { useLanguage } from "@/lib/i18n/language-context";

export default function MessageDetail({ messageId }: { messageId: string }) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const dateLocale =
    locale === "en" ? "en-GB" : locale === "sq" ? "sq-AL" : "tr-TR";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin/messages/${messageId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setError(t.admin.messageNotFound);
          return;
        }
        const data = (await res.json()) as ContactMessage;
        if (cancelled) return;
        setMessage(data);

        if (!data.read) {
          const patch = await fetch(`/api/admin/messages/${messageId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ read: true }),
          });
          if (patch.ok) {
            const updated = (await patch.json()) as ContactMessage;
            if (!cancelled) setMessage(updated);
          }
        }
      } catch {
        if (!cancelled) setError(t.admin.messageLoadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [messageId, t.admin.messageLoadError, t.admin.messageNotFound]);

  const handleDelete = async () => {
    if (!window.confirm(t.admin.messageDeleteConfirm)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError(t.admin.messageDeleteFail);
        return;
      }
      router.push("/admin/messages");
      router.refresh();
    } catch {
      setError(t.admin.messageDeleteFail);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">{t.admin.loading}</p>;
  }

  if (!message) {
    return (
      <div>
        <p className="text-sm text-red-600">{error || t.admin.messageNotFound}</p>
        <Link
          href="/admin/messages"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.admin.messagesTitle}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/admin/messages"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.admin.messagesTitle}
      </Link>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <article className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{message.subject}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(message.createdAt).toLocaleString(dateLocale)} ·{" "}
              {message.locale.toUpperCase()}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
              message.read
                ? "bg-slate-50 text-slate-600 ring-slate-200"
                : "bg-red-50 text-red-700 ring-red-100"
            }`}
          >
            {message.read ? t.admin.messageRead : t.admin.messageUnread}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {t.admin.messageFrom}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-800">
              {message.name}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {t.admin.emailLabel}
            </dt>
            <dd className="mt-1 text-sm text-slate-800">
              <a
                href={`mailto:${message.email}`}
                className="text-brand hover:underline"
              >
                {message.email}
              </a>
            </dd>
          </div>
          {message.phone ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t.admin.phoneLabel}
              </dt>
              <dd className="mt-1 text-sm text-slate-800">
                <a
                  href={`tel:${message.phone.replace(/\s+/g, "")}`}
                  className="text-brand hover:underline"
                >
                  {message.phone}
                </a>
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
          {message.message}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={`mailto:${message.email}?subject=${encodeURIComponent(message.subject)}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            <Mail className="h-4 w-4" />
            {t.admin.messageReply}
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDelete()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {t.admin.messageDelete}
          </button>
        </div>
      </article>
    </div>
  );
}
