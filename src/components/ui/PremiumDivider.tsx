import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type PremiumDividerProps = HTMLAttributes<HTMLDivElement>;

export function PremiumDivider({ className, ...props }: PremiumDividerProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn("ui-premium-divider", className)}
    >
      <span className="ui-premium-divider-line ui-premium-divider-line-left" />
      <span className="ui-premium-divider-star">
        <svg className="ui-premium-divider-star-icon" viewBox="0 0 24 24">
          <path d="M12 3.5 14.15 9.85 20.5 12 14.15 14.15 12 20.5 9.85 14.15 3.5 12 9.85 9.85 12 3.5Z" />
        </svg>
      </span>
      <span className="ui-premium-divider-line ui-premium-divider-line-right" />
    </div>
  );
}
