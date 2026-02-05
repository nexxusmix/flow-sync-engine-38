import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Proposal, ProposalSection, ProposalDeliverable, ProposalTimeline,
  SECTION_TYPE_LABELS, SectionType
} from "@/types/proposals";
import { ArrowLeft, Calendar, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProposalPreviewPage() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [deliverables, setDeliverables] = useState<ProposalDeliverable[]>([]);
  const [timeline, setTimeline] = useState<ProposalTimeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (proposalId) {
      fetchProposal();
    }
  }, [proposalId]);

  const fetchProposal = async () => {
    setLoading(true);
    
    const { data: proposalData } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalData) setProposal(proposalData as Proposal);

    const { data: sectionsData } = await supabase
      .from('proposal_sections')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('order_index');

    if (sectionsData) setSections(sectionsData as ProposalSection[]);

    const { data: deliverablesData } = await supabase
      .from('proposal_deliverables')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at');

    if (deliverablesData) setDeliverables(deliverablesData as ProposalDeliverable[]);

    const { data: timelineData } = await supabase
      .from('proposal_timeline')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('order_index');

    if (timelineData) setTimeline(timelineData as ProposalTimeline[]);

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading || !proposal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/propostas/${proposalId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Editor
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Preview Interno</Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Cover */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-light text-foreground tracking-tight mb-4">
            {proposal.title}
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Preparado para <span className="text-foreground font-medium">{proposal.client_name}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(proposal.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          {proposal.valid_until && (
            <p className="text-xs text-muted-foreground mt-2">
              Válida até {format(new Date(proposal.valid_until), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
        </div>

        <Separator className="my-12" />

        {/* Sections */}
        <div className="space-y-12">
          {sections
            .filter(s => s.type !== 'deliverables' && s.type !== 'timeline' && s.type !== 'investment')
            .sort((a, b) => a.order_index - b.order_index)
            .map((section) => {
              const content = section.content as Record<string, unknown>;
              const hasContent = section.type === 'scope' 
                ? ((content?.included as string[])?.length > 0 || (content?.excluded as string[])?.length > 0)
                : !!(content?.text as string);

              if (!hasContent) return null;

              return (
                <section key={section.id} className="space-y-4">
                  <h2 className="text-xl font-medium text-foreground uppercase tracking-wide">
                    {section.title || SECTION_TYPE_LABELS[section.type as SectionType]}
                  </h2>
                  
                  {section.type === 'scope' ? (
                    <div className="space-y-6">
                      {(content?.included as string[])?.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-foreground mb-3">O que está incluído:</h3>
                          <ul className="space-y-2">
                            {(content?.included as string[])?.map((item, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                                <span className="text-muted-foreground">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(content?.excluded as string[])?.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-foreground mb-3">Não incluído:</h3>
                          <ul className="space-y-2">
                            {(content?.excluded as string[])?.map((item, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2" />
                                <span className="text-muted-foreground">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {content?.text as string}
                    </p>
                  )}
                </section>
              );
            })}

          {/* Deliverables */}
          {deliverables.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-medium text-foreground uppercase tracking-wide">
                Entregáveis
              </h2>
              <div className="space-y-4">
                {deliverables.map((deliverable, i) => (
                  <div key={deliverable.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-medium flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-foreground font-medium">
                        {deliverable.quantity > 1 && `${deliverable.quantity}x `}
                        {deliverable.title}
                      </h3>
                      {deliverable.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {deliverable.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-medium text-foreground uppercase tracking-wide">
                Cronograma
              </h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-6">
                  {timeline.map((phase, i) => (
                    <div key={phase.id} className="flex gap-4 pl-8 relative">
                      <div className="absolute left-0 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary text-sm font-medium">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-foreground font-medium">{phase.phase}</h3>
                        {phase.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {phase.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Investment */}
          <section className="space-y-4">
            <h2 className="text-xl font-medium text-foreground uppercase tracking-wide">
              Investimento
            </h2>
            <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20">
              <p className="text-4xl font-light text-foreground">
                {formatCurrency(proposal.total_value)}
              </p>
              {sections.find(s => s.type === 'investment')?.content && (
                <p className="text-muted-foreground mt-4 whitespace-pre-wrap">
                  {(sections.find(s => s.type === 'investment')?.content as { text?: string })?.text}
                </p>
              )}
            </div>
          </section>
        </div>

        <Separator className="my-12" />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Versão {proposal.version} • Gerada em {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
      </div>
    </div>
  );
}
