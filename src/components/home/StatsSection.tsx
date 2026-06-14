import { Card } from "@/components/ui/Card";
import { homeStats } from "@/content/home";

export function StatsSection() {
  return (
    <section className="arena-shell -mt-16 relative z-20 pb-arena-section">
      <Card className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
        {homeStats.map((stat) => (
          <div
            className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-arena-card bg-arena-surface/70 p-5"
            key={stat.label}
          >
            <span className="grid size-12 place-items-center rounded-arena-pill border border-arena-border bg-arena-card-strong text-sm font-black text-arena-blue-soft">
              {stat.icon}
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-arena-muted-soft">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-black text-arena-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}
