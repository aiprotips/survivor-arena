import { Clock3, Heart, Info, ShieldCheck, Trophy, Users } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";
import { PremiumDivider } from "@/components/ui/PremiumDivider";

const previewArenas = [
  {
    entry: "Accesso demo",
    included: "3 vite",
    limit: "1.245 / 2.000",
    status: "Anteprima",
    title: "Arena Champions",
  },
  {
    entry: "Apertura demo",
    included: "2 vite",
    limit: "782 / 1.500",
    status: "In arrivo",
    title: "Survivor Cup",
  },
  {
    entry: "Invito demo",
    included: "1 vita",
    limit: "312 / 1.000",
    status: "In arrivo",
    title: "Legends Arena",
  },
] as const;

const publicMatches = [
  ["Juve", "Inter"],
  ["Roma", "Milan"],
  ["Napoli", "Lazio"],
] as const;

export function PublicArenasPreview() {
  return (
    <>
      <SiteHeader />
      <main className="public-preview-page">
        <section className="arena-shell public-preview-hero" aria-labelledby="public-arenas-title">
          <p className="user-page-kicker">Arene pubbliche</p>
          <h1 id="public-arenas-title">Scopri come si presenta una competizione.</h1>
          <p>
            Questa è una preview illustrativa: le Arene ufficiali compariranno qui
            quando saranno pubblicate e aperte ai partecipanti.
          </p>
          <PremiumDivider />
          <div className="public-preview-actions">
            <ButtonLink href="/login">Entra nell&apos;Arena</ButtonLink>
            <ButtonLink href="/come-funziona" variant="secondary">
              Come funziona
            </ButtonLink>
          </div>
        </section>

        <section className="arena-shell public-preview-grid" aria-label="Anteprime Arene">
          {previewArenas.map((arena) => (
            <article className="public-preview-card public-arena-card" key={arena.title}>
              <div className="public-preview-card-top">
                <span className="public-preview-badge">{arena.status}</span>
                <Info aria-hidden="true" />
              </div>
              <div>
                <h2>{arena.title}</h2>
                <p>Facsimile di card torneo, pensato per mostrare il flusso prima dell&apos;apertura reale.</p>
              </div>
              <div className="public-preview-meta">
                <span>
                  <Trophy aria-hidden="true" />
                  {arena.entry}
                </span>
                <span>
                  <Heart aria-hidden="true" />
                  {arena.included}
                </span>
                <span>
                  <Users aria-hidden="true" />
                  {arena.limit}
                </span>
                <span>
                  <Clock3 aria-hidden="true" />
                  Deadline demo
                </span>
              </div>
              <ButtonLink className="public-preview-card-button" href="/login">
                Accedi per partecipare
              </ButtonLink>
            </article>
          ))}
        </section>

        <section className="arena-shell public-preview-split" aria-label="Esempio round">
          <article className="public-preview-panel">
            <p className="user-page-kicker">Round demo</p>
            <h2>Prima scegli la vita, poi scegli la squadra.</h2>
            <p>
              Ogni vita ha uno storico indipendente. La scelta resta modificabile
              fino alla deadline, poi l&apos;Arena blocca tutto.
            </p>
            <div className="public-life-row" aria-label="Vite demo">
              <span>Vita 1</span>
              <span>Vita 2</span>
              <span>Vita 3</span>
            </div>
          </article>

          <article className="public-preview-panel">
            <p className="user-page-kicker">Match disponibili</p>
            <div className="public-match-list">
              {publicMatches.map(([home, away]) => (
                <div className="public-match-row" key={`${home}-${away}`}>
                  <strong>{home}</strong>
                  <span>VS</span>
                  <strong>{away}</strong>
                </div>
              ))}
            </div>
            <div className="public-preview-note">
              <ShieldCheck aria-hidden="true" />
              Demo non giocabile: serve solo a mostrare la struttura delle Arene.
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
