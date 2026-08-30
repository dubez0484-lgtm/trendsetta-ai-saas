import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
    variant === "primary" && "bg-neon-500 text-matte-950 shadow-glow-sm hover:bg-neon-400",
    variant === "ghost" &&
      "border border-white/10 bg-white/5 text-white hover:border-neon-500/50 hover:bg-white/10",
    variant === "danger" && "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
    className
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
