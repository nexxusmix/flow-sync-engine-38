import { useState } from "react";
import { useTaskAutomationRules, TRIGGER_TYPES, ACTION_TYPES, TaskAutomationRule } from "@/hooks/useTaskAutomationRules";
import { TASK_COLUMNS } from "@/hooks/useTasksUnified";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Zap, Plus, Trash2, Loader2, Sparkles, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIButton } from "@/components/squad-ui/AIButton";
import { toast } from "sonner";

interface TaskAutomationManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskAutomationManager({ open, onOpenChange }: TaskAutomationManagerProps) {
  const { rules, isLoading, createRule, deleteRule, toggleRule, generateAutomationsAI } = useTaskAutomationRules();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('on_status_change');
  const [conditionFrom, setConditionFrom] = useState('any');
  const [conditionTo, setConditionTo] = useState('done');
  const [actionType, setActionType] = useState('move_to_status');
  const [actionParam, setActionParam] = useState('done');

  // AI states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await createRule({
        name,
        trigger_type: triggerType,
        condition_json: { from_status: conditionFrom, to_status: conditionTo },
        action_json: { type: actionType, value: actionParam },
        enabled: true,
      });
      setName('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    try {
      await generateAutomationsAI(aiPrompt);
      setAiPrompt('');
    } catch (e) {
      toast.error('Erro ao gerar automações com IA');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAnalyzeTasks = async () => {
    setIsAnalyzing(true);
    try {
      await generateAutomationsAI();
    } catch (e) {
      toast.error('Erro ao analisar tarefas');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const priorities = [
    { key: 'urgent', label: 'Urgente' },
    { key: 'high', label: 'Alta' },
    { key: 'normal', label: 'Normal' },
    { key: 'low', label: 'Baixa' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-primary" />
            Automações de Tarefas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* AI Generation Section */}
          <div className="border border-primary/20 rounded-lg p-3 space-y-3 bg-primary/5">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Gerar com IA
            </p>
            <div className="flex gap-2">
              <Input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Ex: automações para gestão de prazos..."
                className="h-8 text-xs flex-1"
                onKeyDown={e => e.key === 'Enter' && handleGenerateAI()}
                disabled={isGeneratingAI}
              />
              <AIButton
                size="sm"
                onClick={handleGenerateAI}
                isLoading={isGeneratingAI}
                label="Gerar"
                loadingLabel="Gerando..."
                disabled={!aiPrompt.trim() || isGeneratingAI}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyzeTasks}
              disabled={isAnalyzing}
              className="w-full h-8 text-xs"
            >
              {isAnalyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Brain className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isAnalyzing ? 'Analisando tarefas...' : 'Analisar minhas tarefas'}
            </Button>
          </div>

          {/* Existing rules */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhuma automação configurada
            </p>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <RuleCard key={rule.id} rule={rule} onToggle={toggleRule} onDelete={deleteRule} />
              ))}
            </div>
          )}

          {/* Create new rule (manual) */}
          <details className="border border-border/50 rounded-lg">
            <summary className="p-3 text-xs font-medium text-foreground flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Nova Regra Manual
            </summary>
            <div className="p-3 pt-0 space-y-3">
              <div>
                <Label className="text-mono">Nome</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Mover concluídas para arquivo"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-mono">Gatilho</Label>
                  <Select value={triggerType} onValueChange={setTriggerType}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map(t => (
                        <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-mono">Ação</Label>
                  <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map(a => (
                        <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {triggerType === 'on_status_change' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-mono">De</Label>
                    <Select value={conditionFrom} onValueChange={setConditionFrom}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Qualquer</SelectItem>
                        {TASK_COLUMNS.map(c => (
                          <SelectItem key={c.key} value={c.key}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-mono">Para</Label>
                    <Select value={conditionTo} onValueChange={setConditionTo}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Qualquer</SelectItem>
                        {TASK_COLUMNS.map(c => (
                          <SelectItem key={c.key} value={c.key}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-mono">
                  {actionType === 'move_to_status' ? 'Status destino' : actionType === 'set_priority' ? 'Prioridade' : 'Tag'}
                </Label>
                {actionType === 'move_to_status' ? (
                  <Select value={actionParam} onValueChange={setActionParam}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_COLUMNS.map(c => (
                        <SelectItem key={c.key} value={c.key}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : actionType === 'set_priority' ? (
                  <Select value={actionParam} onValueChange={setActionParam}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {priorities.map(p => (
                        <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={actionParam}
                    onChange={e => setActionParam(e.target.value)}
                    placeholder="Nome da tag"
                    className="h-8 text-xs"
                  />
                )}
              </div>

              <Button size="sm" onClick={handleCreate} disabled={!name.trim() || isCreating} className="w-full h-8 text-xs">
                {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                Criar Regra
              </Button>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RuleCard({ rule, onToggle, onDelete }: {
  rule: TaskAutomationRule;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const trigger = TRIGGER_TYPES.find(t => t.key === rule.trigger_type);
  const action = ACTION_TYPES.find(a => a.key === rule.action_json?.type);

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
      rule.enabled ? "border-border/50 bg-card/30" : "border-border/20 bg-muted/10 opacity-60"
    )}>
      <Switch
        checked={rule.enabled}
        onCheckedChange={(v) => onToggle(rule.id, v)}
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{rule.name}</p>
        <p className="text-mono text-muted-foreground mt-0.5">
          {trigger?.label || rule.trigger_type} → {action?.label || rule.action_json?.type}: {rule.action_json?.value}
        </p>
      </div>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive flex-shrink-0" onClick={() => onDelete(rule.id)}>
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}
