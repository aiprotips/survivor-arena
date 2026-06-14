import { CompetitionSection } from "@/components/home/CompetitionSection";
import { Hero } from "@/components/home/Hero";
import { StatsSection } from "@/components/home/StatsSection";
import { TournamentsSection } from "@/components/home/TournamentsSection";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="home-page">
        <Hero />
        <StatsSection />
        <TournamentsSection />
        <CompetitionSection />
      </main>
    </>
  );
}
