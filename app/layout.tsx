// Root layout for the application
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GutierrezByJanelle",
  description: "Boutique digital assets for designers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}