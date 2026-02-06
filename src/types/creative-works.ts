// Creative Works System Types

export type CreativeWorkType = 'script' | 'storyboard' | 'identity' | 'motion' | 'campaign_pack' | 'full_package';
export type CreativeWorkStatus = 'draft' | 'in_production' | 'review' | 'approved' | 'archived';
export type CreativeSource = 'manual' | 'ai' | 'hybrid';
export type CreativeBlockType = 
  | 'brief'
  | 'narrative_script'
  | 'storyboard'
  | 'storyboard_images'
  | 'shotlist'
  | 'moodboard'
  | 'visual_identity'
  | 'motion_direction'
  | 'lettering'
  | 'copy_variations';
export type CreativeBlockStatus = 'empty' | 'draft' | 'ready' | 'approved';

// Main creative work entity
export interface CreativeWork {
  id: string;
  workspace_id: string;
  title: string;
  type: CreativeWorkType;
  status: CreativeWorkStatus;
  source: CreativeSource;
  client_id?: string | null;
  project_id?: string | null;
  proposal_id?: string | null;
  campaign_id?: string | null;
  brand_kit_id?: string | null;
  parent_work_id?: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

// Creative block entity
export interface CreativeBlock {
  id: string;
  work_id: string;
  type: CreativeBlockType;
  title?: string | null;
  content: Record<string, unknown>;
  source: CreativeSource;
  version: number;
  order_index: number;
  status: CreativeBlockStatus;
  ai_run_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Block version for history
export interface CreativeBlockVersion {
  id: string;
  block_id: string;
  version: number;
  content: Record<string, unknown>;
  source: CreativeSource;
  ai_run_id?: string | null;
  created_by?: string | null;
  created_at: string;
}

// Storyboard frame for images
export interface StoryboardFrame {
  id: string;
  work_id: string;
  block_id?: string | null;
  scene_index: number;
  prompt?: string | null;
  image_url?: string | null;
  storage_path?: string | null;
  status: 'pending' | 'generating' | 'ready' | 'error';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================
// Block Content Structures
// ============================================

export interface NarrativeScriptContent {
  logline: string;
  premise: string;
  tone: string;
  theme: string;
  structure: {
    act1: string;
    act2: string;
    act3: string;
  };
  scenes?: Array<{
    number: number;
    title: string;
    description: string;
    dialogue?: string;
    notes?: string;
  }>;
  full_script?: string;
}

export interface StoryboardContent {
  scenes: Array<{
    number: number;
    title: string;
    description: string;
    action: string;
    dialogue?: string;
    camera: string;
    duration_sec: number;
    emotion: string;
    audio?: string;
    image_prompt?: string;
  }>;
}

export interface MoodboardContent {
  theme: string;
  color_palette: string[];
  visual_style: string;
  keywords: string[];
  reference_urls: string[];
  do_visual: string[];
  dont_visual: string[];
}

export interface ShotlistContent {
  shots: Array<{
    order: number;
    scene: string;
    camera: string;
    movement: string;
    duration: string;
    equipment?: string;
    notes?: string;
    priority: 'essential' | 'important' | 'nice_to_have';
  }>;
}

export interface CopyVariationsContent {
  variations: Array<{
    text: string;
    tone: string;
    channel: string;
    length: 'short' | 'medium' | 'long';
  }>;
  hashtags: string[];
  cta: string;
}

export interface VisualIdentityContent {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutrals: string[];
  };
  typography: {
    heading: string;
    body: string;
    accent?: string;
  };
  logo_usage: string[];
  patterns?: string[];
  do_list: string[];
  dont_list: string[];
}

export interface MotionDirectionContent {
  style: string;
  transitions: string[];
  rhythm: string;
  effects: string[];
  references: string[];
  pacing: 'slow' | 'medium' | 'fast' | 'dynamic';
}

export interface LetteringContent {
  fonts: Array<{
    name: string;
    usage: string;
    weight: string;
  }>;
  hierarchy: string;
  usage_rules: string[];
  examples: string[];
}

export interface BriefContent {
  objective: string;
  audience: string;
  offer?: string;
  restrictions?: string;
  tone: string;
  references: string[];
  deliverables: string[];
  deadline?: string;
}

// ============================================
// Block Metadata
// ============================================

export interface BlockTypeInfo {
  type: CreativeBlockType;
  label: string;
  icon: string;
  description: string;
  order: number;
}

export const BLOCK_TYPES: BlockTypeInfo[] = [
  { type: 'brief', label: 'Brief', icon: 'FileText', description: 'Briefing do projeto', order: 0 },
  { type: 'narrative_script', label: 'Roteiro Narrativo', icon: 'ScrollText', description: 'Roteiro estruturado com logline, premissa e atos', order: 1 },
  { type: 'storyboard', label: 'Storyboard', icon: 'LayoutGrid', description: 'Cenas visuais com descrições e direção', order: 2 },
  { type: 'storyboard_images', label: 'Imagens do Storyboard', icon: 'Image', description: 'Imagens geradas para cada cena', order: 3 },
  { type: 'shotlist', label: 'Shotlist', icon: 'Video', description: 'Lista técnica de planos e equipamentos', order: 4 },
  { type: 'moodboard', label: 'Moodboard / Referências', icon: 'Palette', description: 'Direção visual e referências', order: 5 },
  { type: 'visual_identity', label: 'Identidade Visual', icon: 'Paintbrush', description: 'Cores, tipografia e guidelines', order: 6 },
  { type: 'motion_direction', label: 'Motion / Direção', icon: 'Clapperboard', description: 'Direção de movimento e ritmo', order: 7 },
  { type: 'lettering', label: 'Lettering / Tipografia', icon: 'Type', description: 'Fontes e hierarquia tipográfica', order: 8 },
  { type: 'copy_variations', label: 'Copy / Legendas', icon: 'MessageSquare', description: 'Variações de texto e hashtags', order: 9 },
];

export const WORK_STATUS_LABELS: Record<CreativeWorkStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground' },
  in_production: { label: 'Em Produção', color: 'bg-blue-500/20 text-blue-600' },
  review: { label: 'Em Revisão', color: 'bg-amber-500/20 text-amber-600' },
  approved: { label: 'Aprovado', color: 'bg-green-500/20 text-green-600' },
  archived: { label: 'Arquivado', color: 'bg-gray-500/20 text-gray-600' },
};

export const BLOCK_STATUS_LABELS: Record<CreativeBlockStatus, { label: string; color: string }> = {
  empty: { label: 'Vazio', color: 'bg-muted text-muted-foreground' },
  draft: { label: 'Rascunho', color: 'bg-amber-500/20 text-amber-600' },
  ready: { label: 'Pronto', color: 'bg-green-500/20 text-green-600' },
  approved: { label: 'Aprovado', color: 'bg-primary/20 text-primary' },
};
