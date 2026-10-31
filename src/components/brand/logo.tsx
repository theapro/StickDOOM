import { cn } from "@/lib/cn";

/** Brand mark: a square sticker with its corner peeled back. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("shrink-0", className)}>
      <path d="M2 2h20v13l-7 7H2z" fill="currentColor" />
      <path d="M22 15h-7v7z" fill="var(--color-accent)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-[1.0625rem] font-bold uppercase leading-none tracking-[-0.04em]",
        className,
      )}
    >
      <Mark className="size-[0.95em]" />
      <span lang="en">STICKDOOM</span>
    </span>
  );
}
