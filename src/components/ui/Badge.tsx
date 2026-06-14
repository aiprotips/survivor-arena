import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "blue" | "gold";

type BadgeProps = PropsWithChildren<
  HTMLAttributes<HTMLSpanElement> & {
    tone?: BadgeTone;
  }
>;

const badgeTones: Record<BadgeTone, string> = {
  blue: "",
  gold: "ui-badge-gold",
};

export function Badge({ children, className, tone = "blue", ...props }: BadgeProps) {
  return (
    <span className={cn("ui-badge", badgeTones[tone], className)} {...props}>
      {children}
    </span>
  );
}
