import { cn } from "@/lib/utils";
import Link from "next/link";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm transition active:scale-[0.99] hover:border-neon-500/40 hover:bg-white/[0.06]",
        className
      )}
    >
      {children}
    </Link>
  );
}
