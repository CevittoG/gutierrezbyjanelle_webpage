import type { Bilingual } from "@/lib/i18n";

/**
 * Copy for the live site ("Linen, Re-inked", promoted from concept V1) and the
 * hidden concepts /v2, /v3. (/v1 is now the archived previous live site.)
 * Everything else those pages show comes from `siteConfig` — this file only
 * holds the few extra lines the new layouts need (process steps, suite piece
 * labels, small UI labels).
 */
const b = (en: string, es: string): Bilingual => ({ en, es });

export type ConceptVersion = 1 | 2 | 3;

export const conceptVersions: { version: ConceptVersion; name: string }[] = [
  { version: 1, name: "Classic (previous live)" },
  { version: 2, name: "Editorial Atelier" },
  { version: 3, name: "Stationery Table" },
];

export type SuitePiece = { id: string; src: string; label: Bilingual; w: number; h: number };

/** The real wedding suite photographed piece by piece (public/item_preview_map). */
export const suitePieces: SuitePiece[] = [
  { id: "std", src: "/item_preview_map/save_the_date.jpeg", label: b("Save the date", "Reserva la fecha"), w: 1280, h: 853 },
  { id: "inv", src: "/item_preview_map/invite.jpeg", label: b("Invitation", "Invitación"), w: 1964, h: 2750 },
  { id: "rsvp", src: "/item_preview_map/rsvp.jpeg", label: b("RSVP card", "Tarjeta RSVP"), w: 1280, h: 896 },
  { id: "det", src: "/item_preview_map/detail.jpeg", label: b("Details card", "Tarjeta de detalles"), w: 853, h: 1280 },
  { id: "cer", src: "/item_preview_map/ceremony_card.jpeg", label: b("Ceremony program", "Programa de ceremonia"), w: 915, h: 1280 },
  { id: "tl", src: "/item_preview_map/ceremony_card_back_timeline.jpeg", label: b("Timeline", "Cronograma"), w: 915, h: 1280 },
  { id: "place", src: "/item_preview_map/guest_place_setting.jpeg", label: b("Place-setting note", "Nota para cada lugar"), w: 900, h: 1275 },
];

export const processSteps: { title: Bilingual; body: Bilingual }[] = [
  {
    title: b("Say hello", "Salúdame"),
    body: b(
      "Send a note with your date, your style and any inspiration. Email or Instagram, whichever feels easiest.",
      "Envíame una nota con tu fecha, tu estilo y cualquier inspiración. Por correo o Instagram, lo que te sea más fácil."
    ),
  },
  {
    title: b("Design from scratch", "Diseño desde cero"),
    body: b(
      "I design your pieces from a blank page, around your colors, your venue and your story. No templates.",
      "Diseño tus piezas desde una página en blanco, alrededor de tus colores, tu lugar y tu historia. Sin plantillas."
    ),
  },
  {
    title: b("Proof & refine", "Pruebas y ajustes"),
    body: b(
      "You'll see proofs, and we refine together until every detail feels like you.",
      "Verás pruebas y afinamos juntos hasta que cada detalle se sienta como tú."
    ),
  },
  {
    title: b("Print & celebrate", "Imprime y celebra"),
    body: b(
      "Your finished pieces arrive printed or as digital files, ready to set the tone for your day.",
      "Tus piezas terminadas llegan impresas o en archivos digitales, listas para marcar el tono de tu día."
    ),
  },
];

/** Janelle's own self-description, split into short facts (from about.sections[0]). */
export const founderFacts: Bilingual[] = [
  b("Wife", "Esposa"),
  b("Mom", "Mamá"),
  b("Former kindergarten teacher", "Ex maestra de kínder"),
  b("Traveler", "Viajera"),
  b("Lifelong learner", "Eterna aprendiz"),
];

export const conceptCopy = {
  heroEyebrow: b("Custom wedding & event stationery", "Papelería personalizada para bodas y eventos"),
  suiteEyebrow: b("One story, every piece", "Una historia, cada pieza"),
  suiteHeading: b("What's in a suite", "Qué incluye una colección"),
  suiteBody: b(
    "Every piece is designed together, so your day reads as one story, from the save the date to the last place card.",
    "Cada pieza se diseña en conjunto, para que tu día cuente una sola historia, desde el save the date hasta la última tarjeta de lugar."
  ),
  suiteHint: b("Hover a piece for a closer look, click to see it full size.", "Pasa el cursor sobre una pieza para verla de cerca; haz clic para verla completa."),
  suiteHintTouch: b("Tap a piece to see it full size.", "Toca una pieza para verla completa."),
  viewFullDesign: b("View full design", "Ver diseño completo"),
  processEyebrow: b("How it works", "Cómo funciona"),
  processHeading: b("From a blank page to your hands", "De una página en blanco a tus manos"),
  occasionsEyebrow: b("Two celebrations, one craft", "Dos celebraciones, un mismo oficio"),
  weddingsCard: b("Invitations, signs and every little detail for your wedding day.", "Invitaciones, carteles y cada pequeño detalle para el día de tu boda."),
  eventsCard: b("Showers, birthdays, graduations, quinceañeras and dinner parties.", "Showers, cumpleaños, graduaciones, quinceañeras y cenas."),
  wedding: b("Wedding", "Boda"),
  event: b("Event", "Evento"),
  seeCollections: b("See the collections", "Ver las colecciones"),
  askAbout: b("Ask about this suite", "Pregunta por esta colección"),
  whatsIncluded: b("What's included", "Qué incluye"),
  turnOver: b("Turn over", "Voltear"),
  waysEyebrow: b("Ways to work together", "Formas de trabajar juntos"),
  customTitle: b("Fully custom", "Totalmente personalizado"),
  customBody: b(
    "Designed from scratch for your date. Start with a message and I'll put together a quote just for you.",
    "Diseñado desde cero para tu fecha. Empieza con un mensaje y armaré una cotización solo para ti."
  ),
  zolaTitle: b("Find me on Zola", "Encuéntrame en Zola"),
  zolaBody: b(
    "Planning on Zola? My vendor profile is there too, so you can keep everything in one place.",
    "¿Planeas en Zola? Mi perfil de proveedora también está ahí, para que tengas todo en un solo lugar."
  ),
  zolaCta: b("View my Zola profile", "Ver mi perfil en Zola"),
  wishlistHeading: b("Build your wish list", "Arma tu lista de deseos"),
  wishlistBody: b(
    "Tap the pieces you're dreaming of, then send them to me in one email.",
    "Toca las piezas que sueñas y envíamelas en un solo correo."
  ),
  wishlistCta: b("Email my list", "Enviar mi lista"),
  wishlistEmpty: b("Pick a few pieces first", "Primero elige algunas piezas"),
  selected: b("selected", "elegidas"),
  dragHint: b("Drag the pieces around", "Mueve las piezas"),
  mailSubject: b("Stationery inquiry", "Consulta de papelería"),
  mailWishlistIntro: b("Hi Janelle! I'd love to hear more about:", "¡Hola Janelle! Me encantaría saber más sobre:"),
  menu: b("Menu", "Menú"),
  close: b("Close", "Cerrar"),
  scroll: b("Scroll", "Desliza"),
  grid: b("Grid", "Cuadrícula"),
  lookbook: b("Lookbook", "Lookbook"),
  chapterWork: b("The work", "El trabajo"),
  chapterProcess: b("The process", "El proceso"),
  chapterCollections: b("The collections", "Las colecciones"),
  chapterWords: b("Kind words", "Palabras amables"),
  /** Janelle's own words, from about.sections[1] ("Why Stationery?"). */
  pullQuote: b("I create your vision, I create from the heart.", "Yo creo tu visión, creo desde el corazón."),
  byline: b("Words by Janelle Gutiérrez", "Palabras de Janelle Gutiérrez"),
  issue: b("Weddings & Events · Stationery & Signage", "Bodas y Eventos · Papelería y Señalización"),
  fig: b("Fig.", "Fig."),
  stickers: [
    b("Designed from scratch", "Diseñado desde cero"),
    b("English & Español", "English & Español"),
    b("Printed or digital", "Impreso o digital"),
  ],
};
