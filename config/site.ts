export type NavItem = { title: string; href: string };

export type Hero = {
  headline: string;
  subheadline: string;
  cta?: { label: string; href: string };
};

export type About = {
  paragraphs: string[];
  cta: { label: string; href: string };
};

export type InvestmentTier = {
  id: string;
  name: string;
  description: string;
  features: string[];
  discount?: number;
  /** Display label for the savings badge. Decoupled from the numeric discount. */
  savingsLabel?: string;
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

export type Weddings = { paragraphs: string[] };

export type EtsyStore = {
  url: string;
  name: string;
  tagline: string;
};

export type ZolaProfile = { vendorUrl: string };

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
  } satisfies Hero,
  about: {
    paragraphs: [
      "I am so excited you've chosen me to help make your special event memorable. I started this business after planning my own wedding and falling in love with each designed detail. Though fun, planning any event can become chaotic and stressful… that's where I come in! I can help take your vision from a day dream to having that dream right in your hands. Don't fret if you don't see a perfect match on my site, all designs can be customized or personalized from scratch. I look forward to our designing process! Talk soon… xx",
    ],
    cta: { label: "Invest in your event", href: "/investment" },
  } satisfies About,
  weddings: {
    paragraphs: [
      "Welcome, brides! Firstly, I'd like to congratulate you on your engagement ♡ You have someone who loves you unconditionally, and you both choose to spend your life together, it's such a beautiful milestone! I'm delighted to dedicate time into illuminating your love to your family and friends.",
      "Being a fiancée was one of the best and most favorite moments in my life! On the day my husband proposed, a couple we met congratulated us and gave just one piece of advice that made an impact in our relationship and how we felt throughout our engagement. The same advice that was passed on to them… \"never stop celebrating being engaged.\" Simple, yet can get shadowed in the midst of all of the wedding chaos. Never stopping the celebration of our engagement eventually turned into never stop celebrating our love.",
      "We used that advice during our entire wedding planning period, from the mardi gras parade to the night before we said \"I do.\" That advice became a beautiful excuse for endless dates to discuss each wedding decision, big or small. We used that time to connect in a low-stress conversation about our vision, what we wanted our guests to experience and of course, the infamous wedding budget. One date to discuss, another date to compromise, a date when we finally made up our minds… or changed them! We had so much fun in the midst of the wedding planning craze.",
      "I would love to be a part of your wedding planning craze and give you one less worry. I fell in love with designing my dream day and I'm excited to help you do the same. I'll help you take the stress out of your wedding stationery and signs so you can put the effort into the truly stressful situation… figuring out your seating chart!",
    ],
  } satisfies Weddings,
  mainNav: [
    { title: "Home", href: "/" },
    { title: "Weddings", href: "/weddings" },
    { title: "Gallery", href: "/gallery" },
    { title: "Reviews", href: "/reviews" },
    { title: "Investment", href: "/investment" },
  ] satisfies NavItem[],
  investments: [
    {
      id: "individual",
      name: "Individual Item",
      description: "Buy any single stationery piece — invite, thank you note, RSVP, menu, and more. Mix and match to suit your event.",
      features: [
        "Invite",
        "Thank you note",
        "RSVP card",
        "Menu",
        "And more — inquire for the full list",
      ],
    },
    {
      id: "diy-digital",
      name: "Short and Suite",
      description: "High quality print-ready PDF export. No printing included — files shared by email.",
      features: [
        "Invite",
        "Save the date",
      ],
      discount: 10,
      savingsLabel: "✦",
    },
    {
      id: "sweet-suite",
      name: "Sweet Spot Suite",
      description: "A complete invite suite printed at home and shipped anywhere in the US.",
      features: [
        "Save the date",
        "Invite",
        "Detail card",
        "RSVP",
        "Envelopes",
        "AI-generated renders to envision your event",
      ],
      discount: 12,
      savingsLabel: "✦✦",
    },
    {
      id: "signature-suite",
      name: "Signature Suite",
      description: "The full wedding stationery experience — every detail, beautifully coordinated.",
      features: [
        "Save the date",
        "Invite",
        "Detail card",
        "RSVP",
        "Envelopes",
        "Ceremony card front",
        "Ceremony card back",
        "Personalized guest settings",
        "Seating chart",
        "AI-generated renders to envision your event",
      ],
      discount: 15,
      savingsLabel: "✦✦✦",
    },
    {
      id: "add-ons",
      name: "Add-Ons",
      description: "Enhance any suite with these extra touches — available individually alongside any investment.",
      features: [
        "Menu",
        "Drink toppers",
        "Table top signs (signature drink sign)",
        "Place cards",
        "Thank you cards",
        "Party favor tags",
        "Full color designs",
        "Textured paper",
      ],
    },
  ] satisfies InvestmentTier[],
  eventInvestments: [
    {
      id: "event-basics",
      name: "The Basics",
      description: "A clean, cohesive foundation for any event — everything you need to set the tone.",
      features: [
        "Invite",
        "Thank you cards",
      ],
      savingsLabel: "✦",
    },
    {
      id: "event-fun",
      name: "Add Some Fun",
      description: "Take it up a notch with extra pieces that keep the party going from start to sweet finish.",
      features: [
        "Invite",
        "Thank you cards",
        "Menus",
        "Event sign",
        "Dessert sign",
      ],
      savingsLabel: "✦✦",
    },
    {
      id: "event-works",
      name: "Give Me the Works",
      description: "The full event stationery experience — every detail covered so your guests feel every bit of the celebration.",
      features: [
        "Invite",
        "Thank you cards",
        "Food menu",
        "Dessert menu",
        "Bar menu",
        "Welcome sign",
        "Table top event sign",
        "Dessert sign",
        "Signature drink sign",
      ],
      savingsLabel: "✦✦✦",
    },
  ] satisfies InvestmentTier[],
  reviews: [
    {
      id: "r1",
      text: "From our first conversation with Janelle at Gutierrez, we knew we had found someone special. She responded to every email and question right away, and her professionalism made the whole planning process smooth and stress-free. What really set her apart was how she listened to what we wanted and created designs that felt completely unique to us—nothing felt generic or cookie-cutter. The personal touches she added throughout our wedding day showed that she genuinely cared about making it special, going above and beyond what we expected. The quality of her work is stunning, and we couldn't be happier with how everything turned out. We will absolutely use Gutierrez by Janelle again for future events and are already recommending her to friends.",
      author: "Julie Nelson",
      role: "Bride, 2026",
    },
    {
      id: "r2",
      text: "Agradezco tu disposición y amabilidad en el trabajo, realmente lograste que la Boda sea maravillosa con tantas reseñas. Me encantó que los diseños estén en los dos idiomas para guiar a los invitados.",
      author: "Liliana Munizaga",
      role: "Mother of the groom, 2025",
    },
    {
      id: "r3",
      text: "When we started planning, we had no idea where to begin with stationery. Janelle answered all of our questions and even created a detailed timeline guide that made the whole process so much easier. She was invested in getting our designs just right, sending proofs and using AI renderings to insert the proofs and show us how everything would actually look in a real life scenario. Her communication was quick and honest the entire time, and she kept tweaking things until we were completely happy. The quality of her work is truly professional and we're so grateful for how much care she put into making our invites and stationary special!!!",
      author: "Michelle M.",
      role: "Bride, 2026",
    },
  ] satisfies Review[],
  gallery: [
    { id: "g1", src: "/gallery/ceremony-card.jpeg",         alt: "Ceremony card" },
    { id: "g2", src: "/gallery/ceremony-card-2.jpeg",       alt: "Ceremony card detail" },
    { id: "g3", src: "/gallery/welcome-sign.jpeg",          alt: "Wedding welcome sign" },
    { id: "g4", src: "/gallery/signature-drink-sign.jpeg",  alt: "Signature drink sign" },
    { id: "g5", src: "/gallery/signature-drink-topper.jpeg",alt: "Signature drink topper" },
    { id: "g6", src: "/gallery/welcome-sign-2.jpeg",        alt: "Wedding welcome sign detail" },
  ] satisfies GalleryItem[],
  etsyStore: {
    url: "https://xgutierrezbyjanelle.etsy.com",
    name: "GutierrezByJanelle",
    tagline: "Ready-to-customize designs and digital stationery packs — available now in my Etsy shop.",
  } satisfies EtsyStore,
  zola: {
    vendorUrl: "https://www.zola.com/wedding-vendors/wedding-extras/gutierrez-by-janelle",
  } satisfies ZolaProfile,
  instagram: {
    handle: "gutierrez.byjanelle",
    profileUrl: "https://www.instagram.com/gutierrez.byjanelle",
    posts: [] as InstagramPost[],
  } satisfies InstagramConfig,
};
