import { Crown, Trophy, UsersRound, Zap } from "lucide-react";
import { homeStats } from "@/content/home";

type StatIconName = (typeof homeStats)[number]["icon"];

function StatIcon({ name }: { name: StatIconName }) {
  const icons = {
    crown: Crown,
    trophy: Trophy,
    users: UsersRound,
    zap: Zap,
  } as const;
  const Icon = icons[name];

  return <Icon aria-hidden="true" className="public-home-stat-svg" />;
}

export function StatsSection() {
  return (
    <section className="public-home-section public-home-stats" aria-label="Numeri Survivor Arena">
      <div className="public-home-stats-strip">
        {homeStats.map((stat) => (
          <article className="public-home-stat-item" key={stat.label}>
            <span className="public-home-stat-icon">
              <StatIcon name={stat.icon} />
            </span>
            <div>
              <p>{stat.value}</p>
              <span>{stat.label}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
