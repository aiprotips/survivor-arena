import { TournamentCard } from "@/components/home/TournamentCard";
import { tournaments } from "@/content/home";

export function TournamentsSection() {
  return (
    <section className="arena-shell pb-arena-section">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="section-heading">
          <p className="section-kicker">Tornei in evidenza</p>
          <h2 className="mt-3 text-3xl font-black text-arena-white sm:text-4xl">
            Arene pronte per la prossima sfida
          </h2>
        </div>
        <p className="max-w-md text-base leading-7 text-arena-muted">
          Competizioni demo pensate per mostrare prestigio, premi e partecipazione.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament.title} {...tournament} />
        ))}
      </div>
    </section>
  );
}
