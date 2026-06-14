import { Button } from "@/components/ui/Button";
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
          <Button className="hero-action-button">ENTRA NELL&apos;ARENA</Button>
          <Button className="hero-action-button" variant="secondary">
            SCOPRI COME FUNZIONA
          </Button>
        </div>
      </div>
    </section>
  );
}
