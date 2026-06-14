import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type StatCardProps = {
  icon: ReactNode;
  label: string;
  tone?: "blue" | "gold";
  value: string;
};

export function StatCard({ icon, label, tone = "blue", value }: StatCardProps) {
  return (
    <article className="user-stat-card">
      <span className={cn("user-stat-icon", tone === "gold" && "user-stat-icon-gold")}>
        {icon}
      </span>
      <div className="user-stat-copy">
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
