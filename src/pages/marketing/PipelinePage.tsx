import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMarketingStore } from "@/stores/marketingStore";
import { ContentItem, ContentItemStatus, CONTENT_ITEM_STAGES, CONTENT_CHANNELS, CONTENT_FORMATS } from "@/types/marketing";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Search, MoreHorizontal, Calendar, AlertTriangle,
  Link as LinkIcon, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";

function ContentCard({ 
  item, 
  onMove,
  onClick,
}: { 
  item: ContentItem;
  onMove: (status: ContentItemStatus) => void;
  onClick: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const isOverdue = item.due_at && new Date(item.due_at) < new Date() && !['published', 'archived'].includes(item.status);
  const channel = CONTENT_CHANNELS.find(c => c.type === item.channel);

  return (
    <div 
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        e.dataTransfer.setData('contentItemId', item.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={onClick}
      className={`glass-card rounded-xl p-4 cursor-grab active:cursor-grabbing border transition-all hover:scale-[1.02] ${
        isDragging ? 'opacity-50 scale-95 border-primary' : 
        isOverdue ? 'border-l-2 border-l-red-500 border-transparent' : 
        'border-transparent hover:border-primary/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium text-foreground truncate">{item.title}</h4>
          {item.pillar && (
            <p className="text-[9px] text-primary font-medium uppercase tracking-wider mt-0.5">
              {item.pillar.replace('_', ' ')}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {CONTENT_ITEM_STAGES.map((stage) => (
              <DropdownMenuItem 
                key={stage.type} 
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(stage.type);
                }}
                disabled={stage.type === item.status}
              >
                <div className={`w-2 h-2 rounded-full ${stage.color} mr-2`} />
                Mover para {stage.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Channel & Format */}
      <div className="flex items-center gap-2 mb-3">
        {channel && (
          <span className={`text-[9px] px-2 py-0.5 rounded ${channel.color} text-white font-medium`}>
            {channel.name}
          </span>
        )}
        {item.format && (
          <span className="text-[9px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium capitalize">
            {item.format}
          </span>
        )}
      </div>

      {/* Due Date / Scheduled */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        {item.scheduled_at ? (
          <span className="flex items-center gap-1 text-cyan-500">
            <Calendar className="w-3 h-3" />
            {new Date(item.scheduled_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        ) : item.due_at ? (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
            {isOverdue && <AlertTriangle className="w-3 h-3" />}
            <Calendar className="w-3 h-3" />
            {new Date(item.due_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        ) : null}

        {item.post_url && (
          <a 
            href={item.post_url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-primary hover:underline ml-auto"
          >
            <ExternalLink className="w-3 h-3" />
            Ver
          </a>
        )}
      </div>

      {/* Owner */}
      {item.owner_initials && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-[9px] font-medium text-primary">{item.owner_initials}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  stage, 
  items,
  onMove,
  onClick,
}: { 
  stage: typeof CONTENT_ITEM_STAGES[0];
  items: ContentItem[];
  onMove: (itemId: string, status: ContentItemStatus) => void;
  onClick: (item: ContentItem) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const itemId = e.dataTransfer.getData('contentItemId');
    if (itemId) {
      onMove(itemId, stage.type);
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-72 md:w-80"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="glass-card rounded-t-2xl p-4 border-b-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
            <h3 className="font-medium text-foreground text-sm">{stage.name}</h3>
          </div>
          <span className="text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className={`glass-card rounded-b-2xl rounded-t-none p-3 space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto custom-scrollbar transition-all ${
        isDragOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''
      }`}>
        {items.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            onMove={(status) => onMove(item.id, status)}
            onClick={() => onClick(item)}
          />
        ))}

        {items.length === 0 && (
          <div className={`text-center py-8 text-muted-foreground rounded-xl transition-all ${
            isDragOver ? 'bg-primary/10 border-2 border-dashed border-primary/30' : ''
          }`}>
            <p className="text-sm font-light">{isDragOver ? 'Solte aqui' : 'Vazio'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const navigate = useNavigate();
  const { 
    contentItems, 
    campaigns,
    fetchContentItems, 
    fetchCampaigns,
    createContentItem,
    updateContentStatus,
    getContentByStatus,
    setSelectedItem,
    contentFilters,
    setContentFilters,
  } = useMarketingStore();

  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string; status: ContentItemStatus } | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [newItem, setNewItem] = useState({
    title: '',
    channel: '' as any,
    format: '' as any,
    pillar: '' as any,
    campaign_id: '',
    due_at: '',
  });

  useEffect(() => {
    fetchContentItems();
    fetchCampaigns();
  }, []);

  const handleCreateItem = async () => {
    if (!newItem.title) {
      toast.error('Título é obrigatório');
      return;
    }

    await createContentItem({
      title: newItem.title,
      channel: newItem.channel || undefined,
      format: newItem.format || undefined,
      pillar: newItem.pillar || undefined,
      campaign_id: newItem.campaign_id || undefined,
      due_at: newItem.due_at || undefined,
      status: 'briefing',
    });

    setNewItem({ title: '', channel: '', format: '', pillar: '', campaign_id: '', due_at: '' });
    setIsNewItemOpen(false);
    toast.success('Conteúdo criado');
  };

  const handleMoveStatus = async (itemId: string, status: ContentItemStatus) => {
    // Check if moving to scheduled requires a date
    if (status === 'scheduled') {
      const item = contentItems.find(i => i.id === itemId);
      if (!item?.scheduled_at) {
        setPendingStatusChange({ id: itemId, status });
        setIsScheduleDialogOpen(true);
        return;
      }
    }

    // Check if moving to published requires URL or confirmation
    if (status === 'published') {
      setPendingStatusChange({ id: itemId, status });
      setIsPublishDialogOpen(true);
      return;
    }

    await updateContentStatus(itemId, status);
    toast.success(`Movido para ${CONTENT_ITEM_STAGES.find(s => s.type === status)?.name}`);
  };

  const handleScheduleConfirm = async () => {
    if (!pendingStatusChange || !scheduleDate) {
      toast.error('Data de agendamento é obrigatória');
      return;
    }

    const store = useMarketingStore.getState();
    await store.updateContentItem(pendingStatusChange.id, { 
      scheduled_at: new Date(scheduleDate).toISOString(),
      status: 'scheduled',
    });
    
    setIsScheduleDialogOpen(false);
    setScheduleDate('');
    setPendingStatusChange(null);
    toast.success('Conteúdo agendado');
  };

  const handlePublishConfirm = async () => {
    if (!pendingStatusChange) return;

    const store = useMarketingStore.getState();
    await store.updateContentItem(pendingStatusChange.id, { 
      post_url: postUrl || undefined,
      published_at: new Date().toISOString(),
      status: 'published',
    });
    
    setIsPublishDialogOpen(false);
    setPostUrl('');
    setPendingStatusChange(null);
    toast.success('Conteúdo publicado!');
  };

  const handleItemClick = (item: ContentItem) => {
    setSelectedItem(item);
    navigate(`/marketing/item/${item.id}`);
  };

  return (
    <DashboardLayout title="Pipeline de Conteúdo">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Pipeline</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {contentItems.length} conteúdos no total
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9 w-[200px]"
                value={contentFilters.search}
                onChange={(e) => setContentFilters({ search: e.target.value })}
              />
            </div>
            <Button onClick={() => setIsNewItemOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Conteúdo
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <ScrollArea className="w-full pb-4">
          <div className="flex gap-4 min-w-max pb-4 px-1">
            {CONTENT_ITEM_STAGES.map((stage) => (
              <KanbanColumn
                key={stage.type}
                stage={stage}
                items={getContentByStatus(stage.type)}
                onMove={handleMoveStatus}
                onClick={handleItemClick}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* New Content Dialog */}
        <Dialog open={isNewItemOpen} onOpenChange={setIsNewItemOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Conteúdo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Ex: Reel Behind the Scenes"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Canal</Label>
                  <Select value={newItem.channel} onValueChange={(v) => setNewItem({ ...newItem, channel: v })}>
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
                  <Select value={newItem.format} onValueChange={(v) => setNewItem({ ...newItem, format: v })}>
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
                <Label>Campanha (opcional)</Label>
                <Select value={newItem.campaign_id} onValueChange={(v) => setNewItem({ ...newItem, campaign_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prazo</Label>
                <Input
                  type="datetime-local"
                  value={newItem.due_at}
                  onChange={(e) => setNewItem({ ...newItem, due_at: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewItemOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateItem}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar Publicação</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label>Data e Hora *</Label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleScheduleConfirm}>Agendar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Publish Dialog */}
        <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar como Publicado</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Cole o link do post publicado (opcional)
              </p>
              <div>
                <Label>Link do Post</Label>
                <Input
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://instagram.com/p/..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handlePublishConfirm}>Confirmar Publicação</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
