import { useRef } from "react";
import {
  ParticlesBackground,
  AnimatedGradientOrbs,
  CyberpunkGrid,
} from "@/components/landing";
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
  return (
    <div ref={scrollContainerRef} className="h-screen overflow-y-auto bg-background relative overflow-x-hidden">
      <ParticlesBackground />
      <AnimatedGradientOrbs />
      <CyberpunkGrid />
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
