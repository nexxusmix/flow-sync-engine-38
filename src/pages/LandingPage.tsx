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
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden overflow-y-auto">
      <ParticlesBackground />
      <AnimatedGradientOrbs />
      <CyberpunkGrid />
      <div className="grain" />

      <LandingNav />
      <LandingHero />
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
