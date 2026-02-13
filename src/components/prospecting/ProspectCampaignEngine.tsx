/**
 * ProspectCampaignEngine — AI Campaign planning card
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Loader2, Target, Calendar, MessageSquare,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useProspectAI, CampaignPlan } from '@/hooks/useProspectAI';

interface Props {
  prospectId?: string;
  prospectName?: string;
  niche?: string;
  city?: string;
}

const RISK_CONFIG = {
  low: { label: 'Baixo', color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle },
  medium: { label: 'Médio', color: 'text-amber-400 bg-amber-500/10', icon: AlertTriangle },
  high: { label: 'Alto', color: 'text-red-400 bg-red-500/10', icon: AlertTriangle },
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬',
  email: '📧',
  call: '📞',
  instagram: '📸',
};

export function ProspectCampaignEngine({ prospectId, prospectName, niche, city }: Props) {
  const { planCampaign, isGenerating } = useProspectAI();
  const [plan, setPlan] = useState<CampaignPlan | null>(null);
  const [expandedApproach, setExpandedApproach] = useState<number | null>(0);

  const handlePlanCampaign = async () => {
    const result = await planCampaign(prospectId, { niche, city, prospect_name: prospectName });
    if (result) {
      setPlan(result);
      toast.success('Campanha planejada com IA');
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Motor de Campanhas IA</h3>
            <p className="text-[10px] text-muted-foreground">Estratégia, cadência e abordagens</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handlePlanCampaign}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {plan ? 'Replanejar' : 'Criar Campanha com IA'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {plan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-2"
          >
            {/* Objective + Risk */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Objetivo</p>
                <p className="text-sm text-foreground mt-0.5">{plan.objective}</p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const risk = RISK_CONFIG[plan.spam_risk];
                  return (
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-medium ${risk.color}`}>
                      <risk.icon className="w-3 h-3" />
                      Risco: {risk.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Best Channel/Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Melhor Canal</p>
                <p className="text-sm text-foreground mt-1">
                  {CHANNEL_ICONS[plan.best_channel] || '📱'} {plan.best_channel}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Melhor Horário</p>
                <p className="text-sm text-foreground mt-1">🕐 {plan.best_time}</p>
              </div>
            </div>

            {/* Cadence Steps */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Cadência</p>
              <div className="space-y-1">
                {plan.cadence_steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02]">
                    <span className="text-[10px] text-muted-foreground w-10 shrink-0">D+{step.day_offset}</span>
                    <span className="text-sm">{CHANNEL_ICONS[step.channel] || '📱'}</span>
                    <span className="text-xs text-foreground flex-1">{step.action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Approaches A/B/C */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Abordagens</p>
              <div className="space-y-2">
                {plan.approaches.map((approach, i) => (
                  <div key={i} className="border border-white/[0.05] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedApproach(expandedApproach === i ? null : i)}
                      className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-xs font-medium text-foreground">{approach.label}</span>
                      </div>
                      {expandedApproach === i ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    {expandedApproach === i && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        className="px-3 pb-3"
                      >
                        <p className="text-[10px] text-muted-foreground mb-2">{approach.angle}</p>
                        <div className="bg-[#005c4b] rounded-xl rounded-tr-sm p-3">
                          <p className="text-xs text-white whitespace-pre-wrap">{approach.first_message}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {plan.notes && (
              <p className="text-[10px] text-muted-foreground italic">{plan.notes}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
