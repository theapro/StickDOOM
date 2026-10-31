import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "quiet" | "disabled";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex select-none items-center justify-center gap-3 whitespace-nowrap font-display font-medium uppercase tracking-[0.01em] transition-[background-color,color,border-color,transform] duration-300 ease-out-expo active:translate-y-px";

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[0.8125rem]",
  md: "h-12 px-6 text-sm",
  lg: "h-14 px-7 text-[0.9375rem]",
};

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-[#2b2b2b]",
  secondary: "border border-ink text-ink hover:bg-ink hover:text-paper",
  quiet: "text-ink underline-offset-[6px] hover:underline px-0! h-auto!",
  disabled: "cursor-not-allowed border border-line bg-card text-muted active:translate-y-0",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(base, sizes[size], variants[variant], className);
}

export function ArrowGlyph({ className }: { className?: string }) {
  return (
    <ArrowRight
      aria-hidden
      strokeWidth={1.75}
      className={cn(
        "size-4 shrink-0 transition-transform duration-300 ease-out-expo group-hover/btn:translate-x-1",
        className,
      )}
    />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  children: ReactNode;
};

export function ButtonLink({
  variant,
  size,
  arrow = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link {...props} className={buttonClasses({ variant, size, className })}>
      {children}
      {arrow && <ArrowGlyph />}
    </Link>
  );
}
