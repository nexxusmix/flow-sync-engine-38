import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Proposal, ProposalSection, ProposalDeliverable, ProposalTimeline,
  ProposalAcceptance, SECTION_TYPE_LABELS, SectionType
} from "@/types/proposals";
import { Check, X, FileText, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProposalClientPage() {
  const { proposalId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [deliverables, setDeliverables] = useState<ProposalDeliverable[]>([]);
  const [timeline, setTimeline] = useState<ProposalTimeline[]>([]);
  const [acceptance, setAcceptance] = useState<ProposalAcceptance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [acceptForm, setAcceptForm] = useState({ name: '', email: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (proposalId && token) {
      validateAndFetch();
    } else {
      setError("Link inválido");
      setLoading(false);
    }
  }, [proposalId, token]);

  const validateAndFetch = async () => {
    setLoading(true);
    
    // Validate token
    const { data: linkData, error: linkError } = await supabase
      .from('proposal_links')
      .select('*')
      .eq('proposal_id', proposalId)
      .eq('share_token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (linkError || !linkData) {
      setError("Link inválido ou expirado");
      setLoading(false);
      return;
    }

    // Check expiration
    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      setError("Este link expirou");
      setLoading(false);
      return;
    }

    // Update view count
    await supabase
      .from('proposal_links')
      .update({ 
        view_count: (linkData.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', linkData.id);

    // Update proposal status to viewed if not already approved/rejected
    const { data: proposalData } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalData) {
      if (!['approved', 'rejected'].includes(proposalData.status)) {
        await supabase
          .from('proposals')
          .update({ status: 'viewed' })
          .eq('id', proposalId);
        proposalData.status = 'viewed';
      }
      setProposal(proposalData as Proposal);
    }

    // Fetch sections
    const { data: sectionsData } = await supabase
      .from('proposal_sections')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('order_index');

    if (sectionsData) setSections(sectionsData as ProposalSection[]);

    // Fetch deliverables
    const { data: deliverablesData } = await supabase
      .from('proposal_deliverables')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at');

    if (deliverablesData) setDeliverables(deliverablesData as ProposalDeliverable[]);

    // Fetch timeline
    const { data: timelineData } = await supabase
      .from('proposal_timeline')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('order_index');

    if (timelineData) setTimeline(timelineData as ProposalTimeline[]);

    // Check if already accepted
    const { data: acceptanceData } = await supabase
      .from('proposal_acceptance')
      .select('*')
      .eq('proposal_id', proposalId)
      .maybeSingle();

    if (acceptanceData) setAcceptance(acceptanceData as ProposalAcceptance);

    setLoading(false);
  };

  const handleAccept = async () => {
    if (!acceptForm.name || !acceptForm.email) {
      toast.error("Nome e e-mail são obrigatórios");
      return;
    }

    setSubmitting(true);

    try {
      // Create acceptance record
      const { error: acceptError } = await supabase
        .from('proposal_acceptance')
        .insert([{
          proposal_id: proposalId,
          accepted_by_name: acceptForm.name,
          accepted_by_email: acceptForm.email,
          ip_address: 'client-side',
          user_agent: navigator.userAgent,
        }]);

      if (acceptError) throw acceptError;

      // Update proposal status
      await supabase
        .from('proposals')
        .update({ status: 'approved' })
        .eq('id', proposalId);

      setProposal(prev => prev ? { ...prev, status: 'approved' } : null);
      setShowAcceptModal(false);
      toast.success("Proposta aceita com sucesso!");
      
      // Reload to show acceptance
      validateAndFetch();

    } catch (error) {
      console.error("Error accepting proposal:", error);
      toast.error("Erro ao aceitar proposta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);

    try {
      // Update proposal status
      await supabase
        .from('proposals')
        .update({ 
          status: 'rejected',
          notes_internal: rejectReason ? `Motivo da recusa: ${rejectReason}` : undefined,
        })
        .eq('id', proposalId);

      setProposal(prev => prev ? { ...prev, status: 'rejected' } : null);
      setShowRejectModal(false);
      toast.success("Proposta recusada");

    } catch (error) {
      console.error("Error rejecting proposal:", error);
      toast.error("Erro ao recusar proposta");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando proposta...</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-medium text-foreground mb-2">
            {error || "Proposta não encontrada"}
          </h1>
          <p className="text-muted-foreground">
            Entre em contato com o remetente para obter um novo link.
          </p>
        </div>
      </div>
    );
  }

  const isApproved = proposal.status === 'approved';
  const isRejected = proposal.status === 'rejected';
  const isExpired = proposal.valid_until && new Date(proposal.valid_until) < new Date();

  return (
    <div className="min-h-screen bg-background">
      {/* Status Banner */}
      {(isApproved || isRejected) && (
        <div className={`py-3 px-6 text-center text-sm font-medium ${
          isApproved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {isApproved ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Esta proposta foi aceita em {acceptance ? format(new Date(acceptance.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <X className="w-4 h-4" />
              Esta proposta foi recusada
            </span>
          )}
        </div>
      )}

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
            <Badge 
              variant="outline" 
              className={`mt-4 ${isExpired ? 'border-red-500 text-red-500' : ''}`}
            >
              <Calendar className="w-3 h-3 mr-1" />
              {isExpired ? 'Expirada em ' : 'Válida até '}
              {format(new Date(proposal.valid_until), "dd/MM/yyyy", { locale: ptBR })}
            </Badge>
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
                                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(content?.excluded as string[])?.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-foreground mb-3">Não incluído nesta proposta:</h3>
                          <ul className="space-y-2">
                            {(content?.excluded as string[])?.map((item, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
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
              <div className="grid gap-4">
                {deliverables.map((deliverable, i) => (
                  <div key={deliverable.id} className="flex gap-4 p-4 rounded-xl bg-muted/30">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
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
                <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />
                <div className="space-y-0">
                  {timeline.map((phase, i) => (
                    <div key={phase.id} className="flex gap-4 relative pb-6 last:pb-0">
                      <div className="w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary font-medium z-10 flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="pt-2">
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
            <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-5xl font-light text-foreground">
                {formatCurrency(proposal.total_value)}
              </p>
              {sections.find(s => s.type === 'investment')?.content && (
                <p className="text-muted-foreground mt-4 whitespace-pre-wrap text-left">
                  {(sections.find(s => s.type === 'investment')?.content as { text?: string })?.text}
                </p>
              )}
            </div>
          </section>
        </div>

        <Separator className="my-12" />

        {/* Action Buttons */}
        {!isApproved && !isRejected && !isExpired && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => setShowAcceptModal(true)}
            >
              <Check className="w-5 h-5 mr-2" />
              Aceitar Proposta
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => setShowRejectModal(true)}
            >
              <X className="w-5 h-5 mr-2" />
              Recusar
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground mt-12">
          <p>Versão {proposal.version}</p>
        </div>
      </div>

      {/* Accept Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aceitar Proposta</DialogTitle>
            <DialogDescription>
              Confirme seus dados para formalizar o aceite desta proposta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Seu Nome Completo *</Label>
              <Input
                placeholder="Nome completo"
                value={acceptForm.name}
                onChange={(e) => setAcceptForm({ ...acceptForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Seu E-mail *</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={acceptForm.email}
                onChange={(e) => setAcceptForm({ ...acceptForm, email: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ao aceitar, você concorda com os termos e condições desta proposta.
              Um registro de aceite será criado com data, hora e informações do navegador.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAccept} disabled={submitting}>
              <Check className="w-4 h-4 mr-2" />
              {submitting ? "Processando..." : "Confirmar Aceite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Proposta</DialogTitle>
            <DialogDescription>
              Você pode informar o motivo da recusa (opcional).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Motivo da recusa (opcional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={submitting}>
              <X className="w-4 h-4 mr-2" />
              {submitting ? "Processando..." : "Recusar Proposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
