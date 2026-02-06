import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMarketingStore } from "@/stores/marketingStore";
import { useParams, useNavigate } from "react-router-dom";
import { ContentItem, CONTENT_ITEM_STAGES, CONTENT_PILLARS, CONTENT_CHANNELS, CONTENT_FORMATS } from "@/types/marketing";
import { 
  ArrowLeft, Save, Sparkles, CheckCircle, MessageSquare,
  ExternalLink, Calendar, Link as LinkIcon, User, Plus,
  Trash2, Square, CheckSquare, Loader2
} from "lucide-react";
import { ContentAssetsTab } from "@/components/marketing/ContentAssetsTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateCaptions, isAIError, GenerateCaptionsResult } from "@/lib/ai";

export default function ContentDetailPage() {
  const { contentItemId } = useParams();
  const navigate = useNavigate();
  const { 
    contentItems, 
    fetchContentItems,
    updateContentItem,
    updateContentStatus,
    addComment,
    addChecklistItem,
    toggleChecklistItem,
    setSelectedItem,
    selectedItem,
  } = useMarketingStore();

  const [item, setItem] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState<Partial<ContentItem>>({});
  const [newComment, setNewComment] = useState('');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [showCopyConfirmDialog, setShowCopyConfirmDialog] = useState(false);
  const [pendingCopyData, setPendingCopyData] = useState<GenerateCaptionsResult | null>(null);

  // Check if there's existing copy content
  const hasExistingCopy = !!(
    formData.hook || 
    formData.caption_short || 
    formData.caption_long || 
    formData.cta || 
    formData.hashtags || 
    formData.script
  );

  const handleGenerateCopy = async () => {
    if (!item) return;
    
    setIsGeneratingCopy(true);
    
    try {
      const result = await generateCaptions({
        contentItem: {
          id: item.id,
          title: item.title,
          channel: item.channel,
          format: item.format,
          pillar: item.pillar,
          hook: formData.hook,
          notes: formData.notes,
        }
      });

      if (isAIError(result)) {
        if (result.status === 429) {
          toast.error('Limite de requisições excedido. Tente novamente em alguns segundos.');
        } else if (result.status === 402) {
          toast.error('Créditos insuficientes. Adicione créditos para continuar.');
        } else {
          toast.error(result.error || 'Erro ao gerar copy');
        }
        return;
      }

      // If there's existing content, show confirmation dialog
      if (hasExistingCopy) {
        setPendingCopyData(result);
        setShowCopyConfirmDialog(true);
      } else {
        // Apply directly
        applyCopyData(result, 'replace');
      }
    } catch (err) {
      console.error('handleGenerateCopy error:', err);
      toast.error('Erro ao gerar copy. Tente novamente.');
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const applyCopyData = async (data: GenerateCaptionsResult, mode: 'replace' | 'append') => {
    const newFormData = { ...formData };
    
    if (mode === 'replace') {
      newFormData.hook = data.hook;
      newFormData.caption_short = data.caption_short;
      newFormData.caption_long = data.caption_long;
      newFormData.cta = data.cta;
      newFormData.hashtags = data.hashtags;
      if (data.script) newFormData.script = data.script;
    } else {
      // Append mode
      newFormData.hook = formData.hook ? `${formData.hook}\n\n---\n\n${data.hook}` : data.hook;
      newFormData.caption_short = formData.caption_short ? `${formData.caption_short}\n\n---\n\n${data.caption_short}` : data.caption_short;
      newFormData.caption_long = formData.caption_long ? `${formData.caption_long}\n\n---\n\n${data.caption_long}` : data.caption_long;
      newFormData.cta = formData.cta ? `${formData.cta} | ${data.cta}` : data.cta;
      newFormData.hashtags = formData.hashtags ? `${formData.hashtags} ${data.hashtags}` : data.hashtags;
      if (data.script) newFormData.script = formData.script ? `${formData.script}\n\n---\n\n${data.script}` : data.script;
    }

    setFormData(newFormData);
    
    // Persist to database
    if (item) {
      await updateContentItem(item.id, {
        hook: newFormData.hook,
        caption_short: newFormData.caption_short,
        caption_long: newFormData.caption_long,
        cta: newFormData.cta,
        hashtags: newFormData.hashtags,
        script: newFormData.script,
      });
    }
    
    setShowCopyConfirmDialog(false);
    setPendingCopyData(null);
    toast.success('Copy gerada com sucesso!');
  };

  useEffect(() => {
    if (contentItems.length === 0) {
      fetchContentItems();
    }
  }, []);

  useEffect(() => {
    const found = contentItems.find(i => i.id === contentItemId);
    if (found) {
      setItem(found);
      setFormData(found);
      setSelectedItem(found);
    }
  }, [contentItemId, contentItems]);

  const handleSave = async () => {
    if (!item) return;
    
    await updateContentItem(item.id, formData);
    toast.success('Alterações salvas');
  };

  const handleStatusChange = async (status: ContentItem['status']) => {
    if (!item) return;
    await updateContentStatus(item.id, status);
    toast.success(`Status atualizado para ${CONTENT_ITEM_STAGES.find(s => s.type === status)?.name}`);
  };

  const handleAddComment = async () => {
    if (!item || !newComment.trim()) return;
    await addComment(item.id, newComment);
    setNewComment('');
    toast.success('Comentário adicionado');
  };

  const handleAddChecklistItem = async () => {
    if (!item || !newChecklistTitle.trim()) return;
    await addChecklistItem(item.id, newChecklistTitle);
    setNewChecklistTitle('');
    toast.success('Item adicionado ao checklist');
  };

  const handleToggleChecklist = async (checklistId: string, currentStatus: string) => {
    await toggleChecklistItem(checklistId, currentStatus === 'pending');
  };

  if (!item) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const currentStage = CONTENT_ITEM_STAGES.find(s => s.type === item.status);
  const channel = CONTENT_CHANNELS.find(c => c.type === item.channel);

  return (
    <DashboardLayout title={item.title}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/marketing/pipeline')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-medium text-foreground">{item.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("text-[9px] px-2 py-0.5 rounded font-medium text-white", currentStage?.color)}>
                  {currentStage?.name}
                </span>
                {channel && (
                  <span className={cn("text-[9px] px-2 py-0.5 rounded font-medium text-white", channel.color)}>
                    {channel.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Select value={item.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_ITEM_STAGES.map((stage) => (
                  <SelectItem key={stage.type} value={stage.type}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", stage.color)} />
                      {stage.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="briefing" className="space-y-6">
          <TabsList className="bg-muted/30 p-1">
            <TabsTrigger value="briefing">Briefing</TabsTrigger>
            <TabsTrigger value="copy">Copy & Roteiro</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="review">Revisão</TabsTrigger>
            <TabsTrigger value="publish">Publicação</TabsTrigger>
          </TabsList>

          {/* Briefing Tab */}
          <TabsContent value="briefing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-card rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-medium text-foreground">Informações Básicas</h3>
                  
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Canal</Label>
                      <Select 
                        value={formData.channel || ''} 
                        onValueChange={(v: any) => setFormData({ ...formData, channel: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTENT_CHANNELS.map((c) => (
                            <SelectItem key={c.type} value={c.type}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Formato</Label>
                      <Select 
                        value={formData.format || ''} 
                        onValueChange={(v: any) => setFormData({ ...formData, format: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTENT_FORMATS.map((f) => (
                            <SelectItem key={f.type} value={f.type}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Pilar</Label>
                      <Select 
                        value={formData.pillar || ''} 
                        onValueChange={(v: any) => setFormData({ ...formData, pillar: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTENT_PILLARS.map((p) => (
                            <SelectItem key={p.type} value={p.type}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Notas / Briefing</Label>
                    <Textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Objetivo, público, referências..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-medium text-foreground mb-4">Checklist</h3>
                
                <div className="space-y-2 mb-4">
                  {(item.checklist || []).map((check) => (
                    <button
                      key={check.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                      onClick={() => handleToggleChecklist(check.id, check.status)}
                    >
                      {check.status === 'done' ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        "text-sm",
                        check.status === 'done' && "line-through text-muted-foreground"
                      )}>
                        {check.title}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Novo item..."
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                  />
                  <Button size="icon" onClick={handleAddChecklistItem}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Copy Tab */}
          <TabsContent value="copy" className="space-y-6">
            <div className="glass-card rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Copy & Roteiro</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGenerateCopy}
                  disabled={isGeneratingCopy}
                >
                  {isGeneratingCopy ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  {isGeneratingCopy ? 'Gerando...' : 'Gerar com IA'}
                </Button>
              </div>

              <div>
                <Label>Hook / Gancho</Label>
                <Input
                  value={formData.hook || ''}
                  onChange={(e) => setFormData({ ...formData, hook: e.target.value })}
                  placeholder="Primeira frase para captar atenção"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>Caption Curta</Label>
                  <Textarea
                    value={formData.caption_short || ''}
                    onChange={(e) => setFormData({ ...formData, caption_short: e.target.value })}
                    placeholder="Versão curta para feed"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Caption Longa</Label>
                  <Textarea
                    value={formData.caption_long || ''}
                    onChange={(e) => setFormData({ ...formData, caption_long: e.target.value })}
                    placeholder="Versão completa com storytelling"
                    rows={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>CTA</Label>
                  <Input
                    value={formData.cta || ''}
                    onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                    placeholder="Ex: Link na bio"
                  />
                </div>
                <div>
                  <Label>Hashtags</Label>
                  <Input
                    value={formData.hashtags || ''}
                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                    placeholder="#squadfilme #filmepremium"
                  />
                </div>
              </div>

              <div>
                <Label>Roteiro</Label>
                <Textarea
                  value={formData.script || ''}
                  onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                  placeholder="Roteiro para gravação..."
                  rows={8}
                />
              </div>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            <ContentAssetsTab contentItemId={item.id} />
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review" className="space-y-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Comentários de Revisão</h3>
              
              <div className="space-y-4 mb-6">
                {(item.comments || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum comentário ainda
                  </p>
                ) : (
                  (item.comments || []).map((comment) => (
                    <div key={comment.id} className="p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-foreground">{comment.author_name || 'Usuário'}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Adicionar comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <Button onClick={handleAddComment}>
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange('editing')}
                  disabled={item.status !== 'review'}
                >
                  Solicitar Ajustes
                </Button>
                <Button 
                  onClick={() => handleStatusChange('approved')}
                  disabled={item.status !== 'review'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Publish Tab */}
          <TabsContent value="publish" className="space-y-6">
            <div className="glass-card rounded-xl p-6 space-y-6">
              <h3 className="text-sm font-medium text-foreground">Publicação</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label>Agendado para</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Link do Post</Label>
                  <Input
                    value={formData.post_url || ''}
                    onChange={(e) => setFormData({ ...formData, post_url: e.target.value })}
                    placeholder="https://instagram.com/p/..."
                  />
                </div>
              </div>

              {item.published_at && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Publicado em {new Date(item.published_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {item.post_url && (
                    <a 
                      href={item.post_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-sm mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver publicação
                    </a>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {item.status === 'approved' && (
                  <Button onClick={() => handleStatusChange('scheduled')}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar
                  </Button>
                )}
                {['approved', 'scheduled'].includes(item.status) && (
                  <Button onClick={() => handleStatusChange('published')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como Publicado
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Copy Confirmation Dialog */}
        <Dialog open={showCopyConfirmDialog} onOpenChange={setShowCopyConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conteúdo existente detectado</DialogTitle>
              <DialogDescription>
                Já existe copy preenchida neste conteúdo. O que deseja fazer com o novo conteúdo gerado pela IA?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button 
                onClick={() => pendingCopyData && applyCopyData(pendingCopyData, 'replace')}
                className="w-full"
              >
                Substituir tudo
              </Button>
              <Button 
                variant="outline"
                onClick={() => pendingCopyData && applyCopyData(pendingCopyData, 'append')}
                className="w-full"
              >
                Adicionar no final
              </Button>
              <Button 
                variant="ghost"
                onClick={() => {
                  setShowCopyConfirmDialog(false);
                  setPendingCopyData(null);
                }}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
