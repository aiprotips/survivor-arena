import { TournamentCard } from "@/components/home/TournamentCard";
import { tournaments } from "@/content/home";

export function TournamentsSection() {
  return (
    <section className="arena-shell tournaments-shell">
      <div className="tournaments-heading">
        <div>
          <p className="tournaments-eyebrow">Anteprima illustrativa</p>
          <h2 className="tournaments-title">Tornei in evidenza</h2>
        </div>
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
