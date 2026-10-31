import type { Metadata } from "next";
import { Hero } from "@/components/hero/hero";
import { BrandStatement } from "@/components/home/brand-statement";
import { ExploreCta } from "@/components/home/explore-cta";
import { FeaturedPacks } from "@/components/home/featured-packs";
import { getI18n, languageAlternates } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getI18n();
  return { alternates: languageAlternates(locale, "/") };
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="border-t border-line">
        <FeaturedPacks />
      </div>
      <ExploreCta />
      <BrandStatement />
    </>
  );
}
