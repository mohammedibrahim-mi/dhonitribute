import type { Metadata, Viewport } from "next";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/caveat/600.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/400-italic.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter-tight/300.css";
import "@fontsource/inter-tight/400.css";
import "@fontsource/inter-tight/800.css";
import "./globals.css";
import { site } from "@/data/site";
import { themeBootScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  ...(site.url ? { metadataBase: new URL(site.url), alternates: { canonical: "/" } } : {}),
  openGraph: {
    title: site.title,
    description: site.description,
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "MS Dhoni fan tribute — The Captain, The Calm, The Legacy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: ["/og-image.jpg"],
  },
  icons: { icon: "/favicon.svg" },
  // Not marked as an official site — no Person/Organization structured data (spec §17).
};

export const viewport: Viewport = {
  themeColor: "#070B14",
  width: "device-width",
  initialScale: 1,
};

// Turns on reveal animations only when JS runs and the visitor allows motion.
// Without this class every section is fully visible (spec §2, §13).
const motionScript = `try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('anim')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
