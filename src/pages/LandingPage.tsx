import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProblem } from "@/components/landing/LandingProblem";
import { LandingSolution } from "@/components/landing/LandingSolution";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingDifferentials } from "@/components/landing/LandingDifferentials";
import { LandingPriceJustification } from "@/components/landing/LandingPriceJustification";
import { LandingAudience } from "@/components/landing/LandingAudience";
import { LandingProof } from "@/components/landing/LandingProof";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingGuarantee } from "@/components/landing/LandingGuarantee";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="landing-scroll bg-background relative">
      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/4 blur-[200px]" />
      </div>
      <div className="grain" />

      <LandingNav />
      <LandingHero />
      <LandingProblem />
      <LandingSolution />
      <LandingDifferentials />
      <LandingPricing />
      <LandingPriceJustification />
      <LandingAudience />
      <LandingProof />
      <LandingFAQ />
      <LandingGuarantee />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
