import type { Bilingual } from "../lib/i18n";
import { siteConfig } from "./site";

/**
 * Copy for /faq: the page answer engines quote. Every section lead and every
 * answer opens with the direct answer and runs 40–60 words in English
 * (`lib/answers.test.ts` holds that line), so a single passage can be lifted
 * into an AI answer and still make sense on its own. The page renders this,
 * and its FAQPage JSON-LD is built from the same entries.
 *
 * Facts only from siteConfig and Janelle. No prices on the site.
 */
const b = (en: string, es: string): Bilingual => ({ en, es });

const name = siteConfig.name;
const email = siteConfig.contactEmail;
const handle = `@${siteConfig.instagram.handle}`;

export type FaqSectionId = "studio" | "weddings" | "events" | "ordering";

export type FaqSection = { id: FaqSectionId; title: Bilingual; lead: Bilingual };
export type FaqEntry = { id: string; section: FaqSectionId; q: Bilingual; a: Bilingual };

export const faqSections: FaqSection[] = [
  {
    id: "studio",
    title: b("About the studio", "Sobre el estudio"),
    lead: b(
      `${name} is a custom stationery studio run by designer Janelle Gutiérrez from Austin, Texas and Long Island, New York. I design wedding and event invitations, signs and day-of details from scratch, in English, Spanish or both, and ship printed pieces to clients anywhere in the United States.`,
      `${name} es un estudio de papelería personalizada de la diseñadora Janelle Gutiérrez, desde Austin, Texas y Long Island, Nueva York. Diseño desde cero invitaciones, carteles y detalles para bodas y eventos, en inglés, español o ambos, y envío las piezas impresas a clientes en todo Estados Unidos.`
    ),
  },
  {
    id: "weddings",
    title: b("Wedding stationery", "Papelería de boda"),
    lead: b(
      `${name} designs complete wedding stationery: save the dates, invitation suites with RSVP and details cards, ceremony programs, welcome and bar signs, menus, place cards and favors. Every piece is designed together from a blank page, so your wedding reads as one story from the first mailing to the last place card.`,
      `${name} diseña toda la papelería de tu boda: save the dates, colecciones de invitaciones con tarjetas RSVP y de detalles, programas de ceremonia, carteles de bienvenida y de bar, menús, tarjetas de lugar y recuerdos. Cada pieza se diseña en conjunto desde una página en blanco, para que tu boda cuente una sola historia.`
    ),
  },
  {
    id: "events",
    title: b("Events and celebrations", "Eventos y celebraciones"),
    lead: b(
      `Beyond weddings, ${name} designs stationery and signage for quinceañeras, baby and bridal showers, birthdays, graduations, anniversaries, dinner parties, retirements and corporate events. You get the same custom design, bilingual options and honest communication as a wedding, sized to your celebration, from a simple invitation to a full set of signs and menus.`,
      `Además de bodas, ${name} diseña papelería y carteles para quinceañeras, baby showers y despedidas de soltera, cumpleaños, graduaciones, aniversarios, cenas, jubilaciones y eventos corporativos. Recibes el mismo diseño personalizado, opciones bilingües y comunicación honesta que en una boda, a la medida de tu celebración, desde una invitación sencilla hasta carteles y menús completos.`
    ),
  },
  {
    id: "ordering",
    title: b("Pricing and ordering", "Precios y pedidos"),
    lead: b(
      `Every ${name} project is quoted individually, because the price depends on your guest count, the pieces you choose, paper and finishes, and whether you want printed or digital files. To start, send your date and ideas by email or Instagram; I reply personally with a custom quote and a timeline for your date.`,
      `Cada proyecto de ${name} se cotiza de forma individual, porque el precio depende de tu número de invitados, las piezas que elijas, el papel y los acabados, y si quieres piezas impresas o archivos digitales. Para empezar, envíame tu fecha e ideas por correo o Instagram; respondo personalmente con una cotización y un cronograma.`
    ),
  },
];

export const faqs: FaqEntry[] = [
  // ── About the studio ─────────────────────────────────
  {
    id: "who",
    section: "studio",
    q: b(`Who is behind ${name}?`, `¿Quién está detrás de ${name}?`),
    a: b(
      `Janelle Gutiérrez founded ${name} after designing every detail of her own wedding. She's a wife, a new mom and a former kindergarten teacher who left the classroom to stay home with her baby, and she now designs custom stationery for couples and families who want their celebration to feel personal, not templated.`,
      `Janelle Gutiérrez fundó ${name} después de diseñar cada detalle de su propia boda. Es esposa, mamá primeriza y ex maestra de kínder que dejó el salón de clases para quedarse en casa con su bebé, y hoy diseña papelería personalizada para parejas y familias que quieren que su celebración se sienta personal, no de plantilla.`
    ),
  },
  {
    id: "where",
    section: "studio",
    q: b("Where are you based, and do you ship?", "¿Dónde estás y haces envíos?"),
    a: b(
      `${name} works from Austin, Texas and Long Island, New York, and serves clients anywhere in the United States. We talk and review proofs by email or Instagram, so distance is never a problem. Printed stationery ships to your door, and digital files arrive by email, ready to send or print.`,
      `${name} trabaja desde Austin, Texas y Long Island, Nueva York, y atiende a clientes en todo Estados Unidos. Conversamos y revisamos las pruebas por correo o Instagram, así que la distancia nunca es un problema. La papelería impresa llega a tu puerta y los archivos digitales llegan por correo, listos para enviar o imprimir.`
    ),
  },
  {
    id: "bilingual",
    section: "studio",
    q: b("Can you design bilingual English and Spanish stationery?", "¿Puedes diseñar papelería bilingüe en inglés y español?"),
    a: b(
      `Yes. I design in English, Spanish or both, so every guest can read your invitation, program and signs. Bilingual pieces can show both languages side by side or come as separate versions for each side of the family, with accents and wording handled with care. Clients often tell me the bilingual signs guided their guests beautifully.`,
      `Sí. Diseño en inglés, español o ambos, para que cada invitado pueda leer tu invitación, programa y carteles. Las piezas bilingües pueden mostrar los dos idiomas lado a lado o venir en versiones separadas para cada lado de la familia, cuidando acentos y redacción. Mis clientes cuentan que los carteles bilingües guiaron muy bien a sus invitados.`
    ),
  },
  // ── Wedding stationery ───────────────────────────────
  {
    id: "suite-contents",
    section: "weddings",
    q: b("What's included in a wedding invitation suite?", "¿Qué incluye una colección de invitaciones de boda?"),
    a: b(
      "A wedding invitation suite is every piece your guests receive, designed as one set. A suite can include a save the date, the invitation, an RSVP card, a details card, envelope printing and a band, clip or pocket, plus day-of pieces like ceremony programs, a timeline and place-setting notes, so the look carries through the whole day.",
      "Una colección de invitaciones de boda es cada pieza que reciben tus invitados, diseñada como un solo conjunto. Puede incluir save the date, invitación, tarjeta RSVP, tarjeta de detalles, impresión de sobres y cinta, clip o bolsillo, además de piezas para el día como programas de ceremonia, cronograma y notas para cada lugar."
    ),
  },
  {
    id: "wedding-suites",
    section: "weddings",
    q: b("Which wedding suites do you offer?", "¿Qué colecciones de boda ofreces?"),
    a: b(
      `${name} offers three wedding suites. Short and Suite pairs an invitation with a details card for micro weddings. Sweet Spot Suite adds an RSVP card and envelope printing. Signature Suite adds a band, clip or pocket, ceremony cards, a table sign and an AI render of your day. Each ✦ marks a bigger saving.`,
      `${name} ofrece tres colecciones de boda. Corto y Dulce combina invitación y tarjeta de detalles para bodas pequeñas. Punto Dulce agrega tarjeta RSVP e impresión de sobres. Firma agrega cinta, clip o bolsillo, tarjetas de ceremonia, un cartel de mesa y un render con IA de tu día. Cada ✦ marca un ahorro mayor.`
    ),
  },
  {
    id: "single-pieces",
    section: "weddings",
    q: b("Can I order single pieces instead of a full suite?", "¿Puedo pedir piezas sueltas en lugar de una colección completa?"),
    a: b(
      "Yes. Every piece can be ordered on its own or added to any suite: invitations, RSVP cards, menus, thank-you cards, place cards, drink toppers, coasters, wine and drink charms, favor tags, table signs, envelope liners, wax seals and textured paper. If you don't see what you need, just ask; I design custom shapes and extra cards too.",
      "Sí. Cada pieza se puede pedir por separado o sumarse a cualquier colección: invitaciones, tarjetas RSVP, menús, tarjetas de agradecimiento, tarjetas de lugar, toppers para bebidas, posavasos, charms para copas y bebidas, etiquetas para recuerdos, carteles de mesa, forros para sobres, sellos de cera y papel texturizado. Si no ves lo que buscas, pregúntame."
    ),
  },
  // ── Events and celebrations ──────────────────────────
  {
    id: "event-types",
    section: "events",
    q: b("Which events do you design for besides weddings?", "¿Para qué eventos diseñas además de bodas?"),
    a: b(
      "I design for quinceañeras, baby and bridal showers, birthdays, graduations, anniversaries, dinner parties, holidays, retirements and corporate events. That includes invitations, thank-you cards, menus, welcome and dessert signs, shower games, favor tags, coasters, drink charms, holiday cards and stickers. If your celebration needs something else, ask, and I'll do my best to make it happen.",
      "Diseño para quinceañeras, baby showers y despedidas de soltera, cumpleaños, graduaciones, aniversarios, cenas, días festivos, jubilaciones y eventos corporativos. Eso incluye invitaciones, tarjetas de agradecimiento, menús, carteles de bienvenida y de postres, juegos para showers, etiquetas, posavasos, charms para bebidas, tarjetas navideñas y stickers. Si necesitas algo más, pregúntame."
    ),
  },
  {
    id: "event-collections",
    section: "events",
    q: b("Which event collections do you offer?", "¿Qué colecciones para eventos ofreces?"),
    a: b(
      `${name} has three event collections. The Basics covers an invitation and thank-you cards. Add Some Fun adds menus, an event sign and a dessert sign. Give Me the Works adds food, dessert and bar menus plus welcome, table and signature-drink signs. Each ✦ marks a bigger saving than ordering the pieces separately.`,
      `${name} tiene tres colecciones para eventos. Lo Esencial incluye invitación y tarjetas de agradecimiento. Agrega Diversión suma menús, un cartel del evento y uno de postres. Dame Todo suma menús de comida, postres y bar, además de carteles de bienvenida, de mesa y de bebida especial. Cada ✦ marca un ahorro mayor.`
    ),
  },
  // ── Pricing and ordering ─────────────────────────────
  {
    id: "cost",
    section: "ordering",
    q: b("How much does custom stationery cost?", "¿Cuánto cuesta la papelería personalizada?"),
    a: b(
      "Every quote is custom, so there's no fixed price list. The price depends on how many households you're inviting, which pieces you choose, paper and finishes, and whether you want printed pieces or digital files. Suites cost less than the same pieces ordered separately; the ✦ on each suite shows how much you save.",
      "Cada cotización es personalizada, así que no hay una lista de precios fija. El precio depende de cuántas familias invitas, qué piezas eliges, el papel y los acabados, y si quieres piezas impresas o archivos digitales. Las colecciones cuestan menos que las mismas piezas por separado; el ✦ de cada una muestra cuánto ahorras."
    ),
  },
  {
    id: "process",
    section: "ordering",
    q: b("How does the design process work?", "¿Cómo funciona el proceso de diseño?"),
    a: b(
      "It takes four steps. You send your date, style and inspiration by email or Instagram. I design every piece from a blank page, never a template, around your colors, venue and story. We refine the proofs together until everything feels like you. Then your stationery arrives printed and shipped, or as digital files.",
      "Son cuatro pasos. Me envías tu fecha, tu estilo e inspiración por correo o Instagram. Diseño cada pieza desde una página en blanco, nunca una plantilla, alrededor de tus colores, tu lugar y tu historia. Afinamos las pruebas juntos hasta que todo se sienta como tú. Luego recibes tu papelería impresa o en archivos digitales."
    ),
  },
  {
    id: "timeline",
    section: "ordering",
    q: b("How far in advance should I order?", "¿Con cuánta anticipación debo hacer mi pedido?"),
    a: b(
      "Order at least three weeks before you need your pieces in hand: that leaves time for design, proofs and printing or shipping. For save the dates and invitations, count back from your mailing date, since save the dates usually go out six to eight months ahead and invitations six to eight weeks before.",
      "Haz tu pedido al menos tres semanas antes de necesitar tus piezas: así hay tiempo para diseño, pruebas e impresión o envío. Para save the dates e invitaciones, calcula desde tu fecha de envío: los save the dates suelen enviarse de seis a ocho meses antes y las invitaciones de seis a ocho semanas antes."
    ),
  },
  {
    id: "proofs",
    section: "ordering",
    q: b("Will I see my design before it's printed?", "¿Veré mi diseño antes de imprimirlo?"),
    a: b(
      "Yes. You approve digital proofs of every piece before anything is printed, and we keep refining until you're completely happy. I can also place your proofs into an AI-generated render of a real setting, so you can see how the invitation, signs and table pieces will look together on the day.",
      "Sí. Apruebas pruebas digitales de cada pieza antes de imprimir nada, y seguimos ajustando hasta que estés completamente feliz. También puedo colocar tus pruebas en un render con IA de un escenario real, para que veas cómo se verán juntas la invitación, los carteles y las piezas de mesa el día del evento."
    ),
  },
  {
    id: "printed-digital",
    section: "ordering",
    q: b("Do you offer printed or digital stationery?", "¿Ofreces papelería impresa o digital?"),
    a: b(
      "Both. Printed pieces come on quality or textured paper, with options like envelope printing, liners and wax seals, and ship anywhere in the US. Digital files are ready to text, email or print yourself, which suits micro weddings and casual events. You can also mix them, such as digital save the dates with printed invitations.",
      "Ambas. Las piezas impresas van en papel de calidad o texturizado, con opciones como impresión de sobres, forros y sellos de cera, y se envían a todo EE. UU. Los archivos digitales están listos para enviar por mensaje o correo, o imprimir tú mismo. También puedes combinarlas, como save the dates digitales con invitaciones impresas."
    ),
  },
  {
    id: "etsy",
    section: "ordering",
    q: b("Do you sell ready-made designs?", "¿Vendes diseños listos?"),
    a: b(
      `Yes. Ready-to-customize designs and digital stationery packs are in the ${name} Etsy shop, ${siteConfig.etsyStore.name}, for anyone who wants a quick, budget-friendly option. Everything on this website is fully custom instead: designed from scratch for your date, with proofs and revisions. You can also find me on Zola if you're planning there.`,
      `Sí. En la tienda de Etsy de ${name}, ${siteConfig.etsyStore.name}, hay diseños listos para personalizar y paquetes digitales de papelería, para quien busca una opción rápida y económica. Todo lo de este sitio, en cambio, es totalmente personalizado: diseñado desde cero para tu fecha, con pruebas y ajustes. También me encuentras en Zola.`
    ),
  },
  {
    id: "start",
    section: "ordering",
    q: b("How do I get started?", "¿Cómo empiezo?"),
    a: b(
      `Email me at ${email} or message ${handle} on Instagram with your event date, guest count, style and any inspiration you love. I reply personally, answer your questions and send a custom quote. Once you're happy with it, we start designing, and you'll see your first proofs soon after.`,
      `Escríbeme a ${email} o envía un mensaje a ${handle} en Instagram con la fecha de tu evento, número de invitados, estilo y cualquier inspiración que te encante. Respondo personalmente, resuelvo tus dudas y te envío una cotización. Cuando estés feliz con ella, empezamos a diseñar y pronto verás tus primeras pruebas.`
    ),
  },
];
