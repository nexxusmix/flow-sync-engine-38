import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, ScrollText, LayoutGrid, Image, Video, Palette, 
  Paintbrush, Clapperboard, Type, MessageSquare, Plus, ChevronDown,
  Circle, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { 
  CreativeWork, 
  CreativeBlock, 
  CreativeBlockType, 
  CreativeBlockStatus,
  BLOCK_TYPES,
  WORK_STATUS_LABELS,
  BLOCK_STATUS_LABELS 
} from '@/types/creative-works';

const BLOCK_ICONS: Record<CreativeBlockType, React.ReactNode> = {
  brief: <FileText className="w-4 h-4" />,
  narrative_script: <ScrollText className="w-4 h-4" />,
  storyboard: <LayoutGrid className="w-4 h-4" />,
  storyboard_images: <Image className="w-4 h-4" />,
  shotlist: <Video className="w-4 h-4" />,
  moodboard: <Palette className="w-4 h-4" />,
  visual_identity: <Paintbrush className="w-4 h-4" />,
  motion_direction: <Clapperboard className="w-4 h-4" />,
  lettering: <Type className="w-4 h-4" />,
  copy_variations: <MessageSquare className="w-4 h-4" />,
};

const BLOCK_LABELS: Record<CreativeBlockType, string> = {
  brief: 'Brief',
  narrative_script: 'Roteiro Narrativo',
  storyboard: 'Storyboard',
  storyboard_images: 'Imagens',
  shotlist: 'Shotlist',
  moodboard: 'Moodboard',
  visual_identity: 'Identidade Visual',
  motion_direction: 'Motion / Direção',
  lettering: 'Tipografia',
  copy_variations: 'Copy / Legendas',
};

const BLOCK_ORDER: CreativeBlockType[] = [
  'brief',
  'narrative_script',
  'storyboard',
  'storyboard_images',
  'shotlist',
  'moodboard',
  'visual_identity',
  'motion_direction',
  'lettering',
  'copy_variations',
];

interface StudioSidebarProps {
  work: CreativeWork | null;
  blocks: CreativeBlock[];
  activeBlock: CreativeBlockType;
  onBlockSelect: (type: CreativeBlockType) => void;
  onWorkUpdate: (updates: Partial<CreativeWork>) => void;
  onTitleChange: (title: string) => void;
}

export function StudioSidebar({
  work,
  blocks,
  activeBlock,
  onBlockSelect,
  onWorkUpdate,
  onTitleChange,
}: StudioSidebarProps) {
  const [title, setTitle] = useState(work?.title || 'Novo Trabalho Criativo');

  // Fetch clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ['crm-contacts-select'],
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_contacts')
        .select('id, name')
        .order('name');
      return (data || []) as Array<{ id: string; name: string }>;
    },
  });

  // Fetch projects for dropdown
  const { data: projects } = useQuery({
    queryKey: ['projects-select', work?.client_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      return (data || []) as Array<{ id: string; name: string }>;
    },
  });

  // Fetch campaigns for dropdown
  const { data: campaigns } = useQuery({
    queryKey: ['campaigns-select'],
    queryFn: async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('id, name')
        .order('name');
      return (data || []) as Array<{ id: string; name: string }>;
    },
  });

  useEffect(() => {
    if (work?.title) {
      setTitle(work.title);
    }
  }, [work?.title]);

  const handleTitleBlur = () => {
    if (title !== work?.title) {
      onTitleChange(title);
    }
  };

  const getBlockStatus = (type: CreativeBlockType): CreativeBlockStatus => {
    const block = blocks.find(b => b.type === type);
    return block?.status || 'empty';
  };

  const getStatusIcon = (status: CreativeBlockStatus) => {
    switch (status) {
      case 'empty':
        return <Circle className="w-3 h-3 text-muted-foreground" />;
      case 'draft':
        return <AlertCircle className="w-3 h-3 text-amber-500" />;
      case 'ready':
      case 'approved':
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      default:
        return <Circle className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const workStatusColor = work?.status === 'draft' 
    ? 'bg-muted text-muted-foreground'
    : work?.status === 'in_production'
    ? 'bg-primary/20 text-primary'
    : work?.status === 'approved'
    ? 'bg-accent text-accent-foreground'
    : 'bg-muted text-muted-foreground';

  return (
    <div className="w-72 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="font-semibold text-lg border-none p-0 h-auto focus-visible:ring-0"
            placeholder="Título do trabalho"
          />
          <Badge variant="secondary" className={cn("text-xs", workStatusColor)}>
            {work?.status === 'draft' ? 'Rascunho' : 
             work?.status === 'in_production' ? 'Em Produção' :
             work?.status === 'approved' ? 'Aprovado' : 'Rascunho'}
          </Badge>
        </div>
      </div>

      {/* Context Selectors */}
      <div className="p-4 space-y-3 border-b">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Cliente</Label>
          <Select
            value={work?.client_id || ''}
            onValueChange={(value) => onWorkUpdate({ client_id: value || null })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Selecionar cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Projeto</Label>
          <Select
            value={work?.project_id || ''}
            onValueChange={(value) => onWorkUpdate({ project_id: value || null })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Selecionar projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Campanha</Label>
          <Select
            value={work?.campaign_id || ''}
            onValueChange={(value) => onWorkUpdate({ campaign_id: value || null })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Selecionar campanha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhuma</SelectItem>
              {campaigns?.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Block Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Blocos Criativos
          </div>
          {BLOCK_ORDER.map((type) => {
            const status = getBlockStatus(type);
            const isActive = activeBlock === type;
            
            return (
              <button
                key={type}
                onClick={() => onBlockSelect(type)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  "hover:bg-accent/50",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                <span className="text-muted-foreground">
                  {BLOCK_ICONS[type]}
                </span>
                <span className="flex-1 text-left">{BLOCK_LABELS[type]}</span>
                {getStatusIcon(status)}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
