/**
 * AI Governance Dashboard - Central de monitoramento, auditoria e governança de IA
 */

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { subDays } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIExecutiveView } from "@/components/ai-governance/AIExecutiveView";
import { AIModulesView } from "@/components/ai-governance/AIModulesView";
import { AIAuditView } from "@/components/ai-governance/AIAuditView";
import { AICostsView } from "@/components/ai-governance/AICostsView";
import { AIGovernanceView } from "@/components/ai-governance/AIGovernanceView";
import { useAIGovernance } from "@/hooks/useAIGovernance";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function AIGovernanceDashboardPage() {
  const [period, setPeriod] = useState("30");
  const dateRange = {
    from: subDays(new Date(), parseInt(period)),
    to: new Date(),
  };

  const governance = useAIGovernance(dateRange);

  return (
    <DashboardLayout title="IA & Governança">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard de IA & Governança</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitore uso, custos, auditoria e políticas de IA da plataforma
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="executive" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="executive">Resumo Executivo</TabsTrigger>
            <TabsTrigger value="modules">Por Módulo</TabsTrigger>
            <TabsTrigger value="costs">Custos & Limites</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
            <TabsTrigger value="governance">Governança</TabsTrigger>
          </TabsList>

          <TabsContent value="executive">
            <AIExecutiveView governance={governance} />
          </TabsContent>
          <TabsContent value="modules">
            <AIModulesView governance={governance} />
          </TabsContent>
          <TabsContent value="costs">
            <AICostsView governance={governance} />
          </TabsContent>
          <TabsContent value="audit">
            <AIAuditView governance={governance} />
          </TabsContent>
          <TabsContent value="governance">
            <AIGovernanceView governance={governance} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
