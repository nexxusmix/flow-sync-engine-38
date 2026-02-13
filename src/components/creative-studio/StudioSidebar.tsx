/**
 * StudioSidebar — SolaFlux Holographic Design
 * Glass panels, Space Grotesk, cyan accent, status dots
 */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Circle, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type {
  CreativeWork,
  CreativeBlock,
  CreativeBlockType,
  CreativeBlockStatus,
} from '@/types/creative-works';

const BLOCK_ICONS: Record<CreativeBlockType, string> = {
  brief: 'description',
  narrative_script: 'auto_stories',
  storyboard: 'grid_view',
  storyboard_images: 'photo_library',
  shotlist: 'videocam',
  moodboard: 'mood',
  visual_identity: 'brush',
  motion_direction: 'movie_filter',
  lettering: 'format_size',
  copy_variations: 'chat',
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
  'brief', 'narrative_script', 'storyboard', 'storyboard_images',
  'shotlist', 'moodboard', 'visual_identity', 'motion_direction',
  'lettering', 'copy_variations',
];

export type StudioNavItem = CreativeBlockType | 'templates';

interface StudioSidebarProps {
  work: CreativeWork | null;
  blocks: CreativeBlock[];
  activeBlock: StudioNavItem;
  onBlockSelect: (type: StudioNavItem) => void;
  onWorkUpdate: (updates: Partial<CreativeWork>) => void;
  onTitleChange: (title: string) => void;
}

export function StudioSidebar({
  work, blocks, activeBlock, onBlockSelect, onWorkUpdate, onTitleChange,
}: StudioSidebarProps) {
  const [title, setTitle] = useState(work?.title || 'Novo Trabalho Criativo');

  const { data: clients } = useQuery({
    queryKey: ['crm-contacts-select'],
    queryFn: async () => {
      const { data } = await supabase.from('crm_contacts').select('id, name').order('name');
      return (data || []) as Array<{ id: string; name: string }>;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-select', work?.client_id],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name').order('name');
      return (data || []) as Array<{ id: string; name: string }>;
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns-select'],
    queryFn: async () => {
      const { data } = await supabase.from('campaigns').select('id, name').order('name');
      return (data || []) as Array<{ id: string; name: string }>;
    },
  });

  useEffect(() => {
    if (work?.title) setTitle(work.title);
  }, [work?.title]);

  const handleTitleBlur = () => {
    if (title !== work?.title) onTitleChange(title);
  };

  const getBlockStatus = (type: CreativeBlockType): CreativeBlockStatus => {
    const block = blocks.find(b => b.type === type);
    return block?.status || 'empty';
  };

  const getStatusDot = (status: CreativeBlockStatus) => {
    switch (status) {
      case 'empty':
        return <Circle className="w-3 h-3 text-white/15" strokeWidth={1.5} />;
      case 'draft':
        return <AlertCircle className="w-3 h-3 text-amber-500/60" strokeWidth={1.5} />;
      case 'ready':
      case 'approved':
        return <CheckCircle2 className="w-3 h-3 text-[hsl(195,100%,50%)]" strokeWidth={1.5} />;
      default:
        return <Circle className="w-3 h-3 text-white/15" strokeWidth={1.5} />;
    }
  };

  const statusLabel = work?.status === 'draft' ? 'RASCUNHO'
    : work?.status === 'in_production' ? 'EM PRODUÇÃO'
    : work?.status === 'approved' ? 'APROVADO' : 'RASCUNHO';

  return (
    <div
      className="w-[340px] border-r border-[rgba(0,156,202,0.08)] bg-[#050507] flex flex-col h-full shrink-0"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Header: Title + Status */}
      <div className="p-5 border-b border-[rgba(0,156,202,0.08)] space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full bg-transparent text-white/90 text-base font-medium border-none outline-none placeholder:text-white/20"
          placeholder="Título do trabalho"
        />
        <span className="inline-block text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 rounded border border-white/10 text-white/40">
          {statusLabel}
        </span>
      </div>

      {/* Context Selectors */}
      <div className="p-5 space-y-3 border-b border-[rgba(0,156,202,0.08)]">
        {/* Cliente */}
        <div className="space-y-1">
          <label className="text-[10px] text-white/25 uppercase tracking-[0.1em]">Cliente</label>
          <select
            value={work?.client_id || 'none'}
            onChange={(e) => onWorkUpdate({ client_id: e.target.value === 'none' ? null : e.target.value } as any)}
            className="w-full h-9 bg-[rgba(255,255,255,0.03)] border border-[rgba(0,156,202,0.1)] rounded px-3 text-sm text-white/60 outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors appearance-none"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <option value="none">Nenhum</option>
            {clients?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Projeto */}
        <div className="space-y-1">
          <label className="text-[10px] text-white/25 uppercase tracking-[0.1em]">Projeto</label>
          <select
            value={work?.project_id || 'none'}
            onChange={(e) => onWorkUpdate({ project_id: e.target.value === 'none' ? null : e.target.value } as any)}
            className="w-full h-9 bg-[rgba(255,255,255,0.03)] border border-[rgba(0,156,202,0.1)] rounded px-3 text-sm text-white/60 outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors appearance-none"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <option value="none">Nenhum</option>
            {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Campanha */}
        <div className="space-y-1">
          <label className="text-[10px] text-white/25 uppercase tracking-[0.1em]">Campanha</label>
          <select
            value={work?.campaign_id || 'none'}
            onChange={(e) => onWorkUpdate({ campaign_id: e.target.value === 'none' ? null : e.target.value } as any)}
            className="w-full h-9 bg-[rgba(255,255,255,0.03)] border border-[rgba(0,156,202,0.1)] rounded px-3 text-sm text-white/60 outline-none focus:border-[rgba(0,156,202,0.3)] transition-colors appearance-none"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <option value="none">Nenhuma</option>
            {campaigns?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Block Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-0.5">
          <div className="px-3 py-2 text-[10px] font-normal text-white/25 uppercase tracking-[0.15em]">
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
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-150 group",
                  isActive
                    ? "bg-[rgba(0,156,202,0.08)] border border-[rgba(0,156,202,0.2)]"
                    : "border border-transparent hover:bg-white/[0.02]"
                )}
              >
                <span className={cn(
                  "material-symbols-outlined text-lg",
                  isActive ? "text-[hsl(195,100%,55%)]" : "text-white/20"
                )} style={{ fontVariationSettings: "'wght' 200" }}>
                  {BLOCK_ICONS[type]}
                </span>
                <span className={cn(
                  "flex-1 text-left text-[13px] font-normal",
                  isActive ? "text-white/80" : "text-white/40"
                )}>
                  {BLOCK_LABELS[type]}
                </span>
                {getStatusDot(status)}
              </button>
            );
          })}

          <div className="my-3 border-t border-[rgba(0,156,202,0.06)]" />

          <div className="px-3 py-2 text-[10px] font-normal text-white/25 uppercase tracking-[0.15em]">
            Ferramentas
          </div>
          <button
            onClick={() => onBlockSelect('templates')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-150 group",
              activeBlock === 'templates'
                ? "bg-[rgba(0,156,202,0.08)] border border-[rgba(0,156,202,0.2)]"
                : "border border-transparent hover:bg-white/[0.02]"
            )}
          >
            <span className={cn(
              "material-symbols-outlined text-lg",
              activeBlock === 'templates' ? "text-[hsl(195,100%,55%)]" : "text-white/20"
            )} style={{ fontVariationSettings: "'wght' 200" }}>
              category
            </span>
            <span className={cn(
              "flex-1 text-left text-[13px] font-normal",
              activeBlock === 'templates' ? "text-white/80" : "text-white/40"
            )}>
              Templates Figma
            </span>
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-[rgba(0,156,202,0.2)] text-[hsl(195,100%,55%)]">
              Novo
            </span>
          </button>
        </div>
      </ScrollArea>
    </div>
  );
}
