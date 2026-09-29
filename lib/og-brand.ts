import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Brand pieces for the generated images (link-preview card, favicon).
 * ImageResponse can't read CSS variables, so the palette is mirrored here —
 * keep it in sync with the :root block in app/globals.css.
 */
export const brand = {
  linen: "#F7F4ED",
  card: "#FCFBF7",
  ink: "#292F22",
  olive: "#4E5C3D",
  muted: "#525A49",
  chestnut: "#815237",
  chestnutDeep: "#623B28",
  chestnutLight: "#D2A37F",
  sage: "#9CAE8F",
};

/**
 * Janelle's monogram (public/logo.svg) recolored, as a data URL for <img>.
 * `monogramOnly` crops to the "G" and thickens its strokes so it still reads
 * at favicon size, where the arcs and wordmark turn to noise.
 */
export function logoDataUrl(color: string, { monogramOnly = false } = {}): string {
  let svg = readFileSync(join(process.cwd(), "public/logo.svg"), "utf8");
  // The two outer arcs are the only filled <path>s; the letters are glyph groups.
  if (monogramOnly) svg = svg.replace(/<path fill="#000000"[^>]*\/>/g, "");
  svg = svg.replaceAll('fill="#000000"', monogramOnly ? `fill="${color}" stroke="${color}" stroke-width="36"` : `fill="${color}"`);
  if (monogramOnly) svg = svg.replace(/viewBox="[^"]*"/, 'viewBox="330 250 1120 1120"');
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * A Google Font as TTF, subset to `text`. Images are rendered at build time,
 * which already needs the network for next/font; if the fetch fails the image
 * falls back to the default font instead of failing the build.
 */
export async function googleFont(family: string, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}
