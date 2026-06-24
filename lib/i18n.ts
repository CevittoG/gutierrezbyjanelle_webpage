export type Locale = "en" | "es";

export const LOCALES: Locale[] = ["en", "es"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "gbj-locale";

/**
 * Bilingual content holder. Use for any rich brand copy that lives in
 * `config/site.ts` (hero, about, weddings, tiers, reviews, captions).
 * Mechanical UI labels stay in the {@link dictionary} below.
 */
export type Bilingual = { en: string; es: string };

export function pick(value: Bilingual, locale: Locale): string {
  return value[locale] ?? value[DEFAULT_LOCALE];
}

export const dictionary = {
  en: {
    "nav.home": "Home",
    "nav.weddings": "Weddings",
    "nav.gallery": "Gallery",
    "nav.reviews": "Reviews",
    "nav.investment": "Investment",

    "toggle.aria": "Switch language",
    "toggle.en": "EN",
    "toggle.es": "ES",

    "cta.invest": "Invest in your event",
    "cta.instagram": "Say hi on Instagram",
    "cta.etsyShop": "Shop on Etsy",
    "cta.email": "Email",
    "cta.emailJanelle": "Email Janelle",
    "cta.talkSoon": "Talk soon… xx",
    "cta.viewFullGallery": "View full gallery",
    "cta.readAllReviews": "Read all reviews",
    "cta.seeInvestment": "See investment options",

    "home.about.heading": "Welcome,",
    "home.about.headingItalic": "party people!",
    "home.gallery.eyebrow": "Recent Work",
    "home.gallery.heading": "A Peek at the Portfolio",
    "home.reviews.eyebrow": "Kind Words",
    "home.reviews.heading": "From Real Clients",
    "home.process.eyebrow": "The Process",
    "home.process.heading": "From Vision to Your Hands",
    "home.process.step1.title": "Share Your Vision",
    "home.process.step1.body": "Send a message with your date, your style, and any inspiration you have in mind.",
    "home.process.step2.title": "Design Together",
    "home.process.step2.body": "I create custom designs from scratch, send proofs, and refine until every detail feels right.",
    "home.process.step3.title": "Celebrate",
    "home.process.step3.body": "Your finished stationery arrives, ready to set the tone for your event.",
    "home.cta.heading": "Let's design",
    "home.cta.headingItalic": "your",
    "home.cta.headingTail": "day.",
    "home.cta.body": "Every project starts with a conversation. Send a note with your date and your vision; I'd love to hear about your event.",

    "investment.heading": "Your Investment",
    "investment.intro": "Every piece is designed from scratch for your event. Explore the suites below, then reach out to start your custom quote.",
    "investment.wedding.eyebrow": "Wedding Stationery",
    "investment.wedding.heading": "Wedding Suites",
    "investment.wedding.body": "Each tier builds on the last. The ✦ marks a suite discount compared to individual pricing.",
    "investment.events.eyebrow": "Graduations, Baby Showers, Birthdays, and More",
    "investment.events.heading": "Event Collections",
    "investment.events.body": "The same craft, tailored for celebrations beyond the wedding day.",
    "investment.addons.eyebrow": "Mix and Match",
    "investment.inquiry.heading": "Tell Me About Your Day",
    "investment.inquiry.body": "Every project starts with a conversation. Send me a message with your date, your vision, and any details you have in mind. I'll put together a custom quote just for you.",

    "reviews.heading": "Client Stories",
    "reviews.intro": "See what clients are saying about their experience.",

    "weddings.letterHeading": "A note from Janelle",
    "weddings.h1": "For the Brides & Grooms",

    "gallery.eyebrow": "Recent Work",
    "gallery.heading": "A few pieces I'm proud of.",
    "gallery.intro": "Each one started as a conversation: a date, a vision, a feeling. Here's what those turned into.",
    "gallery.cta.heading": "See one you love? Let's make yours.",
    "gallery.cta.body": "Nothing here is a template. Tell me your date and your vision, and we'll start from a blank page.",
    "gallery.instagram.eyebrow": "Lately",
    "gallery.instagram.heading": "From Instagram",
    "gallery.instagram.bodyPrefix": "Newer work and behind-the-scenes from",
    "gallery.filter.label": "Filter gallery by type",
    "gallery.filter.all": "All",
    "gallery.empty.heading": "More coming soon",
    "gallery.empty.body": "This section of the gallery is still growing. Check back soon or reach out — I may already have something perfect for you.",
    "gallery.lightbox.prev": "Previous image",
    "gallery.lightbox.next": "Next image",
    "gallery.lightbox.close": "Close preview",
    "gallery.openItem": "Open",

    "etsy.eyebrow": "Shop on Etsy",

    "footer.tagline": "Designed for creatives.",
  },
  es: {
    "nav.home": "Inicio",
    "nav.weddings": "Bodas",
    "nav.gallery": "Galería",
    "nav.reviews": "Reseñas",
    "nav.investment": "Inversión",

    "toggle.aria": "Cambiar idioma",
    "toggle.en": "EN",
    "toggle.es": "ES",

    "cta.invest": "Invierte en tu evento",
    "cta.instagram": "Salúdame en Instagram",
    "cta.etsyShop": "Visita mi tienda Etsy",
    "cta.email": "Correo",
    "cta.emailJanelle": "Escríbele a Janelle",
    "cta.talkSoon": "Hablamos pronto… xx",
    "cta.viewFullGallery": "Ver galería completa",
    "cta.readAllReviews": "Leer todas las reseñas",
    "cta.seeInvestment": "Ver opciones de inversión",

    "home.about.heading": "Bienvenidos,",
    "home.about.headingItalic": "¡fiesteros!",
    "home.gallery.eyebrow": "Trabajo Reciente",
    "home.gallery.heading": "Un Vistazo al Portafolio",
    "home.reviews.eyebrow": "Palabras Amables",
    "home.reviews.heading": "De Clientes Reales",
    "home.process.eyebrow": "El Proceso",
    "home.process.heading": "De la Visión a Tus Manos",
    "home.process.step1.title": "Comparte Tu Visión",
    "home.process.step1.body": "Envíame un mensaje con tu fecha, tu estilo y cualquier inspiración que tengas en mente.",
    "home.process.step2.title": "Diseñemos Juntos",
    "home.process.step2.body": "Creo diseños personalizados desde cero, envío pruebas y refino hasta que cada detalle se sienta perfecto.",
    "home.process.step3.title": "Celebra",
    "home.process.step3.body": "Tu papelería terminada llega, lista para marcar el tono de tu evento.",
    "home.cta.heading": "Diseñemos",
    "home.cta.headingItalic": "tu",
    "home.cta.headingTail": "día.",
    "home.cta.body": "Cada proyecto comienza con una conversación. Envíame una nota con tu fecha y tu visión; me encantaría saber de tu evento.",

    "investment.heading": "Tu Inversión",
    "investment.intro": "Cada pieza se diseña desde cero para tu evento. Explora las colecciones a continuación y luego contáctame para comenzar tu cotización personalizada.",
    "investment.wedding.eyebrow": "Papelería de Boda",
    "investment.wedding.heading": "Colecciones de Boda",
    "investment.wedding.body": "Cada nivel se construye sobre el anterior. El ✦ marca el descuento por colección comparado con los precios individuales.",
    "investment.events.eyebrow": "Graduaciones, Baby Showers, Cumpleaños y Más",
    "investment.events.heading": "Colecciones para Eventos",
    "investment.events.body": "La misma dedicación, adaptada para celebraciones más allá del día de la boda.",
    "investment.addons.eyebrow": "Combina a Tu Gusto",
    "investment.inquiry.heading": "Cuéntame Sobre Tu Día",
    "investment.inquiry.body": "Cada proyecto comienza con una conversación. Envíame un mensaje con tu fecha, tu visión y cualquier detalle que tengas en mente. Armaré una cotización personalizada solo para ti.",

    "reviews.heading": "Historias de Clientes",
    "reviews.intro": "Mira lo que dicen mis clientes sobre su experiencia.",

    "weddings.letterHeading": "Una nota de Janelle",
    "weddings.h1": "Para los novios",

    "gallery.eyebrow": "Trabajo Reciente",
    "gallery.heading": "Algunas piezas de las que estoy orgullosa.",
    "gallery.intro": "Cada una comenzó como una conversación: una fecha, una visión, un sentimiento. Esto es en lo que se convirtieron.",
    "gallery.cta.heading": "¿Te enamoró alguna? Hagamos la tuya.",
    "gallery.cta.body": "Aquí nada es una plantilla. Cuéntame tu fecha y tu visión, y comenzaremos desde una página en blanco.",
    "gallery.instagram.eyebrow": "Últimamente",
    "gallery.instagram.heading": "Desde Instagram",
    "gallery.instagram.bodyPrefix": "Trabajo reciente y detrás de cámaras de",
    "gallery.filter.label": "Filtrar galería por tipo",
    "gallery.filter.all": "Todo",
    "gallery.empty.heading": "Más fotos muy pronto",
    "gallery.empty.body": "Esta sección de la galería sigue creciendo. Vuelve pronto o escríbeme — puede que ya tenga algo perfecto para ti.",
    "gallery.lightbox.prev": "Imagen anterior",
    "gallery.lightbox.next": "Imagen siguiente",
    "gallery.lightbox.close": "Cerrar vista previa",
    "gallery.openItem": "Abrir",

    "etsy.eyebrow": "Compra en Etsy",

    "footer.tagline": "Diseñado para creativos.",
  },
} as const;

export type TranslationKey = keyof (typeof dictionary)["en"];

export function translate(locale: Locale, key: TranslationKey): string {
  return dictionary[locale][key] ?? dictionary[DEFAULT_LOCALE][key] ?? key;
}
