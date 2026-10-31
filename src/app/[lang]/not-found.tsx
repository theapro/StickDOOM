import { ButtonLink } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t, href } = await getI18n();
  return (
    <section className="shell flex min-h-[70svh] flex-col justify-center py-24">
      <p className="label text-muted">{t.notFound.kicker}</p>
      <h1 className="type-h1 mt-6 max-w-4xl">{t.notFound.title}</h1>
      <p className="type-lead mt-6 max-w-md text-muted">{t.notFound.text}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href={href("/explore")} arrow>
          {t.notFound.explore}
        </ButtonLink>
        <ButtonLink href={href("/")} variant="secondary">
          {t.notFound.home}
        </ButtonLink>
      </div>
    </section>
  );
}
