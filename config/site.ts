import type { Bilingual } from "@/lib/i18n";

const b = (en: string, es: string): Bilingual => ({ en, es });

export type NavItem = { title: string; href: string; i18nKey?: string };

export type Hero = {
  headline: Bilingual;
  subheadline: Bilingual;
  cta?: { label: Bilingual; href: string };
};

export type About = {
  paragraphs: Bilingual[];
  cta: { label: Bilingual; href: string };
};

export type InvestmentTier = {
  id: string;
  name: Bilingual;
  description: Bilingual;
  features: Bilingual[];
  discount?: number;
  /** Display label for the savings badge. Decoupled from the numeric discount. */
  savingsLabel?: string;
};

export type Review = {
  id: string;
  text: Bilingual;
  author: string;
  role: Bilingual;
  /** Native language of the original quote (for the `lang` attribute on blockquote). */
  originalLang?: "en" | "es";
};

export type GalleryTag =
  | "ceremony-programs"
  | "welcome-signs"
  | "drink-toppers"
  | "bar-signs"
  | "note-cards"
  | "shower-games"
  | "invitations"
  | "menus"
  | "place-cards";

export type GalleryTagDef = {
  id: GalleryTag;
  title: Bilingual;
  description: Bilingual;
};

export type GalleryOrientation = "portrait" | "landscape" | "square";

export type GalleryItem = {
  id: string;
  src: string;
  alt: string;
  /** Curatorial one-line caption (bilingual). */
  caption?: Bilingual;
  /** Item-type tags; one image can carry multiple. */
  tags?: GalleryTag[];
  /** Native aspect of the photo. Drives tile shape. Defaults to "square". */
  orientation?: GalleryOrientation;
};

export type Weddings = { paragraphs: Bilingual[] };

export type EtsyStore = {
  url: string;
  name: string;
  tagline: Bilingual;
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
    "Custom invitations, décor, signs, and digital resources for your wedding and events. Designed with love by Janelle.",
  url: "https://www.gutierrezbyjanelle.com",
  locale: "en_US",
  alternateLocales: ["es_ES"],
  ogImages: [
    { url: "/logo.svg", width: 1785, height: 1785, alt: "GutierrezByJanelle logo", type: "image/svg+xml" },
    { url: "/opengraph-image", width: 1200, height: 630, alt: "GutierrezByJanelle", type: "image/png" },
  ],
  twitterImages: ["/opengraph-image"],
  hero: {
    headline: b(
      "Your dream day, beautifully designed.",
      "Tu día soñado, bellamente diseñado."
    ),
    subheadline: b(
      "Custom invitations, décor, signs, and digital resources, crafted with love for the moments that matter most.",
      "Invitaciones personalizadas, decoración, carteles y recursos digitales, creados con amor para los momentos que más importan."
    ),
  } satisfies Hero,
  about: {
    paragraphs: [
      b(
        "I am so excited you've chosen me to help make your special event memorable. I started this business after planning my own wedding and falling in love with each designed detail. Planning any event can become chaotic and stressful: that's where I come in!",
        "Estoy muy emocionada de que me hayas elegido para ayudarte a hacer memorable tu evento especial. Comencé este negocio después de planear mi propia boda y enamorarme de cada detalle diseñado. Planear cualquier evento puede volverse caótico y estresante: ¡ahí es donde entro yo!"
      ),
      b(
        "I can help take your vision from a daydream to having that dream right in your hands. Don't fret if you don't see a perfect match on my site; all designs can be customized or personalized from scratch. I look forward to our designing process! Talk soon… xx",
        "Puedo ayudarte a llevar tu visión desde un sueño hasta tenerlo en tus manos. No te preocupes si no ves una combinación perfecta en mi sitio; todos los diseños se pueden personalizar o crear desde cero. ¡Espero con ansias nuestro proceso de diseño! Hablamos pronto… xx"
      ),
    ],
    cta: {
      label: b("Invest in your event", "Invierte en tu evento"),
      href: "/investment",
    },
  } satisfies About,
  weddings: {
    paragraphs: [
      b(
        "Welcome, brides & grooms! Firstly, I'd like to congratulate you on your engagement ♡ You have someone who loves you unconditionally, and you both choose to spend your life together, it's such a beautiful milestone! I'm delighted to dedicate time into illuminating your love to your family and friends.",
        "¡Bienvenidos, novios! Antes que nada, quiero felicitarte por tu compromiso ♡ Tienes a alguien que te ama incondicionalmente, y ambos eligen pasar la vida juntos, ¡es un hito tan hermoso! Me encanta dedicarle tiempo a iluminar tu amor para tu familia y amigos."
      ),
      b(
        "Being a fiancée was one of the best and most favorite moments in my life! On the day my husband proposed, a couple we met congratulated us and gave just one piece of advice that made an impact in our relationship and how we felt throughout our engagement. The same advice that was passed on to them… \"never stop celebrating being engaged.\" Simple, yet can get shadowed in the midst of all of the wedding chaos. Never stopping the celebration of our engagement eventually turned into never stop celebrating our love.",
        "¡Ser prometida fue uno de los mejores y más favoritos momentos de mi vida! El día que mi esposo me propuso matrimonio, una pareja que conocimos nos felicitó y nos dio solo un consejo que impactó nuestra relación y cómo nos sentimos durante todo el compromiso. El mismo consejo que les habían dado a ellos… \"nunca dejen de celebrar estar comprometidos.\" Simple, pero se puede opacar en medio de todo el caos de la boda. Nunca dejar de celebrar nuestro compromiso eventualmente se convirtió en nunca dejar de celebrar nuestro amor."
      ),
      b(
        "We used that advice during our entire wedding planning period, from the mardi gras parade to the night before we said \"I do.\" That advice became a beautiful excuse for endless dates to discuss each wedding decision, big or small. We used that time to connect in a low-stress conversation about our vision, what we wanted our guests to experience and of course, the infamous wedding budget. One date to discuss, another date to compromise, a date when we finally made up our minds… or changed them! We had so much fun in the midst of the wedding planning craze.",
        "Usamos ese consejo durante todo nuestro período de planificación de boda, desde el desfile de mardi gras hasta la noche antes de decir \"acepto.\" Ese consejo se convirtió en una hermosa excusa para infinitas citas para discutir cada decisión de boda, grande o pequeña. Usamos ese tiempo para conectar en una conversación de bajo estrés sobre nuestra visión, lo que queríamos que nuestros invitados experimentaran y por supuesto, el infame presupuesto de boda. Una cita para discutir, otra cita para llegar a un acuerdo, una cita cuando finalmente decidimos… ¡o cambiamos de opinión! Nos divertimos muchísimo en medio de la locura de la planificación de boda."
      ),
      b(
        "I would love to be a part of your wedding planning craze and give you one less worry. I fell in love with designing my dream day and I'm excited to help you do the same. I'll help you take the stress out of your wedding stationery and signs so you can put the effort into the truly stressful situation… figuring out your seating chart!",
        "Me encantaría ser parte de la locura de la planificación de tu boda y darte una preocupación menos. Me enamoré de diseñar el día de mis sueños y estoy emocionada de ayudarte a hacer lo mismo. Te ayudaré a quitarle el estrés a tu papelería y carteles de boda para que puedas poner el esfuerzo en la situación verdaderamente estresante… ¡decidir el mapa de mesas!"
      ),
    ],
  } satisfies Weddings,
  mainNav: [
    { title: "Home", href: "/", i18nKey: "nav.home" },
    { title: "Weddings", href: "/weddings", i18nKey: "nav.weddings" },
    { title: "Gallery", href: "/gallery", i18nKey: "nav.gallery" },
    { title: "Reviews", href: "/reviews", i18nKey: "nav.reviews" },
    { title: "Investment", href: "/investment", i18nKey: "nav.investment" },
  ] satisfies NavItem[],
  investments: [
    {
      id: "individual",
      name: b("Individual Item", "Pieza Individual"),
      description: b(
        "Buy any single stationery piece: invite, thank you note, RSVP, menu, and more. Mix and match to suit your event.",
        "Compra cualquier pieza individual de papelería: invitación, tarjeta de agradecimiento, RSVP, menú y más. Combínalas como mejor le quede a tu evento."
      ),
      features: [
        b("Invite", "Invitación"),
        b("Thank you note", "Tarjeta de agradecimiento"),
        b("RSVP card", "Tarjeta RSVP"),
        b("Menu", "Menú"),
        b("And more (inquire for the full list)", "Y más (consulta por la lista completa)"),
      ],
    },
    {
      id: "diy-digital",
      name: b("Short and Suite", "Corto y Dulce"),
      description: b(
        "Dedicated to those who resignate with “keep it simple.” Perfect for mini or micro wedding preferences.",
        "Dedicado a quienes prefieren \"mantenerlo simple.\" Perfecto para bodas mini o micro."
      ),
      features: [
        b("Save the date", "Reserva la fecha"),
        b("Invite", "Invitación"),
      ],
      discount: 10,
      savingsLabel: "✦",
    },
    {
      id: "sweet-suite",
      name: b("Sweet Spot Suite", "Colección Punto Dulce"),
      description: b(
        "Begin your wedding brand with this complete invitation suite.",
        "Comienza la identidad de tu boda con esta colección completa de invitaciones."
      ),
      features: [
        b("Save the date", "Reserva la fecha"),
        b("Invite", "Invitación"),
        b("Detail card", "Tarjeta de detalles"),
        b("RSVP", "RSVP"),
        b("Envelopes", "Sobres"),
        b("AI-generated renders to envision your event", "Renders con IA para visualizar tu evento"),
      ],
      discount: 12,
      savingsLabel: "✦✦",
    },
    {
      id: "signature-suite",
      name: b("Signature Suite", "Colección Firma"),
      description: b(
        "The full wedding stationery experience, every detail beautifully coordinated.",
        "La experiencia completa de papelería de boda, con cada detalle hermosamente coordinado."
      ),
      features: [
        b("Save the date", "Reserva la fecha"),
        b("Invite", "Invitación"),
        b("Detail card", "Tarjeta de detalles"),
        b("RSVP", "RSVP"),
        b("Envelopes", "Sobres"),
        b("Ceremony card front", "Tarjeta de ceremonia (frente)"),
        b("Ceremony card back", "Tarjeta de ceremonia (reverso)"),
        b("Personalized guest settings", "Lugares personalizados para invitados"),
        b("Seating chart", "Mapa de mesas"),
        b("AI-generated renders to envision your event", "Renders con IA para visualizar tu evento"),
      ],
      discount: 15,
      savingsLabel: "✦✦✦",
    },
    {
      id: "add-ons",
      name: b("Add-Ons", "Complementos"),
      description: b(
        "Enhance any suite with these extra touches, available individually alongside any investment.",
        "Realza cualquier colección con estos toques extra, disponibles individualmente junto con cualquier inversión."
      ),
      features: [
        b("Menu", "Menú"),
        b("Drink toppers", "Toppers para bebidas"),
        b("Table top signs (signature drink sign)", "Carteles de mesa (cartel de bebida especial)"),
        b("Place cards", "Tarjetas de lugar"),
        b("Thank you cards", "Tarjetas de agradecimiento"),
        b("Party favor tags", "Etiquetas para recuerdos"),
        b("Full color designs", "Diseños a todo color"),
        b("Textured paper", "Papel texturizado"),
      ],
    },
  ] satisfies InvestmentTier[],
  eventInvestments: [
    {
      id: "event-basics",
      name: b("The Basics", "Lo Esencial"),
      description: b(
        "A clean, cohesive foundation for any event: everything you need to set the tone.",
        "Una base limpia y cohesiva para cualquier evento: todo lo que necesitas para marcar el tono."
      ),
      features: [
        b("Invite", "Invitación"),
        b("Thank you cards", "Tarjetas de agradecimiento"),
      ],
      savingsLabel: "✦",
    },
    {
      id: "event-fun",
      name: b("Add Some Fun", "Agrega Diversión"),
      description: b(
        "Take it up a notch with extra pieces that keep the party going from start to sweet finish.",
        "Sube el nivel con piezas extra que mantienen la fiesta desde el inicio hasta el dulce final."
      ),
      features: [
        b("Invite", "Invitación"),
        b("Thank you cards", "Tarjetas de agradecimiento"),
        b("Menus", "Menús"),
        b("Event sign", "Cartel del evento"),
        b("Dessert sign", "Cartel de postres"),
      ],
      savingsLabel: "✦✦",
    },
    {
      id: "event-works",
      name: b("Give Me the Works", "Dame Todo"),
      description: b(
        "The full event stationery experience: every detail covered so your guests feel every bit of the celebration.",
        "La experiencia completa de papelería para eventos: cada detalle cubierto para que tus invitados sientan toda la celebración."
      ),
      features: [
        b("Invite", "Invitación"),
        b("Thank you cards", "Tarjetas de agradecimiento"),
        b("Food menu", "Menú de comida"),
        b("Dessert menu", "Menú de postres"),
        b("Bar menu", "Menú de bar"),
        b("Welcome sign", "Cartel de bienvenida"),
        b("Table top event sign", "Cartel de mesa del evento"),
        b("Dessert sign", "Cartel de postres"),
        b("Signature drink sign", "Cartel de bebida especial"),
      ],
      savingsLabel: "✦✦✦",
    },
  ] satisfies InvestmentTier[],
  reviews: [
    {
      id: "r1",
      text: b(
        "From our first conversation with Janelle at Gutierrez, we knew we had found someone special. She responded to every email and question right away, and her professionalism made the whole planning process smooth and stress-free. What really set her apart was how she listened to what we wanted and created designs that felt completely unique to us—nothing felt generic or cookie-cutter. The personal touches she added throughout our wedding day showed that she genuinely cared about making it special, going above and beyond what we expected. The quality of her work is stunning, and we couldn't be happier with how everything turned out. We will absolutely use Gutierrez by Janelle again for future events and are already recommending her to friends.",
        "Desde nuestra primera conversación con Janelle de Gutierrez, supimos que habíamos encontrado a alguien especial. Respondía cada correo y pregunta de inmediato, y su profesionalismo hizo que todo el proceso de planificación fuera fluido y sin estrés. Lo que realmente la distinguió fue cómo escuchó lo que queríamos y creó diseños que se sintieron completamente únicos para nosotros, nada se sintió genérico ni copiado. Los toques personales que agregó durante todo el día de nuestra boda demostraron que de verdad le importaba hacerlo especial, yendo más allá de lo que esperábamos. La calidad de su trabajo es impresionante y no podríamos estar más felices con cómo quedó todo. Definitivamente usaremos a Gutierrez by Janelle de nuevo para futuros eventos y ya se la estamos recomendando a nuestros amigos."
      ),
      author: "Julie N.",
      role: b("Bride, 2026", "Novia, 2026"),
      originalLang: "en",
    },
    {
      id: "r2",
      text: b(
        "I appreciate your willingness and kindness in the work; you truly made the wedding wonderful with so many beautiful pieces. I loved that the designs were in both languages to guide the guests.",
        "Agradezco tu disposición y amabilidad en el trabajo, realmente lograste que la Boda sea maravillosa con tantas reseñas. Me encantó que los diseños estén en los dos idiomas para guiar a los invitados."
      ),
      author: "Liliana M.",
      role: b("Mother of the groom, 2025", "Madre del novio, 2025"),
      originalLang: "es",
    },
    {
      id: "r3",
      text: b(
        "When we started planning, we had no idea where to begin with stationery. Janelle answered all of our questions and even created a detailed timeline guide that made the whole process so much easier. She was invested in getting our designs just right, sending proofs and using AI renderings to insert the proofs and show us how everything would actually look in a real life scenario. Her communication was quick and honest the entire time, and she kept tweaking things until we were completely happy. The quality of her work is truly professional and we're so grateful for how much care she put into making our invites and stationary special!!!",
        "Cuando empezamos a planear, no teníamos idea por dónde comenzar con la papelería. Janelle respondió todas nuestras preguntas e incluso creó una guía detallada de tiempos que hizo todo el proceso mucho más fácil. Se dedicó por completo a que nuestros diseños quedaran perfectos, enviando pruebas y usando renders con IA para mostrarnos cómo se vería todo en un escenario real. Su comunicación fue rápida y honesta todo el tiempo, y siguió ajustando cosas hasta que quedamos completamente felices. La calidad de su trabajo es verdaderamente profesional y estamos muy agradecidas por todo el cuidado que puso en hacer nuestras invitaciones y papelería especiales!!!"
      ),
      author: "Michelle M.",
      role: b("Bride, 2026", "Novia, 2026"),
      originalLang: "en",
    },
  ] satisfies Review[],
  galleryTags: [
    {
      id: "ceremony-programs",
      title: b("Ceremony Programs", "Programas de ceremonia"),
      description: b(
        "Printed programs your guests hold from the first row to the last dance.",
        "Programas impresos que tus invitados sostienen desde la primera fila hasta el último baile."
      ),
    },
    {
      id: "welcome-signs",
      title: b("Welcome Signs", "Carteles de bienvenida"),
      description: b(
        "The first thing your guests see — a large-format sign that sets the whole tone.",
        "Lo primero que ven tus invitados: un cartel de gran formato que marca el tono de todo."
      ),
    },
    {
      id: "drink-toppers",
      title: b("Drink Toppers", "Toppers de bebidas"),
      description: b(
        "Custom circular toppers that turn every glass into a personalized detail.",
        "Toppers circulares personalizados que convierten cada copa en un detalle único."
      ),
    },
    {
      id: "bar-signs",
      title: b("Bar Signs", "Carteles de barra"),
      description: b(
        "Signature drink signs and bar menus that make the bar feel designed, not just stocked.",
        "Carteles de coctel especial y menús de barra que hacen que la barra se vea diseñada, no solo surtida."
      ),
    },
    {
      id: "note-cards",
      title: b("Note Cards", "Tarjetas personales"),
      description: b(
        "Personal messages for each guest — the detail that makes them feel truly seen.",
        "Mensajes personales para cada invitado: el detalle que los hace sentir verdaderamente vistos."
      ),
    },
    {
      id: "shower-games",
      title: b("Shower Games", "Juegos de Shower"),
      description: b(
        "Game cards and activity sheets designed to match your shower's style — not a generic template.",
        "Tarjetas de juegos y hojas de actividades diseñadas a juego con el estilo de tu shower, no una plantilla genérica."
      ),
    },
    {
      id: "invitations",
      title: b("Invitations", "Invitaciones"),
      description: b(
        "The first impression of your event — designed from scratch for your date and style.",
        "La primera impresión de tu evento: diseñada desde cero para tu fecha y tu estilo."
      ),
    },
    {
      id: "menus",
      title: b("Menus", "Menús"),
      description: b(
        "Dinner and bar menus that look as good as what's on them.",
        "Menús de cena y barra que lucen tan bien como lo que ofrecen."
      ),
    },
    {
      id: "place-cards",
      title: b("Place Cards", "Tarjetas de lugar"),
      description: b(
        "Every seat, named. Small cards that make guests feel expected and welcome.",
        "Cada asiento, nombrado. Pequeñas tarjetas que hacen que los invitados se sientan esperados y bienvenidos."
      ),
    },
  ] satisfies GalleryTagDef[],
  gallery: [
    {
      id: "g1",
      src: "/gallery/ceremony-card.jpeg",
      alt: "Ceremony program card on a paper background",
      caption: b("Ceremony program, hand to hand.", "Programa de ceremonia, en mano."),
      tags: ["ceremony-programs"],
      orientation: "square",
    },
    {
      id: "g2",
      src: "/gallery/ceremony-card-2.jpeg",
      alt: "Ceremony card, close detail",
      caption: b("Same suite, the close-up.", "La misma colección, en detalle."),
      tags: ["ceremony-programs"],
      orientation: "square",
    },
    {
      id: "g3",
      src: "/gallery/welcome-sign.jpeg",
      alt: "Tall welcome sign at a wedding entrance",
      caption: b(
        "Welcome sign, made to be the first thing your guests see.",
        "Cartel de bienvenida, lo primero que ven tus invitados."
      ),
      tags: ["welcome-signs"],
      orientation: "portrait",
    },
    {
      id: "g6",
      src: "/gallery/welcome-sign-2.jpeg",
      alt: "Welcome sign, second look",
      caption: b("A second welcome, another couple.", "Otra bienvenida, otra pareja."),
      tags: ["welcome-signs"],
      orientation: "portrait",
    },
    {
      id: "g4",
      src: "/gallery/signature-drink-sign.jpeg",
      alt: "Signature drink sign on a bar table",
      caption: b(
        "Signature drink sign, sitting on the bar.",
        "Cartel de coctel especial, sobre la barra."
      ),
      tags: ["bar-signs"],
      orientation: "landscape",
    },
    {
      id: "g5",
      src: "/gallery/signature-drink-topper.jpeg",
      alt: "Signature drink topper on a glass",
      caption: b(
        "The same drink, finished with a topper.",
        "El mismo coctel, terminado con un topper."
      ),
      tags: ["drink-toppers"],
      orientation: "landscape",
    },
    {
      id: "g7",
      src: "/gallery/drink-topper-riecherts.jpeg",
      alt: "Dark rocks glass with THE RIECHERTS circular drink topper",
      caption: b("The Riecherts. 6.12.26.", "The Riecherts. 6.12.26."),
      tags: ["drink-toppers"],
      orientation: "portrait",
    },
    {
      id: "g8",
      src: "/gallery/drink-topper-le.jpeg",
      alt: "Hand holding a stemless glass with L|E monogram circular topper",
      caption: b("L|E — initials on every sip.", "L|E — iniciales en cada sorbo."),
      tags: ["drink-toppers"],
      orientation: "portrait",
    },
    {
      id: "g9",
      src: "/gallery/drink-topper-portrait.jpeg",
      alt: "Champagne flute with couple photo topper against string lights",
      caption: b("Their photo, perched on a flute.", "Su foto, encima de una copa."),
      tags: ["drink-toppers"],
      orientation: "portrait",
    },
    {
      id: "g10",
      src: "/gallery/wedding-note-card.jpeg",
      alt: "Personal thank-you note card next to a champagne flute",
      caption: b("A note for titi Cynthia.", "Una nota para titi Cynthia."),
      tags: ["note-cards"],
      orientation: "portrait",
    },
    {
      id: "g11",
      src: "/gallery/drink-topper-good-drinks.jpeg",
      alt: "Hand holding ribbed glass with good drinks great company topper outdoors",
      caption: b("Good drinks. Great company.", "Buenas bebidas. Buena compañía."),
      tags: ["drink-toppers"],
      orientation: "portrait",
    },
    {
      id: "g12",
      src: "/gallery/baby-shower-games.jpeg",
      alt: "Overhead black-and-white photo of baby shower game cards on a beaded plate",
      caption: b("Baby shower games, designed to match.", "Juegos de baby shower, diseñados a juego."),
      tags: ["shower-games"],
      orientation: "portrait",
    },
  ] satisfies GalleryItem[],
  etsyStore: {
    url: "https://xgutierrezbyjanelle.etsy.com",
    name: "GutierrezByJanelle",
    tagline: b(
      "Ready-to-customize designs and digital stationery packs, available now in my Etsy shop.",
      "Diseños listos para personalizar y paquetes digitales de papelería, disponibles ahora en mi tienda de Etsy."
    ),
  } satisfies EtsyStore,
  zola: {
    vendorUrl: "https://www.zola.com/wedding-vendors/wedding-extras/gutierrez-by-janelle",
  } satisfies ZolaProfile,
  instagram: {
    handle: "gutierrez.byjanelle",
    profileUrl: "https://www.instagram.com/gutierrez.byjanelle",
    posts: [] as InstagramPost[],
  } satisfies InstagramConfig,
  /** Contact email displayed on the Investment inquiry section. */
  contactEmail: "gutierrezbyjanelle@gmail.com",
};
