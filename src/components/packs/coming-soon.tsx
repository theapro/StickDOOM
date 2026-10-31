import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

/** Honest placeholder that signals future drops without inventing products. */
export async function ComingSoonTile({ className }: { className?: string }) {
  const { t } = await getI18n();
  return (
    <div
      className={cn(
        "flex aspect-4/5 flex-col justify-between border border-dashed border-line-strong p-5 text-muted",
        className,
      )}
    >
      <span className="label">SD—NEXT</span>
      <div>
        <p className="font-display text-2xl font-bold leading-tight tracking-[-0.03em] text-ink">
          {t.comingSoon.title[0]}
          <br />
          {t.comingSoon.title[1]}
        </p>
        <p className="label mt-3">{t.home.inStudio}</p>
      </div>
    </div>
  );
}
