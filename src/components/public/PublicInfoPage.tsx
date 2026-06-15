import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumDivider } from "@/components/ui/PremiumDivider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import type { PublicInfoPageContent } from "@/content/public-pages";

export function PublicInfoPage({ content }: { content: PublicInfoPageContent }) {
  return (
    <>
      <SiteHeader />
      <main className="public-page">
        <section className="arena-shell public-hero">
          <p className="user-page-kicker">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
          <PremiumDivider />
          {content.ctaHref && content.ctaLabel ? (
            <ButtonLink className="public-page-cta" href={content.ctaHref}>
              {content.ctaLabel}
            </ButtonLink>
          ) : null}
        </section>

        <section className="arena-shell public-card-grid" aria-label={content.title}>
          {content.cards.map((card) => {
            const Icon = card.icon;

            return (
              <Card className="public-info-card" key={card.title}>
                <span className="public-card-icon">
                  <Icon aria-hidden="true" />
                </span>
                <h2>{card.title}</h2>
                <p>{card.text}</p>
              </Card>
            );
          })}
        </section>
      </main>
    </>
  );
}
