import { Card } from "@/components/ui/Card";
import { homeStats } from "@/content/home";

type StatIconName = (typeof homeStats)[number]["icon"];

function StatIcon({ name }: { name: StatIconName }) {
  if (name === "users") {
    return (
      <svg className="stat-icon-svg" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M19 22a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
        <path d="M5 40c1.7-7.2 7-11 14-11s12.3 3.8 14 11" />
        <path d="M34 24a5.5 5.5 0 1 0-2.2-10.5" />
        <path d="M34 29c4.8.5 8.1 3.5 9 8.7" />
      </svg>
    );
  }

  if (name === "prize") {
    return (
      <svg className="stat-icon-svg stat-icon-gold" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 17h28v22H10V17Z" />
        <path d="M8 17h32v-6H8v6Z" />
        <path d="M24 11v28" />
        <path d="M16 11c-3-5 5-7 8 0" />
        <path d="M32 11c3-5-5-7-8 0" />
      </svg>
    );
  }

  if (name === "crown") {
    return (
      <svg className="stat-icon-svg stat-icon-gold" viewBox="0 0 48 48" aria-hidden="true">
        <path d="m8 17 9 8 7-13 7 13 9-8-4 19H12L8 17Z" />
        <path d="M13 40h22" />
        <path d="M24 8v4" />
      </svg>
    );
  }

  return (
    <svg className="stat-icon-svg stat-icon-gold" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M16 10h16v9c0 5.2-3.5 9-8 9s-8-3.8-8-9v-9Z" />
      <path d="M16 14H9c0 6 3.4 10 8.4 10.8" />
      <path d="M32 14h7c0 6-3.4 10-8.4 10.8" />
      <path d="M24 28v8" />
      <path d="M17 40h14" />
    </svg>
  );
}

export function StatsSection() {
  return (
    <section className="arena-shell stats-shell">
      <Card className="stats-strip">
        <div className="stats-strip-heading">
          <span>Dati dimostrativi</span>
          <p>Numeri di esempio per mostrare il formato delle Arene ufficiali.</p>
        </div>
        {homeStats.map((stat) => (
          <div className="stat-item" key={stat.label}>
            <span className="stat-icon">
              <StatIcon name={stat.icon} />
            </span>
            <div className="stat-copy">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}
