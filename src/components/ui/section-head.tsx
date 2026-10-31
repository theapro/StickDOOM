import { cn } from "@/lib/cn";

/** Mono index row that opens every section: "[01] Collection ———— meta". */
export function SectionHead({
  index,
  label,
  meta,
  className,
}: {
  index: string;
  label: string;
  meta?: string;
  className?: string;
}) {
  return (
    <div className={cn("label flex items-center gap-4 text-muted", className)}>
      <span className="text-ink">[{index}]</span>
      <span>{label}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
      {meta && <span>{meta}</span>}
    </div>
  );
}
