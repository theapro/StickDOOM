import { SectionHead } from "@/components/ui/section-head";
import { getI18n } from "@/i18n/server";

export async function BrandStatement() {
  const { t } = await getI18n();
  return (
    <section id="about" aria-labelledby="about-heading" className="shell py-24 md:py-36">
      <SectionHead index="03" label={t.home.about} meta={t.common.location} />
      <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-10 md:mt-20 lg:grid-cols-12">
        <h2 id="about-heading" className="type-h2 lg:col-span-9">
          {t.home.aboutTitle}
          <span className="text-accent">.</span>
        </h2>
        <p className="type-lead max-w-sm text-muted lg:col-span-3 lg:self-end">{t.home.aboutLead}</p>
      </div>
    </section>
  );
}
