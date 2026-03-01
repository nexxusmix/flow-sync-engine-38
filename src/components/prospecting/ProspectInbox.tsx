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
  new: { label: 'Novo', color: 'bg-muted text-muted-foreground' },
  contacted: { label: 'Contato feito', color: 'bg-primary/10 text-primary' },
  conversation: { label: 'Em conversa', color: 'bg-primary/15 text-primary' },
  qualified: { label: 'Qualificado', color: 'bg-primary/20 text-primary' },
  proposal: { label: 'Proposta', color: 'bg-primary/25 text-primary' },
  negotiation: { label: 'Fechamento', color: 'bg-primary/30 text-primary' },
  won: { label: 'Ganho', color: 'bg-primary/20 text-primary' },
  lost: { label: 'Perdido', color: 'bg-destructive/20 text-destructive' },
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
