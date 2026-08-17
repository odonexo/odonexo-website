"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { useSiteSettings } from "@/lib/site-settings-context";
import { pickLocalized } from "@/lib/localized-content";

type PolicyType = "shipping" | "returns" | "privacy";

export default function PolicyPageContent({ type }: { type: PolicyType }) {
  const { t, locale } = useLanguage();
  const settings = useSiteSettings();

  const contentByType = {
    shipping: {
      title: t.footer.shipping,
      content: pickLocalized(
        locale,
        settings.shippingPolicySq,
        settings.shippingPolicyEn,
        settings.shippingPolicy
      ),
    },
    returns: {
      title: t.footer.returns,
      content: pickLocalized(
        locale,
        settings.returnsPolicySq,
        settings.returnsPolicyEn,
        settings.returnsPolicy
      ),
    },
    privacy: {
      title: t.footer.privacy,
      content: pickLocalized(
        locale,
        settings.privacyPolicySq,
        settings.privacyPolicyEn,
        settings.privacyPolicy
      ),
    },
  };

  const policy = contentByType[type];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        odonexo.com
      </Link>
      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <h1 className="text-3xl font-bold text-slate-900">{policy.title}</h1>
        <div className="mt-6 whitespace-pre-line leading-7 text-slate-600">
          {policy.content}
        </div>
      </article>
    </div>
  );
}
