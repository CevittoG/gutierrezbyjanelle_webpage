import { ImageResponse } from "next/og";
import { brand, logoDataUrl } from "@/lib/og-brand";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon: the "G" monogram pressed into a chestnut wax seal, like the site's seals. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 9999,
          backgroundImage: `radial-gradient(circle at 35% 30%, ${brand.chestnutLight}, ${brand.chestnut} 55%, ${brand.chestnutDeep})`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse needs a plain img */}
        <img src={logoDataUrl(brand.linen, { monogramOnly: true })} width={42} height={42} alt="" />
      </div>
    ),
    { ...size }
  );
}
