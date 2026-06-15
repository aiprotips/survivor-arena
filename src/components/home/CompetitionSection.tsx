import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function CompetitionSection() {
  return (
    <section className="arena-shell pb-arena-section">
      <Card className="grid overflow-hidden p-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid content-center gap-6 p-4 sm:p-8">
          <Badge tone="gold">La competizione definitiva</Badge>
          <div>
            <h2 className="text-4xl font-black leading-tight text-arena-white sm:text-5xl">
              SOLO UNO
              <span className="block text-arena-blue-soft">SOPRAVVIVE</span>
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-arena-muted">
              Ogni arena premia lucidità, tempismo e sangue freddo. Turno dopo turno,
              resta in gara chi sa scegliere meglio degli altri.
            </p>
          </div>
          <ButtonLink className="w-full sm:w-fit" href="/login" variant="gold">
            ENTRA NELL&apos;ARENA
          </ButtonLink>
        </div>
        <div className="premium-image-frame relative min-h-80">
          <Image
            alt="Trofeo dorato in uno stadio premium"
            className="absolute inset-0 size-full object-cover"
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 50vw, 100vw"
            src="/assets/gold-trophy-arena.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-arena-card via-transparent to-transparent" />
        </div>
      </Card>
    </section>
  );
}
