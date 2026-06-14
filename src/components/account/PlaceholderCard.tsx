import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";

type PlaceholderCardProps = {
  children?: ReactNode;
  eyebrow?: string;
  meta?: string;
  title: string;
};

export function PlaceholderCard({ children, eyebrow, meta, title }: PlaceholderCardProps) {
  return (
    <article className="user-placeholder-card">
      <div className="user-placeholder-heading">
        {eyebrow ? <Badge tone="gold">{eyebrow}</Badge> : null}
        <h3>{title}</h3>
        {meta ? <p>{meta}</p> : null}
      </div>
      {children ? <div className="user-placeholder-body">{children}</div> : null}
    </article>
  );
}
