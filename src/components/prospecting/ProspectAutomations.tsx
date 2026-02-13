/**
 * ProspectAutomations — Automation engine panel connected to Supabase
 * Toggles, rules, kill switch, limits, timeline, notifications
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Power, Shield, Clock, Send, MessageSquare, 
  AlertTriangle, Settings, Pause, Play, Bell,
  Activity, ChevronDown, ChevronUp, CheckCircle,
  XCircle, Timer, Loader2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAutomation } from '@/hooks/useAutomation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RULE_ICONS: Record<string, typeof Send> = {
  'first_contact': Send,
  'silence_followup': Clock,
  'resume_conversation': MessageSquare,
  'soft_collection': AlertTriangle,
  'meeting_confirm': Timer,
  'post_meeting': CheckCircle,
};

const LOCAL_RULES = [
  { id: 'first_contact', label: 'Primeiro Contato', desc: 'Envia mensagem inicial para novos leads' },
  { id: 'silence_followup', label: 'Follow-up de Silêncio', desc: 'Reengaja leads sem resposta há 3+ dias' },
  { id: 'resume_conversation', label: 'Retomar Conversa', desc: 'Reabre leads frios após 7-14 dias' },
  { id: 'soft_collection', label: 'Cobrança Suave', desc: 'Lembrete educado para propostas pendentes' },
  { id: 'meeting_confirm', label: 'Confirmação de Reunião', desc: 'Confirma reunião 1h antes' },
  { id: 'post_meeting', label: 'Pós-Reunião', desc: 'Envia resumo e próximos passos' },
];

export function ProspectAutomations() {
  const { rules, pendingSuggestions, isLoading, isRunning, toggleRule, runAutomations, handleAction, ignoreSuggestion } = useAutomation();
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [approveFirst, setApproveFirst] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(20);
  const [activeRules, setActiveRules] = useState<Record<string, boolean>>({});
  const [showTimeline, setShowTimeline] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sync backend rules with local state
  useEffect(() => {
    if (rules.length > 0) {
      const map: Record<string, boolean> = {};
      rules.forEach(r => { map[r.key] = r.is_enabled; });
      setActiveRules(prev => ({ ...prev, ...map }));
      setGlobalEnabled(rules.some(r => r.is_enabled));
    }
  }, [rules]);

  const handleKillSwitch = async () => {
    // Disable all backend rules
    for (const rule of rules) {
      if (rule.is_enabled) {
        await toggleRule(rule.id, false);
      }
    }
    setGlobalEnabled(false);
    setActiveRules({});
    toast.success('Todas as automações foram pausadas');
  };

  const handleToggleRule = async (id: string) => {
    const newState = !activeRules[id];
    setActiveRules(prev => ({ ...prev, [id]: newState }));

    // Try to find backend rule
    const backendRule = rules.find(r => r.key === id);
    if (backendRule) {
      await toggleRule(backendRule.id, newState);
    } else {
      toast.success(newState ? `${id} ativado` : `${id} desativado`);
    }
  };

  const allRulesActive = LOCAL_RULES.every(r => activeRules[r.id]);

  const toggleAllRules = async () => {
    if (allRulesActive) {
      for (const rule of rules) {
        if (rule.is_enabled) await toggleRule(rule.id, false);
      }
      setActiveRules({});
      toast.info('Todas as regras desativadas');
    } else {
      const all: Record<string, boolean> = {};
      LOCAL_RULES.forEach(r => { all[r.id] = true; });
      for (const rule of rules) {
        if (!rule.is_enabled) await toggleRule(rule.id, true);
      }
      setActiveRules(all);
      toast.success('Todas as regras ativadas');
    }
  };

  const handleRunNow = async () => {
    await runAutomations();
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Automações IA</h3>
            <p className="text-[10px] text-muted-foreground">
              Motor de regras {rules.length > 0 ? `(${rules.length} regras)` : 'local'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications badge */}
          {pendingSuggestions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="relative h-8 w-8 p-0"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 text-[8px] text-white font-bold flex items-center justify-center">
                {pendingSuggestions.length}
              </span>
            </Button>
          )}
          {globalEnabled && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5 h-7"
              onClick={handleKillSwitch}
            >
              <Power className="w-3 h-3" />
              Kill Switch
            </Button>
          )}
          <Switch checked={globalEnabled} onCheckedChange={setGlobalEnabled} />
        </div>
      </div>

      {/* Pending Suggestions / Notifications */}
      {showNotifications && pendingSuggestions.length > 0 && (
        <div className="space-y-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">
            Ações Pendentes ({pendingSuggestions.length})
          </p>
          {pendingSuggestions.slice(0, 5).map((suggestion) => (
            <div key={suggestion.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white/[0.02]">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{suggestion.title}</p>
                {suggestion.message && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{suggestion.message}</p>
                )}
                <p className="text-[9px] text-muted-foreground/50 mt-1">
                  {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {suggestion.suggestion_json?.actions?.map((action) => (
                  <Button
                    key={action.key}
                    variant="outline"
                    size="sm"
                    className="h-6 text-[9px] px-2"
                    onClick={() => handleAction(suggestion.id, action.key)}
                  >
                    {action.label}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[9px] px-1.5 text-muted-foreground"
                  onClick={() => ignoreSuggestion(suggestion.id)}
                >
                  <XCircle className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {globalEnabled && (
        <>
          {/* Controls */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Aprovar Antes</span>
                <Switch checked={approveFirst} onCheckedChange={setApproveFirst} className="scale-75" />
              </div>
              <p className="text-[10px] text-muted-foreground">{approveFirst ? 'ON — você aprova' : 'OFF — cuidado!'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Auto-Enviar</span>
                <Switch checked={autoSend} onCheckedChange={setAutoSend} className="scale-75" />
              </div>
              <p className="text-[10px] text-muted-foreground">{autoSend ? 'ON — só admin' : 'OFF — seguro'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Limite/Dia</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-14 h-6 bg-transparent border border-white/10 rounded px-2 text-xs text-foreground"
                  min={1}
                  max={100}
                />
                <span className="text-[10px] text-muted-foreground">envios</span>
              </div>
            </div>
          </div>

          {/* Run Now + Timeline Toggle */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={handleRunNow}
              disabled={isRunning}
            >
              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {isRunning ? 'Executando...' : 'Executar Agora'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              <Activity className="w-3 h-3" />
              Timeline
              {showTimeline ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>

          {/* Rules Header with Toggle All */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Regras</span>
            <Button
              variant="outline"
              size="sm"
              className={`h-6 text-[10px] gap-1.5 ${allRulesActive ? 'border-destructive/30 text-destructive hover:bg-destructive/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}
              onClick={toggleAllRules}
            >
              {allRulesActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {allRulesActive ? 'Desligar Tudo' : 'Ativar Tudo'}
            </Button>
          </div>

          {/* Rules List */}
          <div className="space-y-1">
            {LOCAL_RULES.map((rule) => {
              const Icon = RULE_ICONS[rule.id] || Settings;
              return (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.03] flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{rule.label}</p>
                      <p className="text-[9px] text-muted-foreground">{rule.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeRules[rule.id] && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <Switch
                      checked={activeRules[rule.id] || false}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                      className="scale-75"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline (expandable) */}
          {showTimeline && (
            <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Andamento Recente</p>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : pendingSuggestions.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/50 text-center py-3">
                  Nenhuma atividade recente. Clique "Executar Agora" para verificar.
                </p>
              ) : (
                pendingSuggestions.slice(0, 10).map((s) => (
                  <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      s.status === 'applied' ? 'bg-emerald-500' : 
                      s.status === 'ignored' ? 'bg-muted-foreground' : 'bg-amber-500'
                    }`} />
                    <span className="text-[10px] text-foreground flex-1 truncate">{s.title}</span>
                    <span className="text-[9px] text-muted-foreground/50 shrink-0">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
