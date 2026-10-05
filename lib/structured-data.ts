import { siteConfig } from "@/config/site";
import { faqs } from "@/config/faq";

/**
 * schema.org JSON-LD for search and answer engines. Pure builders over
 * siteConfig (rendered by components/structured-data.tsx), so the facts an AI
 * reads are the same facts the page shows. English only: that is the copy the
 * server renders. No prices and no invented ratings.
 */

const businessId = `${siteConfig.url}/#business`;

export function businessJsonLd() {
  const { name, url, description, locations, founder, reviews, investments, eventInvestments } = siteConfig;
  const tiers = [...investments, ...eventInvestments];
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": businessId,
    name,
    alternateName: "Gutierrez by Janelle",
    description,
    url,
    logo: `${url}/logo.svg`,
    image: `${url}/opengraph-image`,
    email: siteConfig.contactEmail,
    founder: { "@type": "Person", name: founder.name, jobTitle: "Stationery designer" },
    address: locations.map((l) => ({
      "@type": "PostalAddress",
      addressLocality: l.city,
      addressRegion: l.regionCode,
      addressCountry: l.country,
    })),
    areaServed: [
      ...locations.map((l) => ({ "@type": "Place", name: `${l.city}, ${l.regionCode}` })),
      { "@type": "Country", name: siteConfig.serviceArea },
    ],
    knowsLanguage: siteConfig.languages,
    knowsAbout: [
      "Wedding invitations",
      "Wedding stationery",
      "Bilingual English and Spanish invitations",
      "Quinceañera invitations",
      "Event signage",
      "Baby shower invitations",
      "Digital invitations",
    ],
    sameAs: [siteConfig.instagram.profileUrl, siteConfig.etsyStore.url, siteConfig.zola.vendorUrl],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Custom wedding and event stationery",
      itemListElement: tiers.map((t) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: t.name.en,
          description: `${t.description.en} Includes: ${t.features.map((f) => f.en).join(", ")}.`,
        },
      })),
    },
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.author },
      reviewBody: r.text[r.originalLang ?? "en"],
      inLanguage: r.originalLang ?? "en",
    })),
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${siteConfig.url}/faq`,
    about: { "@id": businessId },
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q.en,
      acceptedAnswer: { "@type": "Answer", text: f.a.en },
    })),
  };
}
