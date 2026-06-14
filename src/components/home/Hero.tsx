import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="arena-shell grid min-h-[68vh] items-center gap-10 py-arena-section md:grid-cols-[minmax(0,1.05fr)_minmax(17rem,0.95fr)]">
      <div className="max-w-3xl">
        <div className="arena-eyebrow mb-6">
          <span aria-hidden="true">◆</span>
          Last Player Standing
        </div>
        <h1 className="font-display text-6xl leading-none text-arena-white sm:text-7xl md:text-8xl">
          SURVIVOR ARENA
        </h1>
        <div className="mt-5 h-1.5 w-28 rounded-arena bg-arena-gold shadow-arena-glow" />
        <p className="mt-8 text-2xl font-extrabold text-arena-gold sm:text-3xl">
          Benvenuto nella Survivor Arena
        </p>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-arena-muted sm:text-xl">
          Sopravvivi turno dopo turno. Una sola scelta sbagliata e sei eliminato.
        </p>
        <div className="mt-9 grid gap-3 sm:flex">
          <Button>Entra nell&apos;Arena</Button>
          <Button variant="secondary">Scopri il Gioco</Button>
        </div>
      </div>

      <div className="arena-stage min-h-72 p-5 sm:min-h-96">
        <div className="relative z-10 flex h-full min-h-64 flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.08em] text-arena-muted">
            <span>Arena</span>
            <span className="text-arena-survival">Live Ready</span>
          </div>
          <div className="mx-auto grid size-36 place-items-center rounded-arena-card border border-arena-border bg-arena-background shadow-arena-glow sm:size-44">
            <span className="text-6xl sm:text-7xl" aria-hidden="true">
              👑
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black uppercase tracking-[0.08em]">
            <span className="rounded-arena border border-arena-border bg-arena-background px-2 py-3 text-arena-gold">
              Pick
            </span>
            <span className="rounded-arena border border-arena-border bg-arena-background px-2 py-3 text-arena-survival">
              Safe
            </span>
            <span className="rounded-arena border border-arena-border bg-arena-background px-2 py-3 text-arena-elimination">
              Out
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
