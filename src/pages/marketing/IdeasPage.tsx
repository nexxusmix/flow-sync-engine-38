import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMarketingStore } from "@/stores/marketingStore";
import { ContentIdea, CONTENT_PILLARS, CONTENT_CHANNELS, CONTENT_FORMATS } from "@/types/marketing";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Search, Lightbulb, Sparkles, ArrowRight,
  Star, MoreHorizontal, Trash2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { generateIdeas, isAIError } from "@/lib/ai";

function IdeaCard({ 
  idea, 
  onPromote,
  onDelete,
}: { 
  idea: ContentIdea;
  onPromote: () => void;
  onDelete: () => void;
}) {
  const pillar = CONTENT_PILLARS.find(p => p.type === idea.pillar);
  const channel = CONTENT_CHANNELS.find(c => c.type === idea.channel);
  const format = CONTENT_FORMATS.find(f => f.type === idea.format);

  return (
    <motion.div
      className={cn(
        "glass-card rounded-xl p-5 border border-transparent",
        "hover:border-primary/20 transition-all cursor-pointer group"
      )}
      whileHover={{ scale: 1.01, y: -2 }}
      layout
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {idea.score > 0 && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs font-medium">{idea.score}</span>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onPromote}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Promover para Produção
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-500">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="text-sm font-medium text-foreground mb-2 line-clamp-2">
        {idea.title}
      </h3>

      {idea.hook && (
        <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2 italic">
          "{idea.hook}"
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {pillar && (
          <span className={cn("text-[9px] px-2 py-0.5 rounded font-medium", pillar.color, "text-white")}>
            {pillar.name}
          </span>
        )}
        {channel && (
          <span className="text-[9px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
            {channel.name}
          </span>
        )}
        {format && (
          <span className="text-[9px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
            {format.name}
          </span>
        )}
      </div>

      {/* Promote Button */}
      <Button 
        size="sm" 
        className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onPromote}
      >
        <ArrowRight className="w-4 h-4 mr-2" />
        Produzir
      </Button>
    </motion.div>
  );
}

export default function IdeasPage() {
  const navigate = useNavigate();
  const { 
    ideas, 
    fetchIdeas,
    createIdea,
    deleteIdea,
    promoteIdeaToContent,
    ideaFilters,
    setIdeaFilters,
    getFilteredIdeas,
  } = useMarketingStore();

  const [isNewIdeaOpen, setIsNewIdeaOpen] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: '',
    hook: '',
    pillar: '' as any,
    format: '' as any,
    channel: '' as any,
    target: '',
    notes: '',
  });

  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    
    try {
      const result = await generateIdeas({
        pillar: ideaFilters.pillar,
        channel: ideaFilters.channel,
        format: ideaFilters.format,
      });

      if (isAIError(result)) {
        if (result.status === 429) {
          toast.error('Limite de requisições excedido. Tente novamente em alguns segundos.');
        } else if (result.status === 402) {
          toast.error('Créditos insuficientes. Adicione créditos para continuar.');
        } else {
          toast.error(result.error || 'Erro ao gerar ideias');
        }
        return;
      }

      // Save each generated idea to the database
      const ideas = result.ideas || [];
      let savedCount = 0;
      
      for (const idea of ideas) {
        await createIdea({
          title: idea.title,
          hook: idea.hook,
          pillar: idea.pillar as any,
          channel: idea.channel as any,
          format: idea.format as any,
          target: idea.target,
          score: idea.score,
          status: 'backlog',
          ai_generated: true,
        });
        savedCount++;
      }

      // Refetch to update the list
      await fetchIdeas();
      
      toast.success(`${savedCount} ideias geradas e salvas com sucesso!`);
    } catch (err) {
      console.error('handleGenerateIdeas error:', err);
      toast.error('Erro ao gerar ideias. Tente novamente.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const filteredIdeas = getFilteredIdeas();

  const handleCreateIdea = async () => {
    if (!newIdea.title) {
      toast.error('Título é obrigatório');
      return;
    }

    await createIdea({
      title: newIdea.title,
      hook: newIdea.hook || undefined,
      pillar: newIdea.pillar || undefined,
      format: newIdea.format || undefined,
      channel: newIdea.channel || undefined,
      target: newIdea.target || undefined,
      notes: newIdea.notes || undefined,
      status: 'backlog',
    });

    setNewIdea({ title: '', hook: '', pillar: '', format: '', channel: '', target: '', notes: '' });
    setIsNewIdeaOpen(false);
    toast.success('Ideia salva no banco');
  };

  const handlePromote = async (ideaId: string) => {
    const item = await promoteIdeaToContent(ideaId);
    if (item) {
      toast.success('Ideia promovida para produção!');
      navigate(`/marketing/item/${item.id}`);
    }
  };

  const handleDelete = async (ideaId: string) => {
    await deleteIdea(ideaId);
    toast.success('Ideia removida');
  };

  return (
    <DashboardLayout title="Banco de Ideias">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Banco de Ideias</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredIdeas.length} ideias disponíveis
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleGenerateIdeas}
              disabled={isGeneratingIdeas}
            >
              {isGeneratingIdeas ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGeneratingIdeas ? 'Gerando...' : 'Gerar 10 Ideias com IA'}
            </Button>
            <Button onClick={() => setIsNewIdeaOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Ideia
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ideias..."
              className="pl-9"
              value={ideaFilters.search}
              onChange={(e) => setIdeaFilters({ search: e.target.value })}
            />
          </div>
          
          <Select 
            value={ideaFilters.pillar} 
            onValueChange={(v: any) => setIdeaFilters({ pillar: v })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Pilar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pilares</SelectItem>
              {CONTENT_PILLARS.map((p) => (
                <SelectItem key={p.type} value={p.type}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={ideaFilters.channel} 
            onValueChange={(v: any) => setIdeaFilters({ channel: v })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              {CONTENT_CHANNELS.map((c) => (
                <SelectItem key={c.type} value={c.type}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={ideaFilters.format} 
            onValueChange={(v: any) => setIdeaFilters({ format: v })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os formatos</SelectItem>
              {CONTENT_FORMATS.map((f) => (
                <SelectItem key={f.type} value={f.type}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onPromote={() => handlePromote(idea.id)}
              onDelete={() => handleDelete(idea.id)}
            />
          ))}
        </div>

        {filteredIdeas.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhuma ideia encontrada</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsNewIdeaOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeira ideia
            </Button>
          </div>
        )}

        {/* New Idea Dialog */}
        <Dialog open={isNewIdeaOpen} onOpenChange={setIsNewIdeaOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Ideia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={newIdea.title}
                  onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                  placeholder="Ex: Behind the scenes do set"
                />
              </div>
              <div>
                <Label>Hook / Gancho</Label>
                <Input
                  value={newIdea.hook}
                  onChange={(e) => setNewIdea({ ...newIdea, hook: e.target.value })}
                  placeholder="Ex: 'Como filmamos X em apenas 2 horas'"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Pilar</Label>
                  <Select value={newIdea.pillar} onValueChange={(v) => setNewIdea({ ...newIdea, pillar: v })}>
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
                <div>
                  <Label>Canal</Label>
                  <Select value={newIdea.channel} onValueChange={(v) => setNewIdea({ ...newIdea, channel: v })}>
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
                  <Select value={newIdea.format} onValueChange={(v) => setNewIdea({ ...newIdea, format: v })}>
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
              </div>
              <div>
                <Label>Público Alvo</Label>
                <Input
                  value={newIdea.target}
                  onChange={(e) => setNewIdea({ ...newIdea, target: e.target.value })}
                  placeholder="Ex: Empresários que querem produzir vídeos"
                />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={newIdea.notes}
                  onChange={(e) => setNewIdea({ ...newIdea, notes: e.target.value })}
                  placeholder="Anotações, referências..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewIdeaOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateIdea}>Salvar Ideia</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
