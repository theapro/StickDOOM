import { getI18n } from "@/i18n/server";
import { formatPrice } from "@/lib/catalog";
import type { StickerPack } from "@/lib/types";
import { cn } from "@/lib/cn";

/** `amountClassName` only styles a real price; the placeholder keeps label sizing. */
export async function Price({
  pack,
  className,
  amountClassName,
}: {
  pack: StickerPack;
  className?: string;
  amountClassName?: string;
}) {
  const { t } = await getI18n();
  const price = formatPrice(pack.price, t.common.currency[pack.currency]);
  return price ? (
    <span className={cn("font-display font-medium tabular-nums", className, amountClassName)}>
      {price}
    </span>
  ) : (
    <span className={cn("label text-muted", className)}>{t.pack.priceSoon}</span>
  );
}
