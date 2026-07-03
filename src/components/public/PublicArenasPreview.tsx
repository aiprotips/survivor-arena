import {
  ArrowRight,
  CalendarClock,
  Crown,
  LockKeyhole,
  ShieldCheck,
  ShieldPlus,
  Trophy,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PublicFooter } from "@/components/home/PublicFooter";
import { ButtonLink } from "@/components/ui/Button";
import { getPublicHomeImageStyle } from "@/components/home/imageSlotStyle";
import { arenaHowItWorksSteps, arenaPrivatePoints, publicArenasImages } from "@/content/public-arenas";

const stepIcons = {
  calendar: CalendarClock,
  shield: ShieldPlus,
  trophy: Trophy,
  users: UsersRound,
} as const;

const privatePointIcons = [UsersRound, ShieldCheck, UserCheck] as const;

export function PublicArenasPreview() {
  return (
    <>
      <SiteHeader />
      <main className="public-arenas-page">
        <section
          aria-labelledby="public-arenas-hero-title"
          className="public-arenas-hero"
          data-image-slot="public-arenas.hero"
          style={getPublicHomeImageStyle("public-arenas-hero", publicArenasImages.hero)}
        >
          <div className="public-arenas-hero-image" aria-hidden="true" />
          <div className="public-arenas-hero-inner">
            <div className="public-arenas-hero-copy">
              <h1 id="public-arenas-hero-title">
                Entra nella
                <span>tua Arena</span>
              </h1>
              <p>Arene private. Solo tu e i tuoi amici. Crea, invita, sfida. Solo uno sopravvive.</p>
              <div className="public-arenas-actions">
                <ButtonLink className="public-arenas-cta" href="/register">
                  Crea la tua Arena
                  <ArrowRight aria-hidden="true" className="public-home-button-icon" />
                </ButtonLink>
                <ButtonLink className="public-arenas-cta" href="/come-funziona" variant="secondary">
                  Scopri come funziona
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className="public-arenas-section public-arenas-steps" aria-labelledby="public-arenas-steps-title">
          <h2 id="public-arenas-steps-title">Come funzionano le Arene</h2>
          <div className="public-arenas-step-grid">
            {arenaHowItWorksSteps.map((step) => {
              const Icon = stepIcons[step.icon];

              return (
                <article className="public-arenas-step-card" key={step.number}>
                  <span className="public-arenas-step-number">{step.number}</span>
                  <span className="public-arenas-step-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="public-arenas-private-title"
          className="public-arenas-section public-arenas-private"
          data-image-slot="public-arenas.privateArena"
          style={getPublicHomeImageStyle("public-arenas-private", publicArenasImages.privateArena)}
        >
          <div className="public-arenas-private-image" aria-hidden="true" />
          <div className="public-arenas-private-visual" aria-hidden="true">
            <LockKeyhole />
          </div>
          <div className="public-arenas-private-copy">
            <p className="public-arenas-kicker">Arene private</p>
            <h2 id="public-arenas-private-title">
              Solo chi inviti tu.
              <span>Nessuno estraneo.</span>
            </h2>
            <p>Le arene sono 100% private. Solo le persone che inviti possono partecipare.</p>
            <ul className="public-arenas-private-points">
              {arenaPrivatePoints.map((point, index) => {
                const Icon = privatePointIcons[index] ?? ShieldCheck;

                return (
                  <li key={point}>
                    <Icon aria-hidden="true" />
                    <span>{point}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section
          aria-labelledby="public-arenas-final-title"
          className="public-arenas-section public-arenas-final"
          data-image-slot="public-arenas.finalCta"
          style={getPublicHomeImageStyle("public-arenas-final", publicArenasImages.finalCta)}
        >
          <div className="public-arenas-final-image" aria-hidden="true" />
          <div className="public-arenas-final-copy">
            <Crown aria-hidden="true" />
            <h2 id="public-arenas-final-title">
              La tua Arena.
              <span>La tua leggenda.</span>
            </h2>
            <p>Crea ora la tua arena e inizia la sfida. La gloria aspetta solo te.</p>
          </div>
          <ButtonLink className="public-arenas-final-button" href="/register">
            Crea la tua Arena
            <ArrowRight aria-hidden="true" className="public-home-button-icon" />
          </ButtonLink>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
