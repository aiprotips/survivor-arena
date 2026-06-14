import { CompetitionSection } from "@/components/home/CompetitionSection";
import { Hero } from "@/components/home/Hero";
import { StatsSection } from "@/components/home/StatsSection";
import { TournamentsSection } from "@/components/home/TournamentsSection";

export default function Home() {
  return (
    <main className="home-page">
      <Hero />
      <StatsSection />
      <TournamentsSection />
      <CompetitionSection />
    </main>
  );
}
