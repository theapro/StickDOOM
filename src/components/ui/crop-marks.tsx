import { cn } from "@/lib/cn";

const corners = [
  "left-0 top-0 border-l border-t",
  "right-0 top-0 border-r border-t",
  "bottom-0 left-0 border-b border-l",
  "bottom-0 right-0 border-b border-r",
];

/** Print-production corner marks used to frame artwork areas. */
export function CropMarks({ className, size = "size-3" }: { className?: string; size?: string }) {
  return (
    <span aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {corners.map((corner) => (
        <span key={corner} className={cn("absolute border-ink/45", size, corner)} />
      ))}
    </span>
  );
}
