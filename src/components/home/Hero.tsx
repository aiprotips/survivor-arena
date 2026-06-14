import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="hero-shell">
      <div className="hero-panel">
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
