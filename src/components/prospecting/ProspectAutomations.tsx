/**
 * ProspectAutomations — Automation engine panel connected to Supabase
 * Toggles, rules, kill switch, limits, timeline, notifications
 * Now: persists configs in prospecting_settings, unified timeline from multiple sources
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  Power, Shield, Clock, Send, MessageSquare, 
  AlertTriangle, Settings, Pause, Play, Bell,
  Activity, ChevronDown, ChevronUp, CheckCircle,
  XCircle, Timer, Loader2, Volume2, Smartphone, Filter
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

type TimelineFilter = 'all' | 'activities' | 'ai' | 'sends' | 'audios';

interface TimelineEntry {
  id: string;
  type: 'activity' | 'suggestion' | 'event' | 'audio';
  title: string;
  description?: string;
  status?: string;
  created_at: string;
  icon: typeof Send;
  color: string;
}

export function ProspectAutomations() {
  const { rules, pendingSuggestions, isLoading, isRunning, toggleRule, runAutomations, handleAction, ignoreSuggestion } = useAutomation();
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [approveFirst, setApproveFirst] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(20);
  const [activeRules, setActiveRules] = useState<Record<string, boolean>>({});
  const [showTimeline, setShowTimeline] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Load persisted configs from prospecting_settings
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from('prospecting_settings')
        .select('approve_first, auto_send, global_enabled, daily_activity_limit')
        .limit(1)
        .maybeSingle();

      if (data) {
        setApproveFirst((data as any).approve_first ?? true);
        setAutoSend((data as any).auto_send ?? false);
        setGlobalEnabled((data as any).global_enabled ?? false);
        if (data.daily_activity_limit) setDailyLimit(data.daily_activity_limit);
      }
    };
    loadSettings();
  }, []);

  // Sync backend rules with local state
  useEffect(() => {
    if (rules.length > 0) {
      const map: Record<string, boolean> = {};
      rules.forEach(r => { map[r.key] = r.is_enabled; });
      setActiveRules(prev => ({ ...prev, ...map }));
    }
  }, [rules]);

  // Persist config changes
  const saveConfig = useCallback(async (updates: Record<string, any>) => {
    setIsSavingConfig(true);
    try {
      const { data: existing } = await supabase
        .from('prospecting_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('prospecting_settings')
          .update(updates)
          .eq('id', existing.id);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setIsSavingConfig(false);
    }
  }, []);

  const handleGlobalToggle = (v: boolean) => {
    setGlobalEnabled(v);
    saveConfig({ global_enabled: v });
  };

  const handleApproveFirstToggle = (v: boolean) => {
    setApproveFirst(v);
    saveConfig({ approve_first: v });
  };

  const handleAutoSendToggle = (v: boolean) => {
    setAutoSend(v);
    saveConfig({ auto_send: v });
  };

  const handleDailyLimitChange = (v: number) => {
    setDailyLimit(v);
    saveConfig({ daily_activity_limit: v });
  };

  // Load unified timeline
  const loadTimeline = useCallback(async () => {
    setLoadingTimeline(true);
    try {
      const entries: TimelineEntry[] = [];

      // Suggestions (AI)
      const { data: suggestions } = await supabase
        .from('automation_suggestions')
        .select('id, title, message, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (suggestions) {
        suggestions.forEach(s => {
          entries.push({
            id: s.id,
            type: 'suggestion',
            title: s.title,
            description: s.message || undefined,
            status: s.status,
            created_at: s.created_at,
            icon: Loader2,
            color: s.status === 'applied' ? 'text-primary' : s.status === 'ignored' ? 'text-muted-foreground' : 'text-primary/60',
          });
        });
      }

      // Event logs (WhatsApp sends etc.)
      const { data: events } = await supabase
        .from('event_logs')
        .select('id, action, entity_type, entity_id, payload, created_at, actor_name')
        .in('action', ['whatsapp.sent', 'audio.generated', 'prospect.contacted'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (events) {
        events.forEach(e => {
          const payload = e.payload as any;
          entries.push({
            id: e.id,
            type: 'event',
            title: e.action === 'whatsapp.sent' 
              ? `WhatsApp → ${payload?.prospect_name || e.entity_id}`
              : e.action,
            description: payload?.message_preview || e.actor_name || undefined,
            status: 'sent',
            created_at: e.created_at,
            icon: e.action === 'whatsapp.sent' ? Smartphone : Send,
            color: 'text-primary',
          });
        });
      }

      // Audios
      const { data: audios } = await supabase
        .from('prospect_audio' as any)
        .select('id, status, created_at, duration_seconds, error_message')
        .order('created_at', { ascending: false })
        .limit(10);

      if (audios) {
        (audios as any[]).forEach(a => {
          entries.push({
            id: a.id,
            type: 'audio',
            title: `Áudio ${a.status === 'ready' ? 'gerado' : a.status === 'error' ? 'falhou' : 'processando'}`,
            description: a.error_message || (a.duration_seconds ? `${a.duration_seconds}s` : undefined),
            status: a.status,
            created_at: a.created_at,
            icon: Volume2,
            color: a.status === 'ready' ? 'text-primary' : a.status === 'error' ? 'text-destructive' : 'text-muted-foreground',
          });
        });
      }

      // Sort all by date
      entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTimelineEntries(entries);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoadingTimeline(false);
    }
  }, []);

  // Load timeline when expanded
  useEffect(() => {
    if (showTimeline) loadTimeline();
  }, [showTimeline, loadTimeline]);

  const filteredTimeline = timelineEntries.filter(e => {
    if (timelineFilter === 'all') return true;
    if (timelineFilter === 'activities') return e.type === 'activity';
    if (timelineFilter === 'ai') return e.type === 'suggestion';
    if (timelineFilter === 'sends') return e.type === 'event';
    if (timelineFilter === 'audios') return e.type === 'audio';
    return true;
  });

  const handleKillSwitch = async () => {
    for (const rule of rules) {
      if (rule.is_enabled) {
        await toggleRule(rule.id, false);
      }
    }
    setGlobalEnabled(false);
    setActiveRules({});
    saveConfig({ global_enabled: false });
    toast.success('Todas as automações foram pausadas');
  };

  const handleToggleRule = async (id: string) => {
    const newState = !activeRules[id];
    setActiveRules(prev => ({ ...prev, [id]: newState }));

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
    // Reload timeline after run
    if (showTimeline) loadTimeline();
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Automações IA</h3>
            <p className="text-[10px] text-muted-foreground">
              Motor de regras {rules.length > 0 ? `(${rules.length} regras)` : 'local'}
              {isSavingConfig && ' • salvando...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingSuggestions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="relative h-8 w-8 p-0"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-4 h-4 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[8px] text-primary-foreground font-bold flex items-center justify-center">
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
          <Switch checked={globalEnabled} onCheckedChange={handleGlobalToggle} />
        </div>
      </div>

      {/* Pending Suggestions / Notifications */}
      {showNotifications && pendingSuggestions.length > 0 && (
        <div className="space-y-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-[10px] text-primary uppercase tracking-wider font-medium">
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
                <Switch checked={approveFirst} onCheckedChange={handleApproveFirstToggle} className="scale-75" />
              </div>
              <p className="text-[10px] text-muted-foreground">{approveFirst ? 'ON — você aprova' : 'OFF — cuidado!'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Auto-Enviar</span>
                <Switch checked={autoSend} onCheckedChange={handleAutoSendToggle} className="scale-75" />
              </div>
              <p className="text-[10px] text-muted-foreground">{autoSend ? 'ON — só admin' : 'OFF — seguro'}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Limite/Dia</span>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => handleDailyLimitChange(Number(e.target.value))}
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
              className={`h-6 text-[10px] gap-1.5 ${allRulesActive ? 'border-destructive/30 text-destructive hover:bg-destructive/10' : 'border-primary/30 text-primary hover:bg-primary/10'}`}
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
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
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

          {/* Unified Timeline (expandable) */}
          {showTimeline && (
            <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Timeline</p>
                <div className="flex gap-1">
                  {(['all', 'ai', 'sends', 'audios'] as TimelineFilter[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setTimelineFilter(f)}
                      className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded transition-colors ${
                        timelineFilter === f
                          ? 'bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {f === 'all' ? 'Todas' : f === 'ai' ? 'IA' : f === 'sends' ? 'Envios' : 'Áudios'}
                    </button>
                  ))}
                </div>
              </div>

              {loadingTimeline ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTimeline.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/50 text-center py-3">
                  Nenhuma atividade recente. Clique "Executar Agora" para verificar.
                </p>
              ) : (
                filteredTimeline.slice(0, 15).map((entry) => {
                  const EntryIcon = entry.icon;
                  return (
                    <div key={entry.id} className="flex items-start gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
                      <EntryIcon className={`w-3 h-3 mt-0.5 shrink-0 ${entry.color}`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-foreground block truncate">{entry.title}</span>
                        {entry.description && (
                          <span className="text-[9px] text-muted-foreground/70 block truncate">{entry.description}</span>
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground/50 shrink-0">
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
