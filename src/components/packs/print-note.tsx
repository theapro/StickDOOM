import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { cn } from "@/lib/cn";

/** Sets expectations: on-screen stickers are enlarged and look thick; the real ones are thin paper. */
export function PrintNote({
  material,
  copy,
  className,
}: {
  material: string;
  copy: Dictionary["print"];
  className?: string;
}) {
  return (
    <p className={cn("leading-relaxed text-muted", className)}>
      <span className="label mr-2 text-ink">{copy.label}</span>
      {format(copy.text, { material })}
    </p>
  );
}
