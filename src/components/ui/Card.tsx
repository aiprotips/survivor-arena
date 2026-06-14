import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function Card({ children, className, ...props }: CardProps) {
  return (
    <article className={cn("ui-card", className)} {...props}>
      {children}
    </article>
  );
}
