import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "hsl(30, 35%, 72%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "hsl(20, 10%, 12%)",
          }}
        >
          {siteConfig.name.charAt(0)}
        </span>
      </div>
    ),
    { ...size }
  );
}
