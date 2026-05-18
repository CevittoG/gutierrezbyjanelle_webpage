import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const runtime = "edge";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "hsl(42, 40%, 94%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
        }}
      >
        <p
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "hsl(20, 10%, 12%)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {siteConfig.name}
        </p>
        <p
          style={{
            fontSize: 32,
            color: "hsl(20, 10%, 45%)",
            margin: 0,
            maxWidth: 800,
            textAlign: "center",
          }}
        >
          {siteConfig.description}
        </p>
      </div>
    ),
    { ...size }
  );
}
