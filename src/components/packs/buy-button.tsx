import { ArrowUpRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { format } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import type { StickerPack } from "@/lib/types";

type Size = "sm" | "md" | "lg";

/**
 * Sends the shopper to the pack's own Uzum Market product page. Without a
 * configured `uzumUrl` the button renders a disabled, clearly-labelled state.
 */
export async function BuyButton({
  pack,
  size = "md",
  label,
  unavailableLabel,
  className,
}: {
  pack: StickerPack;
  size?: Size;
  label?: string;
  unavailableLabel?: string;
  className?: string;
}) {
  const { t } = await getI18n();
  const marketplace = siteConfig.marketplace;

  if (!pack.uzumUrl) {
    return (
      <button
        type="button"
        disabled
        title={format(t.pack.notListed, { name: pack.name, marketplace })}
        className={buttonClasses({ variant: "disabled", size, className })}
      >
        {unavailableLabel ?? t.pack.notOnUzum}
      </button>
    );
  }

  return (
    <a
      href={pack.uzumUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClasses({ size, className })}
    >
      {label ?? t.pack.buyNow}
      <ArrowUpRight
        aria-hidden
        strokeWidth={1.75}
        className="size-4 transition-transform duration-300 ease-out-expo group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5"
      />
      <span className="sr-only">
        {" "}
        {format(t.pack.onMarketplace, { name: pack.name, marketplace })} {t.common.opensInNewTab}
      </span>
    </a>
  );
}
