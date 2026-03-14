import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Shield, Eye, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAutomationApprovals, useDecideApproval, ACTION_TYPES, type AutomationApproval } from "@/hooks/useAutomations";
import { sc } from "@/lib/colors";

export function AutomationApprovalQueue() {
  const { data: approvals = [], isLoading } = useAutomationApprovals();
  const decideApproval = useDecideApproval();
  const [selectedApproval, setSelectedApproval] = useState<AutomationApproval | null>(null);
  const [note, setNote] = useState("");

  const handleDecision = (decision: "approved" | "rejected") => {
    if (!selectedApproval) return;
    decideApproval.mutate(
      { id: selectedApproval.id, decision, note },
      { onSuccess: () => { setSelectedApproval(null); setNote(""); } }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground text-sm">Carregando aprovações...</div>
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground font-medium">Nenhuma aprovação pendente</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Ações sensíveis aparecerão aqui para sua revisão</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Badge className="bg-primary/15 text-primary border-0">{approvals.length} pendentes</Badge>
      </div>

      {approvals.map((approval) => {
        const actionDef = ACTION_TYPES.find((a) => a.key === approval.action_type);
        return (
          <div key={approval.id} className="glass-card rounded-xl p-4 border-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-rounded text-sm text-primary">{actionDef?.icon || "approval"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {(approval.automation as any)?.name || "Automação"}
                  </h3>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-primary border-primary/30">
                    Etapa {approval.action_step + 1}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {actionDef?.label || approval.action_type} · {format(new Date(approval.created_at), "dd/MM HH:mm", { locale: ptBR })}
                </p>
                {approval.preview_text && (
                  <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{approval.preview_text}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => { setSelectedApproval(approval); setNote(""); }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    setSelectedApproval(approval);
                    setNote("");
                  }}
                >
                  <XCircle className="w-3.5 h-3.5" /> Rejeitar
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    decideApproval.mutate({ id: approval.id, decision: "approved" });
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Detail/Reject Dialog */}
      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Aprovação</DialogTitle>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Automação:</span>
                  <p className="font-medium text-foreground">{(selectedApproval.automation as any)?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ação:</span>
                  <p className="font-medium text-foreground">
                    {ACTION_TYPES.find((a) => a.key === selectedApproval.action_type)?.label}
                  </p>
                </div>
              </div>
              {selectedApproval.preview_text && (
                <div className="glass-card p-3 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase">Preview</span>
                  <p className="text-sm text-foreground mt-1">{selectedApproval.preview_text}</p>
                </div>
              )}
              {selectedApproval.context_data && (
                <div className="glass-card p-3 rounded-lg">
                  <span className="text-[10px] text-muted-foreground uppercase">Contexto</span>
                  <pre className="text-xs text-foreground/70 mt-1 overflow-x-auto">
                    {JSON.stringify(selectedApproval.context_data, null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground">Observação (opcional):</span>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="mt-1" placeholder="Motivo da decisão..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDecision("rejected")} className="gap-1 text-destructive">
              <XCircle className="w-4 h-4" /> Rejeitar
            </Button>
            <Button onClick={() => handleDecision("approved")} className="gap-1">
              <CheckCircle2 className="w-4 h-4" /> Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
