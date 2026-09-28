"use client";

import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { conceptCopy, type ConceptVersion } from "@/config/concepts";
import { useLocale } from "@/lib/locale-context";
import { pick, type Bilingual, type TranslationKey } from "@/lib/i18n";
import { mailtoHref } from "@/lib/mailto";

/** Map a live-site href ("/weddings") into a concept ("/v2/weddings"). */
export function conceptHref(version: ConceptVersion, href: string): string {
  const [path, hash] = href.split("#");
  const base = path === "/" ? `/v${version}` : `/v${version}${path}`;
  return hash ? `${base}#${hash}` : base;
}

/** The page path without its /vN prefix ("/v2/weddings" → "/weddings"). */
export function stripConcept(pathname: string | null): string {
  const rest = (pathname ?? "/").replace(/^\/v[123](?=\/|$)/, "");
  return rest === "" ? "/" : rest;
}

export { mailtoHref };

/** Nav items for a concept, with active state resolved against the current path. */
export function useConceptNav(version: ConceptVersion) {
  const pathname = usePathname();
  const current = stripConcept(pathname);
  const { t } = useLocale();
  return siteConfig.mainNav.map((item) => ({
    href: conceptHref(version, item.href),
    label: item.i18nKey ? t(item.i18nKey as TranslationKey) : item.title,
    active: current === item.href,
  }));
}

export type ContactLink = {
  id: "email" | "instagram" | "etsy" | "zola";
  label: string;
  short: string;
  href: string;
  external: boolean;
};

/** Every conversion path on the site: email, Instagram, Etsy, Zola. */
export function useContactLinks(): ContactLink[] {
  const { locale, t } = useLocale();
  const p = (v: Bilingual) => pick(v, locale);
  return [
    { id: "email", label: t("cta.emailJanelle"), short: t("cta.email"), href: mailtoHref(p(conceptCopy.mailSubject)), external: false },
    { id: "instagram", label: t("cta.instagram"), short: "Instagram", href: siteConfig.instagram.profileUrl, external: true },
    { id: "etsy", label: t("cta.etsyShop"), short: "Etsy", href: siteConfig.etsyStore.url, external: true },
    { id: "zola", label: p(conceptCopy.zolaCta), short: "Zola", href: siteConfig.zola.vendorUrl, external: true },
  ];
}

/** Shorthand: `const p = usePick(); p(siteConfig.hero.headline)`. */
export function usePick() {
  const { locale } = useLocale();
  return (v: Bilingual) => pick(v, locale);
}

export function externalProps(external: boolean) {
  return external ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
