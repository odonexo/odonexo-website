"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, Mail, RefreshCw, Search, Trash2 } from "lucide-react";
import type { ContactMessage } from "@/lib/types/contact-message";
import { useLanguage } from "@/lib/i18n/language-context";

type ReadFilter = "all" | "unread" | "read";

const POLL_MS = 10_000;

export default function MessageList() {
  const pathname = usePathname();
  const { t, locale } = useLanguage();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const dateLocale =
    locale === "en" ? "en-GB" : locale === "sq" ? "sq-AL" : "tr-TR";

  const loadMessages = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      if (!silent) setError("");

      try {
        const res = await fetch(`/api/admin/messages?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        if (!res.ok) {
          if (!silent) setError(t.admin.messageLoadError);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          if (!silent) setError(t.admin.messageLoadError);
          return;
        }
        setMessages(data as ContactMessage[]);
      } catch {
        if (!silent) setError(t.admin.messageLoadError);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t.admin.messageLoadError]
  );

  useEffect(() => {
    if (!pathname.startsWith("/admin/messages")) return;
    void loadMessages();
  }, [pathname, loadMessages]);

  useEffect(() => {
    if (!pathname.startsWith("/admin/messages")) return;
    const id = window.setInterval(() => void loadMessages(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [pathname, loadMessages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((m) => {
      if (readFilter === "unread" && m.read) return false;
      if (readFilter === "read" && !m.read) return false;
      if (!q) return true;
      return [m.name, m.email, m.phone, m.subject, m.message, m.id]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [messages, query, readFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.admin.messageDeleteConfirm)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError(t.admin.messageDeleteFail);
        return;
      }
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError(t.admin.messageDeleteFail);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.admin.messageSearch}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <select
          value={readFilter}
          onChange={(e) => setReadFilter(e.target.value as ReadFilter)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="all">{t.admin.messageFilterAll}</option>
          <option value="unread">{t.admin.messageFilterUnread}</option>
          <option value="read">{t.admin.messageFilterRead}</option>
        </select>
        <button
          type="button"
          onClick={() => void loadMessages()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {t.admin.orderRefresh}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">{t.admin.loading}</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {messages.length === 0 ? t.admin.messageEmpty : t.admin.messageNoMatch}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
            {filtered.length} {t.admin.messageShowing}
          </p>
          <ul className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <li
                key={m.id}
                className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                  m.read ? "bg-white" : "bg-sky-50/60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{m.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
                        m.read
                          ? "bg-slate-50 text-slate-600 ring-slate-200"
                          : "bg-red-50 text-red-700 ring-red-100"
                      }`}
                    >
                      {m.read ? t.admin.messageRead : t.admin.messageUnread}
                    </span>
                  </div>
                  <p className="truncate text-sm text-slate-600">{m.subject}</p>
                  <p className="text-xs text-slate-500">
                    {m.email}
                    {m.phone ? ` · ${m.phone}` : ""} ·{" "}
                    {new Date(m.createdAt).toLocaleString(dateLocale)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/messages/${m.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t.admin.orderDetail}
                  </Link>
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(m.subject)}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {t.admin.messageReply}
                  </a>
                  <button
                    type="button"
                    disabled={busyId === m.id}
                    onClick={() => void handleDelete(m.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t.admin.messageDelete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
