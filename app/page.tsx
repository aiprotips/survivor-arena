import { FeatureGrid } from "@/components/home/FeatureGrid";
import { Hero } from "@/components/home/Hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-arena-background text-arena-white">
      <Hero />
      <FeatureGrid />
    </main>
  );
}
