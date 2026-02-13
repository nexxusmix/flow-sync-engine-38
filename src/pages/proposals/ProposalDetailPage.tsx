import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Proposal, ProposalSection, ProposalDeliverable, ProposalTimeline,
  DEFAULT_SECTIONS, STATUS_LABELS, SECTION_TYPE_LABELS, SectionType, ProposalStatus
} from "@/types/proposals";
import {
  FileText, Save, Eye, Link2, Sparkles, Plus, Trash2,
  GripVertical, ChevronDown, ChevronUp, Calendar, DollarSign,
  ArrowLeft, Send, Check, X, FileSignature
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AiPromptField } from "@/components/ai/AiPromptField";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ProposalDetailPage() {
  const { proposalId } = useParams();
  const navigate = useNavigate();
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [deliverables, setDeliverables] = useState<ProposalDeliverable[]>([]);
  const [timeline, setTimeline] = useState<ProposalTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiBriefing, setAiBriefing] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (proposalId) {
      fetchProposal();
    }
  }, [proposalId]);

  const fetchProposal = async () => {
    setLoading(true);
    
    // Fetch proposal
    const { data: proposalData, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposalData) {
      toast.error("Proposta não encontrada");
      navigate('/propostas');
      return;
    }

    setProposal(proposalData as Proposal);

    // Fetch sections
    const { data: sectionsData } = await supabase
      .from('proposal_sections')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('order_index');

    if (sectionsData && sectionsData.length > 0) {
      setSections(sectionsData as ProposalSection[]);
      // Expand all sections by default
      setExpandedSections(new Set(sectionsData.map(s => s.id)));
    } else {
      // Create default sections
      const defaultSections = DEFAULT_SECTIONS.map(s => ({
        proposal_id: proposalId!,
        type: s.type,
        title: s.title,
        order_index: s.order,
        content: JSON.parse(JSON.stringify({ text: '' })),
      }));

      const { data: newSections } = await supabase
        .from('proposal_sections')
        .insert(defaultSections)
        .select();

      if (newSections) {
        setSections(newSections as ProposalSection[]);
        setExpandedSections(new Set(newSections.map(s => s.id)));
      }
    }

    // Fetch deliverables
    const { data: deliverablesData } = await supabase
      .from('proposal_deliverables')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('created_at');

    if (deliverablesData) {
      setDeliverables(deliverablesData as ProposalDeliverable[]);
    }

    // Fetch timeline
    const { data: timelineData } = await supabase
      .from('proposal_timeline')
      .select('*')
      .eq('proposal_id', proposalId)
      .order('order_index');

    if (timelineData) {
      setTimeline(timelineData as ProposalTimeline[]);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!proposal) return;
    setSaving(true);

    try {
      // Update proposal
      const { error: proposalError } = await supabase
        .from('proposals')
        .update({
          title: proposal.title,
          client_name: proposal.client_name,
          client_email: proposal.client_email,
          total_value: proposal.total_value,
          valid_until: proposal.valid_until,
          notes_internal: proposal.notes_internal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposal.id);

      if (proposalError) throw proposalError;

      // Update sections
      for (const section of sections) {
        const { error } = await supabase
          .from('proposal_sections')
          .update({
            title: section.title,
            content: JSON.parse(JSON.stringify(section.content)),
            order_index: section.order_index,
          })
          .eq('id', section.id);

        if (error) console.error("Error saving section:", error);
      }

      toast.success("Proposta salva!");
    } catch (error) {
      console.error("Error saving proposal:", error);
      toast.error("Erro ao salvar proposta");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiBriefing.trim()) {
      toast.error("Descreva o projeto para gerar a proposta");
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: {
          briefing: aiBriefing,
          clientName: proposal?.client_name,
        }
      });

      if (error) throw error;

      // Update sections with AI content
      const updatedSections = [...sections];
      
      if (data.intro?.text) {
        const introSection = updatedSections.find(s => s.type === 'intro');
        if (introSection) introSection.content = { text: data.intro.text };
      }
      
      if (data.context?.text) {
        const contextSection = updatedSections.find(s => s.type === 'context');
        if (contextSection) contextSection.content = { text: data.context.text };
      }
      
      if (data.scope) {
        const scopeSection = updatedSections.find(s => s.type === 'scope');
        if (scopeSection) {
          scopeSection.content = {
            included: data.scope.included || [],
            excluded: data.scope.excluded || [],
          };
        }
      }
      
      if (data.terms?.text) {
        const termsSection = updatedSections.find(s => s.type === 'terms');
        if (termsSection) termsSection.content = { text: data.terms.text };
      }
      
      if (data.cta?.text) {
        const ctaSection = updatedSections.find(s => s.type === 'cta');
        if (ctaSection) ctaSection.content = { text: data.cta.text };
      }

      setSections(updatedSections);

      // Add deliverables
      if (data.deliverables?.length) {
        const newDeliverables = data.deliverables.map((d: { title: string; description: string; quantity: number }) => ({
          proposal_id: proposalId,
          title: d.title,
          description: d.description,
          quantity: d.quantity || 1,
        }));

        const { data: insertedDeliverables } = await supabase
          .from('proposal_deliverables')
          .insert(newDeliverables)
          .select();

        if (insertedDeliverables) {
          setDeliverables([...deliverables, ...insertedDeliverables as ProposalDeliverable[]]);
        }
      }

      // Add timeline
      if (data.timeline?.length) {
        const newTimeline = data.timeline.map((t: { phase: string; description: string; duration_days: number }, i: number) => ({
          proposal_id: proposalId,
          phase: t.phase,
          description: t.description,
          order_index: i,
        }));

        const { data: insertedTimeline } = await supabase
          .from('proposal_timeline')
          .insert(newTimeline)
          .select();

        if (insertedTimeline) {
          setTimeline([...timeline, ...insertedTimeline as ProposalTimeline[]]);
        }
      }

      // Update title if suggested
      if (data.suggested_title && proposal) {
        setProposal({ ...proposal, title: data.suggested_title });
      }

      toast.success("Proposta gerada com IA!");
      setShowAIModal(false);
      setAiBriefing("");

    } catch (error) {
      console.error("Error generating with AI:", error);
      toast.error("Erro ao gerar proposta");
    } finally {
      setGenerating(false);
    }
  };

  const handleSectionChange = (sectionId: string, content: Record<string, unknown>) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, content } : s
    ));
  };

  const handleAddDeliverable = async () => {
    const { data, error } = await supabase
      .from('proposal_deliverables')
      .insert([{
        proposal_id: proposalId,
        title: "Novo entregável",
        quantity: 1,
      }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao adicionar entregável");
      return;
    }

    setDeliverables([...deliverables, data as ProposalDeliverable]);
  };

  const handleDeleteDeliverable = async (id: string) => {
    await supabase.from('proposal_deliverables').delete().eq('id', id);
    setDeliverables(deliverables.filter(d => d.id !== id));
  };

  const handleAddPhase = async () => {
    const { data, error } = await supabase
      .from('proposal_timeline')
      .insert([{
        proposal_id: proposalId,
        phase: "Nova fase",
        order_index: timeline.length,
      }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao adicionar fase");
      return;
    }

    setTimeline([...timeline, data as ProposalTimeline]);
  };

  const handleDeletePhase = async (id: string) => {
    await supabase.from('proposal_timeline').delete().eq('id', id);
    setTimeline(timeline.filter(t => t.id !== id));
  };

  const handleGenerateLink = async () => {
    if (!proposal) return;
    
    const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    
    const { error } = await supabase
      .from('proposal_links')
      .insert([{
        proposal_id: proposal.id,
        share_token: token,
        is_active: true,
      }]);

    if (error) {
      toast.error("Erro ao gerar link");
      return;
    }

    // Update status to sent
    await supabase
      .from('proposals')
      .update({ status: 'sent' })
      .eq('id', proposal.id);

    setProposal({ ...proposal, status: 'sent' });

    const link = `${window.location.origin}/propostas/${proposal.id}/client?token=${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado! Status alterado para 'Enviada'");
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading || !proposal) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando proposta...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isLocked = ['approved', 'rejected'].includes(proposal.status);
  const canConvert = proposal.status === 'approved' && !(proposal as any).converted_to_contract;

  const handleConvertToContract = async () => {
    if (!proposal) return;
    setConverting(true);

    try {
      const { data, error } = await supabase.functions.invoke('convert-proposal-to-contract', {
        body: { proposal_id: proposal.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Contrato gerado com sucesso!");
      setShowConvertModal(false);
      navigate(`/contratos/${data.contract_id}`);
    } catch (error: any) {
      console.error("Error converting proposal:", error);
      toast.error(error?.message || "Erro ao converter proposta em contrato");
    } finally {
      setConverting(false);
    }
  };

  return (
    <DashboardLayout title={proposal.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/propostas')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Badge className={cn("text-xs", STATUS_LABELS[proposal.status as ProposalStatus].color)}>
              {STATUS_LABELS[proposal.status as ProposalStatus].label}
            </Badge>
            <Badge variant="outline" className="text-xs">v{proposal.version}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {canConvert && (
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setShowConvertModal(true)}
              >
                <FileSignature className="w-4 h-4 mr-2" />
                Aprovar e gerar contrato
              </Button>
            )}
            {(proposal as any).converted_to_contract && (proposal as any).contract_id && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/contratos/${(proposal as any).contract_id}`)}
              >
                <FileSignature className="w-4 h-4 mr-2" />
                Ver Contrato
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowAIModal(true)} disabled={isLocked}>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar com IA
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/propostas/${proposalId}/preview`)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateLink} disabled={isLocked}>
              <Link2 className="w-4 h-4 mr-2" />
              Gerar Link
            </Button>
            <Button onClick={handleSave} disabled={saving || isLocked}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        {isLocked && (
          <Card className="p-4 bg-amber-500/10 border-amber-500/30">
            <p className="text-amber-500 text-sm">
              Esta proposta foi {proposal.status === 'approved' ? 'aprovada' : 'recusada'} e não pode ser editada.
              Crie uma nova versão para fazer alterações.
            </p>
          </Card>
        )}

      {/* Convert to Contract Confirmation Modal */}
      <AlertDialog open={showConvertModal} onOpenChange={setShowConvertModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar contrato a partir desta proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Um contrato será criado automaticamente com os dados desta proposta 
              (cliente, valor, escopo). A proposta será marcada como convertida e 
              não poderá ser convertida novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={converting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConvertToContract}
              disabled={converting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {converting ? "Gerando..." : "Confirmar e gerar contrato"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-4">
            {/* Basic Info */}
            <Card className="glass-card p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título da Proposta</Label>
                  <Input
                    value={proposal.title}
                    onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input
                    value={proposal.client_name}
                    onChange={(e) => setProposal({ ...proposal, client_name: e.target.value })}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail do Cliente</Label>
                  <Input
                    type="email"
                    value={proposal.client_email || ''}
                    onChange={(e) => setProposal({ ...proposal, client_email: e.target.value })}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Total</Label>
                  <Input
                    type="number"
                    value={proposal.total_value}
                    onChange={(e) => setProposal({ ...proposal, total_value: parseFloat(e.target.value) || 0 })}
                    disabled={isLocked}
                  />
                </div>
              </div>
            </Card>

            {/* Sections */}
            <div className="space-y-3">
              {sections.sort((a, b) => a.order_index - b.order_index).map((section) => (
                <Card key={section.id} className="glass-card overflow-hidden">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {section.title || SECTION_TYPE_LABELS[section.type as SectionType]}
                      </span>
                      <Badge variant="outline" className="text-[9px]">{section.type}</Badge>
                    </div>
                    {expandedSections.has(section.id) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  {expandedSections.has(section.id) && (
                    <div className="p-4 pt-0 border-t border-border">
                      {section.type === 'scope' ? (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Incluído</Label>
                            <Textarea
                              value={(section.content as { included?: string[] })?.included?.join('\n') || ''}
                              onChange={(e) => handleSectionChange(section.id, {
                                ...section.content,
                                included: e.target.value.split('\n').filter(Boolean),
                              })}
                              placeholder="Um item por linha"
                              rows={4}
                              disabled={isLocked}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Não Incluído</Label>
                            <Textarea
                              value={(section.content as { excluded?: string[] })?.excluded?.join('\n') || ''}
                              onChange={(e) => handleSectionChange(section.id, {
                                ...section.content,
                                excluded: e.target.value.split('\n').filter(Boolean),
                              })}
                              placeholder="Um item por linha"
                              rows={3}
                              disabled={isLocked}
                            />
                          </div>
                        </div>
                      ) : (
                        <Textarea
                          value={(section.content as { text?: string })?.text || ''}
                          onChange={(e) => handleSectionChange(section.id, { text: e.target.value })}
                          placeholder={`Conteúdo da seção ${section.title}...`}
                          rows={6}
                          disabled={isLocked}
                        />
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Deliverables */}
            <Card className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Entregáveis</h3>
                <Button variant="ghost" size="sm" onClick={handleAddDeliverable} disabled={isLocked}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <Input
                        value={deliverable.title}
                        onChange={(e) => {
                          setDeliverables(deliverables.map(d =>
                            d.id === deliverable.id ? { ...d, title: e.target.value } : d
                          ));
                        }}
                        className="text-sm font-medium h-8"
                        disabled={isLocked}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteDeliverable(deliverable.id)}
                        disabled={isLocked}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={deliverable.description || ''}
                      onChange={(e) => {
                        setDeliverables(deliverables.map(d =>
                          d.id === deliverable.id ? { ...d, description: e.target.value } : d
                        ));
                      }}
                      placeholder="Descrição..."
                      rows={2}
                      className="text-xs"
                      disabled={isLocked}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={deliverable.quantity}
                        onChange={(e) => {
                          setDeliverables(deliverables.map(d =>
                            d.id === deliverable.id ? { ...d, quantity: parseInt(e.target.value) || 1 } : d
                          ));
                        }}
                        className="w-20 h-8 text-xs"
                        disabled={isLocked}
                      />
                      <span className="text-xs text-muted-foreground self-center">unidade(s)</span>
                    </div>
                  </div>
                ))}
                {deliverables.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum entregável
                  </p>
                )}
              </div>
            </Card>

            {/* Timeline */}
            <Card className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Cronograma</h3>
                <Button variant="ghost" size="sm" onClick={handleAddPhase} disabled={isLocked}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {timeline.map((phase, i) => (
                  <div key={phase.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                        {i + 1}
                      </div>
                      <Input
                        value={phase.phase}
                        onChange={(e) => {
                          setTimeline(timeline.map(t =>
                            t.id === phase.id ? { ...t, phase: e.target.value } : t
                          ));
                        }}
                        className="text-sm font-medium h-8 flex-1"
                        disabled={isLocked}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeletePhase(phase.id)}
                        disabled={isLocked}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={phase.description || ''}
                      onChange={(e) => {
                        setTimeline(timeline.map(t =>
                          t.id === phase.id ? { ...t, description: e.target.value } : t
                        ));
                      }}
                      placeholder="Descrição da fase..."
                      rows={2}
                      className="text-xs"
                      disabled={isLocked}
                    />
                  </div>
                ))}
                {timeline.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma fase
                  </p>
                )}
              </div>
            </Card>

            {/* Internal Notes */}
            <Card className="glass-card p-4">
              <h3 className="font-medium text-foreground mb-3">Notas Internas</h3>
              <Textarea
                value={proposal.notes_internal || ''}
                onChange={(e) => setProposal({ ...proposal, notes_internal: e.target.value })}
                placeholder="Notas que NÃO aparecem para o cliente..."
                rows={4}
                className="text-sm"
                disabled={isLocked}
              />
            </Card>

            {/* Validity */}
            <Card className="glass-card p-4">
              <h3 className="font-medium text-foreground mb-3">Validade</h3>
              <Input
                type="date"
                value={proposal.valid_until || ''}
                onChange={(e) => setProposal({ ...proposal, valid_until: e.target.value })}
                disabled={isLocked}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* AI Generation Modal */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Gerar Proposta com IA
            </DialogTitle>
            <DialogDescription>
              Descreva o projeto e deixe a IA criar o conteúdo inicial da proposta.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AiPromptField
              value={aiBriefing}
              onChange={setAiBriefing}
              placeholder="Descreva o projeto: tipo de serviço, objetivos, público-alvo, referências, restrições, orçamento aproximado..."
              rows={8}
              featureId="proposal-ai"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateWithAI} disabled={generating}>
              <Sparkles className="w-4 h-4 mr-2" />
              {generating ? "Gerando..." : "Gerar Proposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
