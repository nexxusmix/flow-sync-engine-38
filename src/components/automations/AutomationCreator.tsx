import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, GripVertical, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSaveAutomation,
  useAutomationActions,
  TRIGGER_TYPES,
  ACTION_TYPES,
  MODULE_OPTIONS,
  type Automation,
  type AutomationModule,
} from "@/hooks/useAutomations";
import { supabase } from "@/integrations/supabase/client";
import { sc } from "@/lib/colors";

interface Props {
  automationId?: string | null;
  onClose: () => void;
}

const STEPS = [
  { key: "info", label: "Informações" },
  { key: "trigger", label: "Gatilho" },
  { key: "conditions", label: "Condições" },
  { key: "actions", label: "Ações" },
  { key: "approval", label: "Aprovação" },
  { key: "review", label: "Revisão" },
];

interface ActionItem {
  action_type: string;
  action_label: string;
  step_order: number;
  require_approval: boolean;
  action_config: Record<string, any>;
}

interface ConditionItem {
  field: string;
  operator: string;
  value: string;
}

export function AutomationCreator({ automationId, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState<AutomationModule>("projects");
  const [triggerType, setTriggerType] = useState("");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
  const [conditions, setConditions] = useState<ConditionItem[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [requireApproval, setRequireApproval] = useState(false);
  const [retryEnabled, setRetryEnabled] = useState(false);
  const [maxRetries, setMaxRetries] = useState(3);
  const [status, setStatus] = useState<string>("draft");

  const saveAutomation = useSaveAutomation();
  const { data: existingActions } = useAutomationActions(automationId || null);

  // Load existing data
  useEffect(() => {
    if (!automationId) return;
    (async () => {
      const { data } = await supabase
        .from("automations")
        .select("*")
        .eq("id", automationId)
        .single();
      if (!data) return;
      const a = data as any;
      setName(a.name);
      setDescription(a.description || "");
      setModule(a.module);
      setTriggerType(a.trigger_type);
      setTriggerConfig(a.trigger_config || {});
      setConditions(a.conditions || []);
      setRequireApproval(a.require_approval);
      setRetryEnabled(a.retry_enabled);
      setMaxRetries(a.max_retries);
      setStatus(a.status);
    })();
  }, [automationId]);

  useEffect(() => {
    if (existingActions) {
      setActions(existingActions.map((a) => ({
        action_type: a.action_type,
        action_label: a.action_label || "",
        step_order: a.step_order,
        require_approval: a.require_approval,
        action_config: a.action_config,
      })));
    }
  }, [existingActions]);

  const addAction = (type: string) => {
    const def = ACTION_TYPES.find((a) => a.key === type);
    setActions([...actions, {
      action_type: type,
      action_label: def?.label || type,
      step_order: actions.length,
      require_approval: def?.sensitive || false,
      action_config: {},
    }]);
  };

  const removeAction = (idx: number) => {
    setActions(actions.filter((_, i) => i !== idx).map((a, i) => ({ ...a, step_order: i })));
  };

  const addCondition = () => {
    setConditions([...conditions, { field: "", operator: "equals", value: "" }]);
  };

  const updateCondition = (idx: number, updates: Partial<ConditionItem>) => {
    setConditions(conditions.map((c, i) => i === idx ? { ...c, ...updates } : c));
  };

  const removeCondition = (idx: number) => {
    setConditions(conditions.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    saveAutomation.mutate({
      automation: {
        ...(automationId ? { id: automationId } : {}),
        name,
        description: description || null,
        module,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        conditions,
        require_approval: requireApproval,
        retry_enabled: retryEnabled,
        max_retries: maxRetries,
        status: status as any,
      },
      actions: actions.map((a) => ({
        action_type: a.action_type,
        action_label: a.action_label,
        step_order: a.step_order,
        require_approval: a.require_approval,
        action_config: a.action_config,
      })),
    }, {
      onSuccess: () => onClose(),
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: return triggerType.length > 0;
      case 2: return true;
      case 3: return actions.length > 0;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  const filteredTriggers = TRIGGER_TYPES.filter((t) => t.module === module || module === "communication");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {automationId ? "Editar Automação" : "Nova Automação"}
          </h2>
          <p className="text-xs text-muted-foreground">{STEPS[step].label}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => i <= step && setStep(i)}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="min-h-[300px]"
        >
          {/* Step 0: Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Nome da automação</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Onboarding de novo cliente" className="mt-1" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que essa automação faz..." className="mt-1" rows={3} />
              </div>
              <div>
                <Label>Módulo relacionado</Label>
                <Select value={module} onValueChange={(v) => setModule(v as AutomationModule)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODULE_OPTIONS.map((m) => (
                      <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status inicial</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 1: Trigger */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Escolha o evento que dispara esta automação:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredTriggers.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTriggerType(t.key)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      triggerType === t.key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="material-symbols-rounded text-lg text-primary">{t.icon}</span>
                    <span className="text-sm font-medium text-foreground">{t.label}</span>
                  </button>
                ))}
              </div>
              {filteredTriggers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>Selecione um módulo com gatilhos disponíveis na etapa anterior.</p>
                  <p className="text-xs mt-1">Todos os gatilhos estão disponíveis nos módulos CRM, Projetos, Contratos, Financeiro e Portal.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Conditions */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Defina condições opcionais para executar a automação:
              </p>
              {conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2 glass-card p-3 rounded-lg">
                  <Input
                    placeholder="Campo (ex: contract_value)"
                    value={c.field}
                    onChange={(e) => updateCondition(i, { field: e.target.value })}
                    className="flex-1"
                  />
                  <Select value={c.operator} onValueChange={(v) => updateCondition(i, { operator: v })}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Igual a</SelectItem>
                      <SelectItem value="not_equals">Diferente de</SelectItem>
                      <SelectItem value="greater_than">Maior que</SelectItem>
                      <SelectItem value="less_than">Menor que</SelectItem>
                      <SelectItem value="contains">Contém</SelectItem>
                      <SelectItem value="is_set">Está definido</SelectItem>
                      <SelectItem value="is_not_set">Não está definido</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Valor"
                    value={c.value}
                    onChange={(e) => updateCondition(i, { value: e.target.value })}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeCondition(i)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCondition} className="gap-2">
                <Plus className="w-4 h-4" /> Adicionar condição
              </Button>
              {conditions.length === 0 && (
                <p className="text-xs text-muted-foreground/60 italic">Sem condições = executa sempre que o gatilho disparar.</p>
              )}
            </div>
          )}

          {/* Step 3: Actions */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Configure as ações em sequência:</p>
              {actions.map((a, i) => {
                const def = ACTION_TYPES.find((at) => at.key === a.action_type);
                return (
                  <div key={i} className="flex items-center gap-3 glass-card p-3 rounded-lg">
                    <GripVertical className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                    <div className={`w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0`}>
                      <span className="material-symbols-rounded text-sm text-primary">{def?.icon || "bolt"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Input
                        value={a.action_label}
                        onChange={(e) => {
                          const upd = [...actions];
                          upd[i] = { ...upd[i], action_label: e.target.value };
                          setActions(upd);
                        }}
                        className="text-sm border-0 bg-transparent p-0 h-auto font-medium"
                        placeholder="Descrição da ação"
                      />
                      <p className="text-[10px] text-muted-foreground mt-0.5">{def?.label}</p>
                    </div>
                    {a.require_approval && (
                      <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                        <Shield className="w-3 h-3" /> Aprovação
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={a.require_approval}
                        onCheckedChange={(v) => {
                          const upd = [...actions];
                          upd[i] = { ...upd[i], require_approval: v };
                          setActions(upd);
                        }}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeAction(i)}>
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {/* Add action buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                {ACTION_TYPES.filter((at) => !actions.some((a) => a.action_type === at.key)).map((at) => (
                  <button
                    key={at.key}
                    onClick={() => addAction(at.key)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                  >
                    <span className="material-symbols-rounded text-sm text-muted-foreground">{at.icon}</span>
                    <span className="text-xs text-muted-foreground">{at.label}</span>
                    {at.sensitive && <Shield className="w-3 h-3 text-primary/50 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Approval */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">Aprovação humana global</h3>
                    <p className="text-xs text-muted-foreground">Exigir aprovação antes de executar ações sensíveis</p>
                  </div>
                  <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                </div>
                {requireApproval && (
                  <p className="text-xs text-muted-foreground/60">
                    Ações marcadas com 🛡️ aguardarão aprovação antes da execução.
                  </p>
                )}
              </div>
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold">Retry automático</h3>
                    <p className="text-xs text-muted-foreground">Reprocessar em caso de falha</p>
                  </div>
                  <Switch checked={retryEnabled} onCheckedChange={setRetryEnabled} />
                </div>
                {retryEnabled && (
                  <div className="flex items-center gap-2 mt-2">
                    <Label className="text-xs">Máximo de tentativas:</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={maxRetries}
                      onChange={(e) => setMaxRetries(Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="glass-card p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Resumo da Automação</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium text-foreground">{name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Módulo:</span>
                    <p className="font-medium text-foreground">{MODULE_OPTIONS.find((m) => m.key === module)?.label}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gatilho:</span>
                    <p className="font-medium text-foreground">{TRIGGER_TYPES.find((t) => t.key === triggerType)?.label || triggerType}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium text-foreground">{status === "draft" ? "Rascunho" : "Ativa"}</p>
                  </div>
                </div>

                {conditions.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Condições ({conditions.length}):</span>
                    {conditions.map((c, i) => (
                      <p key={i} className="text-xs text-foreground mt-0.5">
                        {c.field} {c.operator} {c.value}
                      </p>
                    ))}
                  </div>
                )}

                <div>
                  <span className="text-xs text-muted-foreground">Ações ({actions.length}):</span>
                  <div className="space-y-1 mt-1">
                    {actions.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-5 text-right">{i + 1}.</span>
                        <span className="text-foreground">{a.action_label}</span>
                        {a.require_approval && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> Aprovação
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>Aprovação: {requireApproval ? "Sim" : "Não"}</span>
                  <span>Retry: {retryEnabled ? `Sim (${maxRetries}x)` : "Não"}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : onClose()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {step > 0 ? "Voltar" : "Cancelar"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-2">
            Próximo <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saveAutomation.isPending} className="gap-2">
            <Check className="w-4 h-4" />
            {saveAutomation.isPending ? "Salvando..." : "Salvar Automação"}
          </Button>
        )}
      </div>
    </div>
  );
}
