import { Card } from "@/components/ui/Card";

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="group grid min-h-48 content-between p-[var(--card-padding)] transition duration-200 hover:-translate-y-1 hover:shadow-arena-glow">
      <div className="flex size-14 items-center justify-center rounded-arena bg-arena-background text-3xl shadow-inner">
        <span aria-hidden="true">{icon}</span>
      </div>
      <div className="mt-8 space-y-3">
        <h3 className="text-2xl font-black text-arena-white">{title}</h3>
        <p className="max-w-72 text-base leading-7 text-arena-muted">{description}</p>
      </div>
    </Card>
  );
}
