/**
 * ProspectInbox — Conversation list by lead (WhatsApp style)
 */
import { useState } from 'react';
import { 
  MessageSquare, Search, ChevronRight, User, Clock,
  Sparkles, Send
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProspectMessageGenerator } from './ProspectMessageGenerator';
import type { Prospect, ProspectOpportunity } from '@/types/prospecting';

interface Props {
  prospects: Prospect[];
  opportunities: ProspectOpportunity[];
}

const STAGE_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Novo', color: 'bg-slate-500/20 text-slate-400' },
  contacted: { label: 'Contato feito', color: 'bg-blue-500/20 text-blue-400' },
  conversation: { label: 'Em conversa', color: 'bg-cyan-500/20 text-cyan-400' },
  qualified: { label: 'Qualificado', color: 'bg-purple-500/20 text-purple-400' },
  proposal: { label: 'Proposta', color: 'bg-amber-500/20 text-amber-400' },
  negotiation: { label: 'Fechamento', color: 'bg-orange-500/20 text-orange-400' },
  won: { label: 'Ganho', color: 'bg-emerald-500/20 text-emerald-400' },
  lost: { label: 'Perdido', color: 'bg-red-500/20 text-red-400' },
};

export function ProspectInbox({ prospects, opportunities }: Props) {
  const [search, setSearch] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<ProspectOpportunity | null>(null);

  const filteredProspects = prospects
    .filter(p => p.status !== 'blacklisted')
    .filter(p => !search || p.company_name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 20);

  const getOpportunity = (prospectId: string) => {
    return opportunities.find(o => o.prospect_id === prospectId);
  };

  const openGenerator = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setSelectedOpp(getOpportunity(prospect.id) || null);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Inbox / Conversas</h3>
          </div>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
            {filteredProspects.length} leads
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar lead..."
            className="pl-9 h-8 text-xs bg-white/[0.02] border-white/[0.05]"
          />
        </div>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {filteredProspects.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Nenhum lead encontrado</p>
          </div>
        ) : (
          filteredProspects.map((prospect) => {
            const opp = getOpportunity(prospect.id);
            const stage = opp ? STAGE_LABELS[opp.stage] || STAGE_LABELS.new : null;

            return (
              <button
                key={prospect.id}
                onClick={() => openGenerator(prospect)}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.02] border-b border-white/[0.02] transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-foreground">
                    {prospect.company_name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground truncate">{prospect.company_name}</p>
                    {stage && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${stage.color}`}>
                        {stage.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {prospect.decision_maker_name || prospect.niche || 'Sem contato'}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>
            );
          })
        )}
      </div>

      {/* Message Generator Dialog */}
      <Dialog open={!!selectedProspect} onOpenChange={() => setSelectedProspect(null)}>
        <DialogContent className="max-w-lg bg-background border-white/[0.05]">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              {selectedProspect?.company_name}
            </DialogTitle>
          </DialogHeader>
          <ProspectMessageGenerator
            prospect={selectedProspect}
            opportunity={selectedOpp}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
