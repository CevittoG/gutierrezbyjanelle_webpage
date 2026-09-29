import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { conceptCopy } from "@/config/concepts";
import { brand, googleFont, logoDataUrl } from "@/lib/og-brand";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The link-preview card: a stitched linen card with Janelle's monogram pressed
 * into a chestnut wax seal, the name in Square Peg and the tagline in Anybody.
 * Rendered once at build time.
 */
export default async function Image() {
  const eyebrow = conceptCopy.heroEyebrow.en.toUpperCase();
  const tagline = siteConfig.hero.headline.en;
  const [squarePeg, anybody] = await Promise.all([
    googleFont("Square+Peg", siteConfig.name),
    googleFont("Anybody:wght@400", eyebrow + tagline),
  ]);
  const fonts = [
    ...(squarePeg ? [{ name: "Square Peg", data: squarePeg, weight: 400 as const }] : []),
    ...(anybody ? [{ name: "Anybody", data: anybody, weight: 400 as const }] : []),
  ];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: brand.linen, padding: 36 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 60,
            padding: "0 80px",
            background: brand.card,
            border: `2px dashed ${brand.sage}`,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              width: 280,
              height: 280,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9999,
              backgroundImage: `radial-gradient(circle at 35% 30%, ${brand.chestnutLight}, ${brand.chestnut} 55%, ${brand.chestnutDeep})`,
              boxShadow: `0 18px 36px -12px ${brand.chestnutDeep}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse needs a plain img */}
            <img src={logoDataUrl(brand.linen)} width={220} height={220} alt="" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Anybody", fontSize: 22, letterSpacing: 5, color: brand.chestnut }}>
              <div style={{ width: 48, height: 2, background: brand.chestnut }} />
              {eyebrow}
            </div>
            <div style={{ fontFamily: "Square Peg", fontSize: 112, lineHeight: 1, color: brand.ink }}>{siteConfig.name}</div>
            <div style={{ fontFamily: "Anybody", fontSize: 30, color: brand.muted }}>{tagline}</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
