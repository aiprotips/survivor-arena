import { TournamentCard } from "@/components/home/TournamentCard";
import { tournaments } from "@/content/home";

export function TournamentsSection() {
  return (
    <section className="arena-shell tournaments-shell">
      <div className="tournaments-heading">
        <h2 className="tournaments-title">Tornei in evidenza</h2>
        <a className="tournaments-link" href="/arene">
          Vedi tutti <span aria-hidden="true">→</span>
        </a>
      </div>
      <div className="tournaments-track">
        {tournaments.map((tournament) => (
          <TournamentCard key={tournament.title} {...tournament} />
        ))}
      </div>
    </section>
  );
}
