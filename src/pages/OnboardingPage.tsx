import { useState } from "react";
import { AppLayoutStandard } from "@/components/layout/AppLayoutStandard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OnboardingList } from "@/components/onboarding/OnboardingList";
import { OnboardingDetail } from "@/components/onboarding/OnboardingDetail";
import { OnboardingCreateDialog } from "@/components/onboarding/OnboardingCreateDialog";

export default function OnboardingPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState("onboardings");

  return (
    <AppLayoutStandard>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Onboarding de Clientes</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie a entrada de novos clientes com fluxos estruturados</p>
          </div>
          <OnboardingCreateDialog />
        </div>

        {selectedId ? (
          <OnboardingDetail onboardingId={selectedId} onBack={() => setSelectedId(null)} />
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="onboardings">Onboardings</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="onboardings">
              <OnboardingList onSelect={setSelectedId} />
            </TabsContent>
            <TabsContent value="templates">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {[
                  { key: "social_media", label: "Social Media", desc: "Onboarding completo para gestão de redes sociais", phases: 6 },
                  { key: "trafego_pago", label: "Tráfego Pago", desc: "Setup de campanhas e tracking", phases: 5 },
                  { key: "general", label: "Geral", desc: "Template genérico para qualquer serviço", phases: 5 },
                ].map((t) => (
                  <div key={t.key} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-primary text-xl">description</span>
                      <h3 className="font-medium text-foreground">{t.label}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{t.phases} fases</span>
                      <span className="inline-flex items-center gap-1 text-primary">
                        <span className="material-symbols-rounded text-sm">check_circle</span>
                        Pronto para uso
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayoutStandard>
  );
}
