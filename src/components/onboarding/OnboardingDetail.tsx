import { useState } from "react";
import { useOnboardingDetail } from "@/hooks/useClientOnboarding";
import { useClientOnboarding } from "@/hooks/useClientOnboarding";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { OnboardingPhases } from "./OnboardingPhases";
import { OnboardingMaterials } from "./OnboardingMaterials";
import { OnboardingBriefing } from "./OnboardingBriefing";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onboardingId: string;
  onBack: () => void;
}

export function OnboardingDetail({ onboardingId, onBack }: Props) {
  const { onboardings } = useClientOnboarding();
  const { phases, materials, briefing, isLoading, toggleStep, updateMaterialStatus, saveBriefingAnswer } = useOnboardingDetail(onboardingId);
  const [tab, setTab] = useState("phases");

  const ob = onboardings.find((o) => o.id === onboardingId);

  if (isLoading || !ob) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const pendingMaterials = materials.filter((m) => m.status === "pending").length;
  const answeredBriefing = briefing.filter((b) => b.answer).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="mt-1 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">{ob.client_name}</h2>
            <span className={cn(
              "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full",
              ob.status === "completed" ? "text-emerald-600 bg-emerald-500/10" : "text-primary bg-primary/10"
            )}>
              {ob.status === "completed" ? "Concluído" : "Em andamento"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={ob.progress} className="h-2 flex-1 max-w-md" />
            <span className="text-sm font-medium text-foreground">{ob.progress}%</span>
          </div>
          {/* Summary cards */}
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="material-symbols-rounded text-sm">checklist</span>
              {phases.length} fases
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="material-symbols-rounded text-sm">attach_file</span>
              {pendingMaterials > 0 ? <span className="text-amber-600">{pendingMaterials} pendentes</span> : "Materiais OK"}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="material-symbols-rounded text-sm">quiz</span>
              Briefing {answeredBriefing}/{briefing.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="phases">Fases & Etapas</TabsTrigger>
          <TabsTrigger value="briefing">Briefing</TabsTrigger>
          <TabsTrigger value="materials">Materiais & Acessos</TabsTrigger>
        </TabsList>

        <TabsContent value="phases">
          <OnboardingPhases phases={phases} onToggleStep={(stepId, completed) => toggleStep.mutate({ stepId, completed })} />
        </TabsContent>

        <TabsContent value="briefing">
          <OnboardingBriefing answers={briefing} onSave={(id, answer) => saveBriefingAnswer.mutate({ id, answer })} />
        </TabsContent>

        <TabsContent value="materials">
          <OnboardingMaterials materials={materials} onUpdateStatus={(id, status) => updateMaterialStatus.mutate({ id, status })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
