import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { publicHomeImages } from "@/content/home";
import { getPublicHomeImageStyle } from "@/components/home/imageSlotStyle";

export function HeroSection() {
  return (
    <section
      aria-labelledby="public-home-hero-title"
      className="public-home-hero"
      data-image-slot="public-home.hero"
      style={getPublicHomeImageStyle("public-home-hero", publicHomeImages.hero)}
    >
      <div className="public-home-hero-image" aria-hidden="true" />
      <div className="public-home-hero-inner">
        <div className="public-home-hero-copy">
          <h1 id="public-home-hero-title">
            Solo uno
            <span>Sopravvive</span>
          </h1>
          <p>Crea la tua arena privata e sfida i tuoi amici. Solo il migliore vincera.</p>
          <div className="public-home-hero-actions">
            <ButtonLink className="public-home-cta" href="/register">
              Crea la tua Arena
              <ArrowRight aria-hidden="true" className="public-home-button-icon" />
            </ButtonLink>
            <ButtonLink className="public-home-cta" href="/come-funziona" variant="secondary">
              Scopri come funziona
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
