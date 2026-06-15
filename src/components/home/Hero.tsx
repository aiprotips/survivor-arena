import { ButtonLink } from "@/components/ui/Button";
import { heroImages } from "@/content/home";

export function Hero() {
  return (
    <section className="hero-shell">
      <div className="hero-panel">
        <picture className="hero-media">
          <source media="(min-width: 48rem)" srcSet={heroImages.desktop} />
          <img
            alt="Survivor Arena. Una sola scelta. Un solo vincitore."
            className="hero-image"
            decoding="async"
            fetchPriority="high"
            src={heroImages.mobile}
          />
        </picture>
        <div className="hero-actions">
          <ButtonLink className="hero-action-button" href="/login">
            ENTRA NELL&apos;ARENA
          </ButtonLink>
          <ButtonLink className="hero-action-button" href="/come-funziona" variant="secondary">
            SCOPRI COME FUNZIONA
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
