export type NavItem = { title: string; href: string };

export type Hero = {
  headline: string;
  subheadline: string;
  cta: { label: string; href: string };
};

export type PricePlan = {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
};

export type Review = {
  id: string;
  text: string;
  author: string;
  role: string;
};

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
};

export const siteConfig = {
  name: "GutierrezByJanelle",
  description: "Boutique beauty services by Janelle.",
  url: "https://www.gutierrezbyjanelle.com",
  hero: {
    headline: "Beauty, refined.",
    subheadline: "Boutique beauty services by Janelle — tailored to you.",
    cta: { label: "View Pricing", href: "/pricing" },
  } satisfies Hero,
  mainNav: [
    { title: "Home", href: "/" },
    { title: "Pricing", href: "/pricing" },
    { title: "Reviews", href: "/reviews" },
    { title: "Gallery", href: "/gallery" },
  ] satisfies NavItem[],
  pricing: [
    {
      id: "basic",
      name: "Basic",
      price: "$75",
      description: "Perfect for a single service.",
      features: ["1 service", "30-minute session", "Take-home care tips"],
    },
    {
      id: "premium",
      name: "Premium",
      price: "$150",
      description: "A full experience for the discerning client.",
      features: ["2 services", "60-minute session", "Product samples", "Priority booking"],
    },
  ] satisfies PricePlan[],
  reviews: [
    {
      id: "r1",
      text: "Janelle is incredibly talented. My results were beyond what I expected.",
      author: "Maria L.",
      role: "Loyal client",
    },
    {
      id: "r2",
      text: "Professional, warm, and detail-oriented. I always leave feeling confident.",
      author: "Sofia R.",
      role: "Regular client",
    },
  ] satisfies Review[],
  gallery: [
    { id: "g1", src: "/gallery/placeholder-1.jpg", alt: "Gallery image 1" },
    { id: "g2", src: "/gallery/placeholder-2.jpg", alt: "Gallery image 2" },
  ] satisfies GalleryItem[],
};
