/**
 * ProspectAutomations — Local automation engine panel
 * Toggles, rules, kill switch, limits
 */
import { useState } from 'react';
import { 
  Power, Shield, Clock, Send, MessageSquare, 
  AlertTriangle, Settings, Pause, Play
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AUTOMATION_RULES = [
  { id: 'first_contact', label: 'Primeiro Contato', desc: 'Envia mensagem inicial para novos leads', icon: Send },
  { id: 'silence_followup', label: 'Follow-up de Silêncio', desc: 'Reengaja leads sem resposta há 3+ dias', icon: Clock },
  { id: 'resume_conversation', label: 'Retomar Conversa', desc: 'Reabre leads frios após 7-14 dias', icon: MessageSquare },
  { id: 'soft_collection', label: 'Cobrança Suave', desc: 'Lembrete educado para propostas pendentes', icon: AlertTriangle },
  { id: 'meeting_confirm', label: 'Confirmação de Reunião', desc: 'Confirma reunião 1h antes', icon: Clock },
  { id: 'post_meeting', label: 'Pós-Reunião', desc: 'Envia resumo e próximos passos', icon: MessageSquare },
];

export function ProspectAutomations() {
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [approveFirst, setApproveFirst] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(20);
  const [activeRules, setActiveRules] = useState<Record<string, boolean>>({});

  const handleKillSwitch = () => {
    setGlobalEnabled(false);
    setActiveRules({});
    toast.success('Todas as automações foram pausadas');
  };

  const toggleRule = (id: string) => {
    setActiveRules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allRulesActive = AUTOMATION_RULES.every(r => activeRules[r.id]);

  const toggleAllRules = () => {
    if (allRulesActive) {
      setActiveRules({});
      toast.info('Todas as regras desativadas');
    } else {
      const all: Record<string, boolean> = {};
      AUTOMATION_RULES.forEach(r => { all[r.id] = true; });
      setActiveRules(all);
      toast.success('Todas as regras ativadas');
    }
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
            <p className="text-[10px] text-muted-foreground">Motor de regras local</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
            {AUTOMATION_RULES.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.03] flex items-center justify-center">
                    <rule.icon className="w-3.5 h-3.5 text-muted-foreground" />
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
                    onCheckedChange={() => toggleRule(rule.id)}
                    className="scale-75"
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
