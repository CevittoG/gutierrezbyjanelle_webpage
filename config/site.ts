export type NavItem = { title: string; href: string };

export type Hero = {
  headline: string;
  subheadline: string;
  cta: { label: string; href: string };
};

export type About = {
  paragraphs: string[];
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

export type EtsyStore = {
  url: string;
  name: string;
  tagline: string;
};

export type InstagramPost = {
  id: string;
  url: string;
  caption: string;
  src?: string;
};

export type InstagramConfig = {
  handle: string;
  profileUrl: string;
  posts: InstagramPost[];
};

export const siteConfig = {
  name: "GutierrezByJanelle",
  description:
    "Custom invitations, décor, signs, and digital resources for your wedding and events — designed with love by Janelle.",
  url: "https://www.gutierrezbyjanelle.com",
  hero: {
    headline: "Your dream day, beautifully designed.",
    subheadline:
      "Custom invitations, décor, signs, and digital resources — crafted with love for the moments that matter most.",
    cta: { label: "View Packages", href: "/pricing" },
  } satisfies Hero,
  about: {
    paragraphs: [
      "Hi brides! Firstly, I'd like to congratulate you on your engagement! I'm so happy you've found me to work with during this special planning time. You have someone who loves you unconditionally, and you both choose to spend your life together — that's no small feat!",
      "For that reason and many more, being a fiancée was one of the best and most favorite moments in my life! On the day my husband proposed, a couple we met congratulated us and gave just one piece of advice that made an impact in our relationship and how we felt throughout our engagement. The same advice that was passed on to them when she said, \"yes\" … \"never stop celebrating being engaged,\" which eventually turned into never stop celebrating our love.",
      "We used that advice during our entire wedding planning period, from the Mardi Gras parade to the night before we said \"I do.\" That advice turned into a beautiful excuse of endless dates to discuss each wedding decision, big or small. We used that time to connect in a low-stress conversation about our vision, what we wanted our guests to experience and of course, our finances. A date to discuss, another date to discuss, a date when we finally made up our minds (or changed them!)… we had so much fun in the midst of the wedding planning craze!",
      "I would love to be a part of your wedding planning craze and give you one less worry! I fell in love with designing my dream day and I'm excited to help you do the same! I'll help you take the stress out of your wedding stationery and signs so you can put the effort into the truly stressful situation… figuring out your seating chart!",
    ],
    cta: { label: "See What I Offer", href: "/pricing" },
  } satisfies About,
  mainNav: [
    { title: "Home", href: "/" },
    { title: "Pricing", href: "/pricing" },
    { title: "Reviews", href: "/reviews" },
    { title: "Gallery", href: "/gallery" },
  ] satisfies NavItem[],
  pricing: [
    {
      id: "digital",
      name: "Digital Suite",
      price: "Starting at $75",
      description: "Digital-only designs delivered as print-ready files.",
      features: [
        "Custom invitation design",
        "Digital save-the-dates",
        "2 revision rounds",
        "Print-ready PDF export",
      ],
    },
    {
      id: "signature",
      name: "Signature Collection",
      price: "Starting at $200",
      description: "A full printed stationery suite for your wedding day.",
      features: [
        "Invitations + envelopes",
        "Save-the-dates",
        "Programs, menus & signage",
        "3 revision rounds",
        "Coordinated design suite",
      ],
    },
    {
      id: "full-event",
      name: "Full Event Package",
      price: "Custom quote",
      description: "Custom décor, signs, and printed resources for every detail.",
      features: [
        "Everything in Signature",
        "Custom venue signage",
        "Escort card & table design",
        "Seating chart display",
        "Day-of coordination materials",
      ],
    },
  ] satisfies PricePlan[],
  reviews: [
    {
      id: "r1",
      text: "Janelle's designs were absolutely stunning. Our guests kept asking where we got our invitations — they looked like something out of a magazine!",
      author: "Maria L.",
      role: "Bride, 2024",
    },
    {
      id: "r2",
      text: "She took my chaotic vision board and turned it into a cohesive, gorgeous suite. The signs at our venue were breathtaking. 10/10 recommend!",
      author: "Sofia R.",
      role: "Bride, 2024",
    },
  ] satisfies Review[],
  gallery: [
    { id: "g1", src: "/gallery/placeholder-1.jpg", alt: "Custom wedding invitation suite" },
    { id: "g2", src: "/gallery/placeholder-2.jpg", alt: "Venue welcome sign" },
    { id: "g3", src: "/gallery/placeholder-3.jpg", alt: "Seating chart display" },
    { id: "g4", src: "/gallery/placeholder-4.jpg", alt: "Custom event décor" },
  ] satisfies GalleryItem[],
  etsyStore: {
    url: "https://xgutierrezbyjanelle.etsy.com",
    name: "GutierrezByJanelle",
    tagline: "Ready-to-customize designs and digital stationery packs — available now in my Etsy shop.",
  } satisfies EtsyStore,
  instagram: {
    handle: "gutierrez.byjanelle",
    profileUrl: "https://www.instagram.com/gutierrez.byjanelle",
    posts: [] as InstagramPost[],
  } satisfies InstagramConfig,
};
