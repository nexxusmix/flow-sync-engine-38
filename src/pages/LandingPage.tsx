import { useRef } from "react";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProblem } from "@/components/landing/LandingProblem";
import { LandingSolution } from "@/components/landing/LandingSolution";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingDifferentials } from "@/components/landing/LandingDifferentials";
import { LandingPriceJustification } from "@/components/landing/LandingPriceJustification";
import { LandingAudience } from "@/components/landing/LandingAudience";
import { LandingProof } from "@/components/landing/LandingProof";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useSmoothScroll(scrollContainerRef);

  return (
    <div ref={scrollContainerRef} className="h-screen overflow-y-auto bg-background relative overflow-x-hidden">
      {/* Ambient glow — single subtle orb replacing particles/grid/orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[200px]" />
      </div>
      <div className="grain" />

      <LandingNav />
      <LandingHero scrollContainerRef={scrollContainerRef} />
      <LandingProblem />
      <LandingSolution />
      <LandingPricing />
      <LandingDifferentials />
      <LandingPriceJustification />
      <LandingAudience />
      <LandingProof />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
