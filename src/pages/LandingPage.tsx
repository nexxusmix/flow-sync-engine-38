import { useEffect } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingModules } from "@/components/landing/LandingModules";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingAI } from "@/components/landing/LandingAI";
import { LandingClientExperience } from "@/components/landing/LandingClientExperience";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingComparison } from "@/components/landing/LandingComparison";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { ScrollVelocityText } from "@/components/landing/effects";

export default function LandingPage() {
  // Unlock native document scroll for the landing page.
  // The app sets overflow:hidden + height:100vh on html/body for dashboard views;
  // we temporarily revert that so the page scrolls naturally.
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
    <div className="bg-background relative min-h-screen">
      <LandingNav />
      <LandingHero />
      <ScrollVelocityText text="CRM · PROJETOS · FINANCEIRO · PORTAL · IA · AUTOMAÇÃO" />
      <LandingModules />
      <LandingBenefits />
      <LandingAI />
      <LandingClientExperience />
      <LandingComparison />
      <LandingHowItWorks />
      <LandingPricing />
      <LandingFAQ />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
