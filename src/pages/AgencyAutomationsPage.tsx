import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, History, Shield, LayoutTemplate } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AutomationsList } from "@/components/automations/AutomationsList";
import { AutomationCreator } from "@/components/automations/AutomationCreator";
import { AutomationExecutionHistory } from "@/components/automations/AutomationExecutionHistory";
import { AutomationApprovalQueue } from "@/components/automations/AutomationApprovalQueue";
import { AutomationTemplatesGallery } from "@/components/automations/AutomationTemplatesGallery";
import { useAutomationApprovals } from "@/hooks/useAutomations";
import { Badge } from "@/components/ui/badge";

type View = "list" | "create" | "edit";

export default function AgencyAutomationsPage() {
  const [view, setView] = useState<View>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState("automations");
  const { data: approvals = [] } = useAutomationApprovals();

  const handleEdit = (id: string) => {
    setEditingId(id);
    setView("edit");
  };

  const handleCreate = () => {
    setEditingId(null);
    setView("create");
  };

  const handleClose = () => {
    setView("list");
    setEditingId(null);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Central de Automações</h1>
              <p className="text-xs text-muted-foreground">Configure, ative e acompanhe automações operacionais da agência</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        {view === "list" ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-card/50 border border-border">
              <TabsTrigger value="automations" className="gap-1.5 text-xs">
                <Zap className="w-3.5 h-3.5" /> Automações
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-1.5 text-xs">
                <LayoutTemplate className="w-3.5 h-3.5" /> Templates
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 text-xs">
                <History className="w-3.5 h-3.5" /> Histórico
              </TabsTrigger>
              <TabsTrigger value="approvals" className="gap-1.5 text-xs">
                <Shield className="w-3.5 h-3.5" /> Aprovações
                {approvals.length > 0 && (
                  <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4">{approvals.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="automations" className="mt-6">
              <AutomationsList onEdit={handleEdit} onCreate={handleCreate} />
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <AutomationTemplatesGallery onCreated={() => setTab("automations")} />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <AutomationExecutionHistory />
            </TabsContent>

            <TabsContent value="approvals" className="mt-6">
              <AutomationApprovalQueue />
            </TabsContent>
          </Tabs>
        ) : (
          <AutomationCreator
            automationId={view === "edit" ? editingId : null}
            onClose={handleClose}
          />
        )}
      </div>
    </AppLayout>
  );
}
