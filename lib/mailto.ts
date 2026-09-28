import { siteConfig } from "@/config/site";

/** `mailto:` link to the studio inbox with a pre-filled subject (and optional body). */
export function mailtoHref(subject: string, body?: string): string {
  const params = [`subject=${encodeURIComponent(subject)}`];
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${siteConfig.contactEmail}?${params.join("&")}`;
}
