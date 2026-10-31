import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Manrope, Space_Grotesk, Space_Mono } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/config/site";
import { I18nProvider } from "@/i18n/client";
import { locales } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import "../globals.css";

export const ensureStatic = "navigation";

// Space Grotesk and Space Mono have no Cyrillic; globals.css swaps in Manrope and JetBrains Mono on Russian pages.
const display = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const displayCyrillic = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  preload: false,
});

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const mono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const monoCyrillic = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  preload: false,
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  const title = `${siteConfig.name} — ${t.meta.tagline}`;
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: title, template: `%s — ${siteConfig.name}` },
    description: t.meta.description,
    applicationName: siteConfig.name,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: t.meta.ogLocale,
      title,
      description: t.meta.description,
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#f7f7f5",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, t } = await getI18n();
  const fonts = [display, displayCyrillic, sans, mono, monoCyrillic].map((font) => font.variable).join(" ");
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${fonts} antialiased`}>
      <body className="flex min-h-svh flex-col">
        <I18nProvider locale={locale} dictionary={t}>
          <a
            href="#main"
            className="label sr-only z-100 bg-ink px-4 py-3 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            {t.common.skipToContent}
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
