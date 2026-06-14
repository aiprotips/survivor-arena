import { FeatureCard } from "@/components/home/FeatureCard";
import { homeFeatures } from "@/content/home";

export function FeatureGrid() {
  return (
    <section className="arena-shell pb-arena-section">
      <div className="grid gap-4 sm:grid-cols-3">
        {homeFeatures.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
