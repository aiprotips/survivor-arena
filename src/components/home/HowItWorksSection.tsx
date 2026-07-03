import { Crown, Trophy, UsersRound } from "lucide-react";
import { howItWorksSteps } from "@/content/home";

const stepIcons = {
  crown: Crown,
  trophy: Trophy,
  users: UsersRound,
} as const;

export function HowItWorksSection() {
  return (
    <section className="public-home-section public-home-steps" aria-labelledby="public-home-steps-title">
      <h2 id="public-home-steps-title">
        3 step. Una sola <span>corona.</span>
      </h2>
      <div className="public-home-step-grid">
        {howItWorksSteps.map((step) => {
          const Icon = stepIcons[step.icon];

          return (
            <article className="public-home-step-card" key={step.title}>
              <span className="public-home-step-icon" aria-hidden="true">
                <Icon />
              </span>
              <div>
                <span className="public-home-step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
