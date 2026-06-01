import type { Metadata } from "next";
import { Anybody, Square_Peg } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { LocaleProvider } from "@/lib/locale-context";
import { siteConfig } from "@/config/site";

const anybody = Anybody({ subsets: ["latin"], variable: "--font-anybody", display: "swap" });
const squarePeg = Square_Peg({ subsets: ["latin"], weight: "400", variable: "--font-squarepeg", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    alternateLocale: siteConfig.alternateLocales,
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: siteConfig.ogImages,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: siteConfig.twitterImages,
  },
  icons: { icon: "/icon", shortcut: "/icon" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${anybody.variable} ${squarePeg.variable}`}>
      <body className="font-anybody antialiased min-h-screen flex flex-col">
        <LocaleProvider>
          {/* Skip-to-content for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:border focus:border-border focus:rounded-lg focus:text-sm focus:font-medium focus:shadow-md"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main-content" className="flex-1">{children}</main>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}