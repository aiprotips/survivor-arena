import { Crown, Medal, ShieldCheck, Sparkles, TrendingUp, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";
import { PremiumDivider } from "@/components/ui/PremiumDivider";

const rankingRows = [
  {
    name: "Survivor_One",
    points: "2.450",
    rank: "1",
    trend: "+12",
  },
  {
    name: "TheLastOne",
    points: "2.150",
    rank: "2",
    trend: "+8",
  },
  {
    name: "ArenaKing",
    points: "1.890",
    rank: "3",
    trend: "+5",
  },
  {
    name: "SurviveToWin",
    points: "1.650",
    rank: "4",
    trend: "+3",
  },
] as const;

const rankingHighlights = [
  {
    icon: Trophy,
    label: "Arene vinte",
    value: "12",
  },
  {
    icon: ShieldCheck,
    label: "Scelte corrette",
    value: "72%",
  },
  {
    icon: Sparkles,
    label: "Serie migliore",
    value: "8 round",
  },
] as const;

export function PublicClassifichePreview() {
  return (
    <>
      <SiteHeader />
      <main className="public-preview-page">
        <section className="arena-shell public-preview-hero" aria-labelledby="public-ranking-title">
          <p className="user-page-kicker">Classifiche</p>
          <h1 id="public-ranking-title">Guarda come nasce la scalata.</h1>
          <p>
            Una preview dimostrativa per capire come verranno presentate posizioni,
            progressi e migliori sopravvissuti quando le Arene saranno attive.
          </p>
          <PremiumDivider />
          <div className="public-preview-actions">
            <ButtonLink href="/login">Accedi e partecipa</ButtonLink>
            <ButtonLink href="/arene" variant="secondary">
              Vedi Arene demo
            </ButtonLink>
          </div>
        </section>

        <section className="arena-shell public-ranking-layout" aria-label="Classifica demo">
          <article className="public-ranking-board">
            <div className="public-ranking-heading">
              <div>
                <p className="user-page-kicker">Demo globale</p>
                <h2>Classifica generale</h2>
              </div>
              <span>Dati illustrativi</span>
            </div>

            <div className="public-ranking-tabs" aria-label="Filtri classifica demo">
              <span>Globale</span>
              <span>Settimanale</span>
              <span>Mensile</span>
            </div>

            <div className="public-ranking-list">
              {rankingRows.map((row) => (
                <article className="public-ranking-row" key={row.name}>
                  <span className="public-ranking-rank">
                    {row.rank === "1" ? <Crown aria-hidden="true" /> : row.rank}
                  </span>
                  <div>
                    <strong>{row.name}</strong>
                    <span>Posizione demo</span>
                  </div>
                  <em>{row.points}</em>
                  <span className="public-ranking-trend">
                    <TrendingUp aria-hidden="true" />
                    {row.trend}
                  </span>
                </article>
              ))}
            </div>
          </article>

          <aside className="public-ranking-side">
            <article className="public-preview-panel">
              <Medal aria-hidden="true" className="public-panel-mark" />
              <h2>Come si sale?</h2>
              <p>
                Partecipando alle Arene, superando round e restando in gioco più
                a lungo degli altri utenti.
              </p>
            </article>

            <div className="public-ranking-stats">
              {rankingHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <article className="public-ranking-stat" key={item.label}>
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                );
              })}
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}
