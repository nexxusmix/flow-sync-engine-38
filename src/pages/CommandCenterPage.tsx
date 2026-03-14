import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCommandCenter } from '@/hooks/useCommandCenter';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { CCExecutiveSummary } from '@/components/command-center/CCExecutiveSummary';
import { CCRiskRadar } from '@/components/command-center/CCRiskRadar';
import { CCClientHealth } from '@/components/command-center/CCClientHealth';
import { CCOperations } from '@/components/command-center/CCOperations';
import { CCFinancial } from '@/components/command-center/CCFinancial';
import { CCCommercial } from '@/components/command-center/CCCommercial';
import { CCAIAutomations } from '@/components/command-center/CCAIAutomations';
import { CCCopilot } from '@/components/command-center/CCCopilot';

const tabs = [
  { id: 'resumo', label: 'Resumo', icon: 'space_dashboard' },
  { id: 'riscos', label: 'Riscos', icon: 'warning' },
  { id: 'clientes', label: 'Clientes', icon: 'groups' },
  { id: 'operacao', label: 'Operação', icon: 'precision_manufacturing' },
  { id: 'financeiro', label: 'Financeiro', icon: 'payments' },
  { id: 'comercial', label: 'Comercial', icon: 'handshake' },
  { id: 'ia', label: 'IA & Automações', icon: 'psychology' },
  { id: 'copiloto', label: 'Copiloto', icon: 'smart_toy' },
];

export default function CommandCenterPage() {
  const { metrics, extras, isLoading, isError, refetch, dataUpdatedAt } = useCommandCenter();
  const [activeTab, setActiveTab] = useState('resumo');

  if (isError) {
    return (
      <DashboardLayout title="Command Center">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <AlertTriangle className="w-10 h-10 text-destructive" />
          <p className="text-sm text-muted-foreground">Erro ao carregar dados.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">Tentar novamente</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading || !metrics || !extras) {
    return (
      <DashboardLayout title="Command Center">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Carregando Command Center...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Command Center">
      <motion.div
        className="space-y-6 max-w-[1600px] mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-light uppercase tracking-tighter text-foreground">
              Command <span className="text-primary">Center</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
              Copiloto da Operação
              {dataUpdatedAt > 0 && (
                <span className="ml-3 normal-case tracking-normal opacity-60">
                  Atualizado às {new Date(dataUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            {tabs.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5 text-xs data-[state=active]:bg-background">
                <span className="material-symbols-rounded text-sm" style={{ fontSize: 16 }}>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="resumo">
            <CCExecutiveSummary metrics={metrics} extras={extras} />
          </TabsContent>
          <TabsContent value="riscos">
            <CCRiskRadar metrics={metrics} />
          </TabsContent>
          <TabsContent value="clientes">
            <CCClientHealth clients={extras.clientHealth} />
          </TabsContent>
          <TabsContent value="operacao">
            <CCOperations metrics={metrics} />
          </TabsContent>
          <TabsContent value="financeiro">
            <CCFinancial metrics={metrics} />
          </TabsContent>
          <TabsContent value="comercial">
            <CCCommercial metrics={metrics} />
          </TabsContent>
          <TabsContent value="ia">
            <CCAIAutomations automation={extras.automationStats} ai={extras.aiStats} />
          </TabsContent>
          <TabsContent value="copiloto">
            <CCCopilot metrics={metrics} extras={extras} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}
