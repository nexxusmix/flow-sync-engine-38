import { useEffect, useRef } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProblem } from "@/components/landing/LandingProblem";
import { LandingTransformation } from "@/components/landing/LandingTransformation";
import { LandingModules } from "@/components/landing/LandingModules";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingAI } from "@/components/landing/LandingAI";
import { LandingClientExperience } from "@/components/landing/LandingClientExperience";
import { LandingDifferentials } from "@/components/landing/LandingDifferentials";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingAudience } from "@/components/landing/LandingAudience";
import { LandingComparison } from "@/components/landing/LandingComparison";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingPriceJustification } from "@/components/landing/LandingPriceJustification";
import { LandingProof } from "@/components/landing/LandingProof";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingGuarantee } from "@/components/landing/LandingGuarantee";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ScrollVelocityText } from "@/components/landing/effects";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  useSmoothScroll(containerRef);

  // Unlock native document scroll for the landing page.
  // The app sets overflow:hidden + height:100vh on html/body for dashboard views;
  // we temporarily revert that so framer-motion useScroll works correctly and
  // the page scrolls naturally.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = "auto";
    html.style.height = "auto";
    html.style.perspective = "none";
    body.style.overflow = "auto";
    body.style.height = "auto";

    return () => {
      html.style.overflow = "";
      html.style.height = "";
      html.style.perspective = "";
      body.style.overflow = "";
      body.style.height = "";
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-background relative min-h-screen">
      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/4 blur-[200px]" />
      </div>
      <div className="grain" />

      <LandingNav />
      <LandingHero />
      <ScrollVelocityText text="CRM · PROJETOS · FINANCEIRO · PORTAL · IA · AUTOMAÇÃO" />
      <LandingProblem />
      <LandingTransformation />
      <LandingModules />
      <LandingBenefits />
      <LandingAI />
      <LandingClientExperience />
      <LandingDifferentials />
      <LandingHowItWorks />
      <LandingAudience />
      <LandingComparison />
      <LandingPricing />
      <LandingPriceJustification />
      <LandingProof />
      <LandingFAQ />
      <LandingGuarantee />
      <ScrollVelocityText text="TRANSFORME SUA OPERAÇÃO · ESCALE COM INTELIGÊNCIA · CONTROLE TOTAL" />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
