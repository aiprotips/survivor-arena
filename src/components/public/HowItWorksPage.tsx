import {
  ArrowRight,
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
import { ChoiceSimulator } from "@/components/public/ChoiceSimulator";
import { ButtonLink } from "@/components/ui/Button";
import { PremiumDivider } from "@/components/ui/PremiumDivider";

const steps = [
  {
    copy: "Entri in una competizione, ricevi le vite previste e ti prepari al primo round.",
    icon: Trophy,
    title: "Entra nell'Arena",
  },
  {
    copy: "Ogni vita richiede una scelta. Una squadra, una deadline, zero ripensamenti dopo il blocco.",
    icon: Swords,
    title: "Fai la scelta",
  },
  {
    copy: "Chi supera il round resta in corsa. Chi sbaglia perde una vita e sente il peso dell'Arena.",
    icon: ShieldCheck,
    title: "Sopravvivi",
  },
] as const;

const highlights = [
  {
    icon: Heart,
    text: "Ogni vita ha il suo percorso. Puoi rischiare in modo diverso, vita dopo vita.",
    title: "Vite indipendenti",
  },
  {
    icon: LockKeyhole,
    text: "Quando il tempo finisce, l'Arena chiude. Da lì in poi conta solo il risultato.",
    title: "Deadline che pesa",
  },
  {
    icon: Crown,
    text: "Niente spiegoni infiniti: solo pressione, prestigio e la voglia di restare l'ultimo in piedi.",
    title: "Gloria eterna",
  },
] as const;

export function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main className="how-page">
        <section className="arena-shell how-hero" aria-labelledby="how-title">
          <div className="how-hero-copy">
            <p className="user-page-kicker">Survivor Arena in 60 secondi</p>
            <h1 aria-label="Scegli. Resisti. Entra nella leggenda." id="how-title">
              Scegli.
              <span>Resisti.</span>
              <strong>Entra nella leggenda.</strong>
            </h1>
            <p>
              Ogni round ti mette davanti a una scelta secca. Una vita, una squadra,
              una deadline. Sembra facile, finché l&apos;Arena non inizia a eliminare.
            </p>
            <div className="how-hero-actions">
              <ButtonLink href="/login">Entra nell&apos;Arena</ButtonLink>
              <ButtonLink href="#simulazione" variant="secondary">
                Prova una scelta
              </ButtonLink>
            </div>
          </div>

          <ChoiceSimulator />
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
            <span>Obiettivo</span>
            <strong>gloria eterna</strong>
          </article>
        </section>

        <section className="arena-shell how-section" id="simulazione">
          <div className="how-section-heading">
            <p className="user-page-kicker">La magia è tutta qui</p>
            <h2>Capisci il gioco mentre scegli.</h2>
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
                  <HowStepIllustration index={index} />
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
              <p className="user-page-kicker">Il momento della verità</p>
              <h2 id="demo-title">Quando il round si chiude, l&apos;Arena decide.</h2>
              <p>
                Le scelte vengono bloccate, il risultato arriva, e ogni vita prende
                la sua strada: sopravvive o sparisce dalla corsa.
              </p>
            </div>

            <div className="how-round-preview" aria-label="Esempio round">
              <div className="how-round-header">
                <span>Round 1</span>
                <strong>Scelte chiuse</strong>
              </div>
              <RoundRow label="Vita 1" result="Sopravvive" team="Juve" tone="success" />
              <RoundRow label="Vita 2" result="Eliminata" team="Inter" tone="danger" />
              <RoundRow label="Vita 3" result="In attesa" team="Da giocare" tone="neutral" />
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
            <p className="user-page-kicker">La scelta è tua</p>
            <h2>Non devi leggere un manuale. Devi solo avere coraggio.</h2>
            <p>Entra nell&apos;Arena, fai la tua prima scelta e prova a restare in piedi più degli altri.</p>
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

function HowStepIllustration({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="how-step-visual how-entry-visual" aria-hidden="true">
        <span className="how-mini-arena-ring" />
        <div className="how-mini-trophy">
          <Crown />
          <Trophy />
        </div>
        <p>Ingresso Arena</p>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="how-step-visual how-choice-visual" aria-hidden="true">
        <span>Vita 1</span>
        <div className="how-mini-match">
          <strong>Juve</strong>
          <em>VS</em>
          <strong>Inter</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="how-step-visual how-survive-visual" aria-hidden="true">
      <span><Heart /> Vita salva</span>
      <span><Crown /> Sei ancora dentro</span>
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
  tone: "danger" | "neutral" | "success";
}) {
  return (
    <article className="how-round-row">
      <span>{label}</span>
      <strong>{team}</strong>
      <em className={`how-round-${tone}`}>{result}</em>
    </article>
  );
}
