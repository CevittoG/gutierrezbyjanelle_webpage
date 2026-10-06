import { siteConfig } from "@/config/site";
import { faqSections, faqs } from "@/config/faq";

// /llms.txt: a plain Markdown brief for AI agents (llmstxt.org), built from the
// same config the pages render. Few providers read it yet; it costs nothing.
export const dynamic = "force-static";

export function GET() {
  const { name, url, description, locations, founder, instagram, etsyStore, zola, contactEmail } = siteConfig;
  const tiers = [...siteConfig.investments, ...siteConfig.eventInvestments].filter((t) => t.id !== "add-ons");
  const page = (path: string, label: string, note: string) => `- [${label}](${url}${path}): ${note}`;

  const body = [
    `# ${name}`,
    "",
    `> ${description}`,
    "",
    `${name} is run by ${founder.name}. Studio locations: ${locations.map((l) => `${l.city}, ${l.region}`).join(" and ")}. Printed pieces ship anywhere in the ${siteConfig.serviceArea}; digital files are delivered by email. Designs in English, Spanish or both. Quotes are custom; no public price list.`,
    "",
    "## Pages",
    "",
    page("/", "Home", "overview, how it works, what is in a suite"),
    page("/weddings", "Weddings", "wedding suites and individual pieces"),
    page("/events", "Events & Corporate", "quinceañeras, showers, birthdays, graduations, corporate events"),
    page("/gallery", "Gallery", "photos of real client work"),
    page("/reviews", "Reviews", "client testimonials"),
    page("/about", "About", `${founder.name}, founder`),
    page("/faq", "Questions, answered", "location, bilingual design, suites, process, how to order"),
    "",
    "## Collections",
    "",
    ...tiers.map((t) => `- ${t.name.en}: ${t.description.en} Includes ${t.features.map((f) => f.en).join(", ")}.`),
    "",
    ...faqSections.flatMap((s) => [
      `## ${s.title.en}`,
      "",
      s.lead.en,
      "",
      ...faqs.filter((f) => f.section === s.id).flatMap((f) => [`### ${f.q.en}`, "", f.a.en, ""]),
    ]),
    "## Contact",
    "",
    `- Email: ${contactEmail}`,
    `- Instagram: [@${instagram.handle}](${instagram.profileUrl})`,
    `- Etsy (ready-to-customize designs): [${etsyStore.name}](${etsyStore.url})`,
    `- Zola: [${name}](${zola.vendorUrl})`,
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
