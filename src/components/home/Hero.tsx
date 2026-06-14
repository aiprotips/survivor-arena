import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="arena-shell hero-shell">
      <div className="hero-panel">
        <Image
          alt="Survivor Arena"
          className="hero-image"
          fetchPriority="high"
          fill
          priority
          sizes="100vw"
          src="/assets/survivor-arena-hero.jpg"
        />

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
