import { FinalCTASection } from "@/components/home/FinalCTASection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { PrivateArenaSection } from "@/components/home/PrivateArenaSection";
import { PublicFooter } from "@/components/home/PublicFooter";
import { StatsSection } from "@/components/home/StatsSection";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="home-page">
        <HeroSection />
        <HowItWorksSection />
        <PrivateArenaSection />
        <StatsSection />
        <FinalCTASection />
      </main>
      <PublicFooter />
    </>
  );
}
