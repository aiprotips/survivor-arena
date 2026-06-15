import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Crown,
  Heart,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ButtonLink } from "@/components/ui/Button";
import { PremiumDivider } from "@/components/ui/PremiumDivider";

const steps = [
  {
    copy: "Scegli un'Arena, usi le Coppe e ricevi le vite incluse per iniziare la sfida.",
    icon: Trophy,
    title: "Entra",
    visual: "entry",
  },
  {
    copy: "Per ogni vita selezioni una squadra disponibile prima della deadline.",
    icon: Swords,
    title: "Scegli",
    visual: "choice",
  },
  {
    copy: "Se la tua scelta vince, quella vita continua. Se sbagli, viene eliminata.",
    icon: ShieldCheck,
    title: "Sopravvivi",
    visual: "survive",
  },
] as const;

const highlights = [
  {
    icon: Heart,
    text: "Ogni vita ha uno storico indipendente: una scelta sbagliata elimina solo quella vita.",
    title: "Vite indipendenti",
  },
  {
    icon: LockKeyhole,
    text: "Dopo la deadline le scelte si bloccano e diventano consultabili per trasparenza.",
    title: "Deadline chiare",
  },
  {
    icon: Crown,
    text: "Round dopo round resta in gioco chi ha scelto meglio. Alla fine vince l'ultimo sopravvissuto.",
    title: "Finale competitivo",
  },
] as const;

export function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="how-page">
        <section className="arena-shell how-hero" aria-labelledby="how-title">
          <div className="how-hero-copy">
            <p className="user-page-kicker">Come funziona</p>
            <h1 id="how-title">
              Una scelta.
              <span>Una vita.</span>
              <strong>Un solo vincitore.</strong>
            </h1>
            <p>
              Survivor Arena è semplice da capire e difficile da dominare:
              entri in un&apos;Arena, fai le tue scelte e provi a restare in gioco
              più a lungo di tutti.
            </p>
            <div className="how-hero-actions">
              <ButtonLink href="/login">Entra nell&apos;Arena</ButtonLink>
              <ButtonLink href="#passaggi" variant="secondary">
                Guarda i passaggi
              </ButtonLink>
            </div>
          </div>

          <div className="how-arena-visual" aria-hidden="true">
            <div className="how-arena-lights" />
            <div className="how-trophy-mark">
              <Crown />
              <Trophy />
            </div>
            <div className="how-choice-board">
              <div className="how-choice-topline">
                <span>Round 1</span>
                <span>02:14:32</span>
              </div>
              <div className="how-life-row">
                <span><Heart /> Vita 1</span>
                <strong>Inter</strong>
              </div>
              <div className="how-life-row how-life-row-active">
                <span><Heart /> Vita 2</span>
                <strong>Napoli</strong>
              </div>
              <div className="how-life-row">
                <span><Heart /> Vita 3</span>
                <strong>Da scegliere</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="arena-shell how-quick-strip" aria-label="Punti chiave">
          <article>
            <Users aria-hidden="true" />
            <span>Entrano tutti</span>
            <strong>vince chi resiste</strong>
          </article>
          <article>
            <Clock3 aria-hidden="true" />
            <span>Scelte entro</span>
            <strong>la deadline</strong>
          </article>
          <article>
            <Sparkles aria-hidden="true" />
            <span>In palio</span>
            <strong>solo Coppe</strong>
          </article>
        </section>

        <section className="arena-shell how-section" id="passaggi">
          <div className="how-section-heading">
            <p className="user-page-kicker">Il gioco in 30 secondi</p>
            <h2>Tre mosse, poi parla l&apos;Arena.</h2>
            <PremiumDivider />
          </div>

          <div className="how-step-grid">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article className="how-step-card" key={step.title}>
                  <div className="how-step-head">
                    <span className="how-step-number">0{index + 1}</span>
                    <span className="how-step-icon">
                      <Icon aria-hidden="true" />
                    </span>
                  </div>
                  <HowStepVisual type={step.visual} />
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="arena-shell how-demo-section" aria-labelledby="demo-title">
          <div className="how-demo-card">
            <div className="how-demo-copy">
              <p className="user-page-kicker">Esempio rapido</p>
              <h2 id="demo-title">Guardi il round e capisci subito dove sei.</h2>
              <p>
                Ogni vita mostra la squadra scelta e il risultato. Niente caos,
                solo quello che conta: chi resta dentro e chi esce.
              </p>
            </div>

            <div className="how-round-preview" aria-label="Esempio round">
              <div className="how-round-header">
                <span>Round 1</span>
                <strong>Scelte chiuse</strong>
              </div>
              <RoundRow label="Vita 1" result="Sopravvissuta" team="Juventus" tone="success" />
              <RoundRow label="Vita 2" result="Eliminata" team="Inter" tone="danger" />
              <RoundRow label="Vita 3" result="Sopravvissuta" team="Napoli" tone="success" />
            </div>
          </div>
        </section>

        <section className="arena-shell how-highlight-section" aria-labelledby="why-title">
          <div className="how-section-heading">
            <p className="user-page-kicker">Perché prende subito</p>
            <h2 id="why-title">Poche regole, tanta tensione.</h2>
          </div>

          <div className="how-highlight-grid">
            {highlights.map((highlight) => {
              const Icon = highlight.icon;

              return (
                <article className="how-highlight-card" key={highlight.title}>
                  <span>
                    <Icon aria-hidden="true" />
                  </span>
                  <h3>{highlight.title}</h3>
                  <p>{highlight.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="arena-shell how-final-cta" aria-label="Entra nell'Arena">
          <div>
            <p className="user-page-kicker">Pronto a provarci?</p>
            <h2>Entra, scegli, sopravvivi.</h2>
            <p>La prossima Arena può essere quella giusta per iniziare la scalata.</p>
          </div>
          <ButtonLink href="/login">
            Entra nell&apos;Arena
            <ArrowRight aria-hidden="true" />
          </ButtonLink>
        </section>
      </main>
    </>
  );
}

function HowStepVisual({ type }: { type: (typeof steps)[number]["visual"] }) {
  if (type === "entry") {
    return (
      <div className="how-step-visual how-entry-visual" aria-hidden="true">
        <div>
          <Trophy />
          <span>Arena Champions</span>
        </div>
        <strong>100 Coppe</strong>
        <p>3 vite incluse</p>
      </div>
    );
  }

  if (type === "choice") {
    return (
      <div className="how-step-visual how-choice-visual" aria-hidden="true">
        <span>Vita 1</span>
        <div>
          <span>JUV</span>
          <span className="is-selected">NAP</span>
        </div>
      </div>
    );
  }

  return (
    <div className="how-step-visual how-survive-visual" aria-hidden="true">
      <span><CheckCircle2 /> Sopravvissuta</span>
      <span><Heart /> Vita attiva</span>
    </div>
  );
}

function RoundRow({
  label,
  result,
  team,
  tone,
}: {
  label: string;
  result: string;
  team: string;
  tone: "danger" | "success";
}) {
  return (
    <article className="how-round-row">
      <span>{label}</span>
      <strong>{team}</strong>
      <em className={`how-round-${tone}`}>{result}</em>
    </article>
  );
}
