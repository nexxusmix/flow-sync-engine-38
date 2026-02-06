// Creative Studio Types

export type BriefStatus = 'draft' | 'processing' | 'ready' | 'archived';
export type PackageType = 'full' | 'storyboard' | 'campaign' | 'weekly' | 'images_only';
export type OutputType = 'concept' | 'script' | 'storyboard' | 'shotlist' | 'moodboard' | 'campaign' | 'weekly_plan' | 'pdf_pack';
export type ImagePurpose = 'storyboard_frame' | 'mood_tile' | 'key_visual';

export interface CreativeBrief {
  id: string;
  workspace_id: string;
  account_id?: string;
  project_id?: string;
  brand_kit_id?: string;
  title: string;
  input_text?: string;
  input_files?: { path: string; type: string; name: string }[];
  extracted_context?: ExtractedContext;
  package_type: PackageType;
  objective?: string;
  delivery_type?: string;
  status: BriefStatus;
  created_at: string;
  updated_at: string;
}

export interface ExtractedContext {
  objetivo?: string;
  publico?: string;
  oferta?: string;
  restricoes?: string;
  tom?: string;
  referencias?: string[];
}

export interface CreativeOutput {
  id: string;
  brief_id: string;
  type: OutputType;
  format?: string;
  content: ConceptContent | ScriptContent | MoodboardContent | ShotlistItem[] | Record<string, unknown>;
  version: number;
  created_at: string;
}

export interface ConceptContent {
  premissa: string;
  promessa: string;
  tom: string;
  tema: string;
  metafora_central: string;
  big_idea: string;
  headline: string;
  subheadline: string;
  argumento_comercial: string;
}

export interface ScriptContent {
  hook: string;
  desenvolvimento: string;
  cta: string;
  duracao_estimada: string;
}

export interface MoodboardContent {
  direcao_de_arte: string;
  paleta: string[];
  referencias: string[];
  materiais_texturas: string;
  figurino: string;
  props: string;
  arquitetura_clima: string;
  do_visual: string[];
  dont_visual: string[];
  mood_prompts: string[];
}

export interface StoryboardScene {
  id: string;
  brief_id: string;
  output_id?: string;
  scene_number: number;
  title?: string;
  description?: string;
  emotion?: string;
  camera?: string;
  duration_sec?: number;
  audio?: string;
  notes?: string;
  image_url?: string;
  image_prompt?: string;
  created_at: string;
}

export interface ShotlistItem {
  plano: string;
  descricao: string;
  lente_sugerida: string;
  ambiente: string;
  luz: string;
  prioridade: string;
}

export interface GeneratedImage {
  id: string;
  workspace_id: string;
  account_id?: string;
  project_id?: string;
  brief_id?: string;
  scene_id?: string;
  purpose: ImagePurpose;
  prompt: string;
  storage_path?: string;
  public_url?: string;
  width?: number;
  height?: number;
  created_at: string;
}

// API Response Types
export interface CreativePackageResponse {
  briefId: string;
  concept: ConceptContent;
  script: ScriptContent;
  storyboard: Array<{
    scene_number: number;
    title: string;
    description: string;
    emotion: string;
    camera: string;
    duration_sec: number;
    audio: string;
    image_prompt: string;
  }>;
  shotlist: ShotlistItem[];
  moodboard: MoodboardContent;
}

export interface GenerateImageResponse {
  success: boolean;
  imageUrl: string;
  storagePath?: string;
  prompt: string;
}

// Package Type Labels
export const PACKAGE_TYPES: { type: PackageType; name: string; description: string }[] = [
  { type: 'full', name: 'Pacote Completo', description: 'Conceito + Roteiro + Storyboard + Moodboard' },
  { type: 'storyboard', name: 'Storyboard + Roteiro', description: 'Foco em pré-produção visual' },
  { type: 'campaign', name: 'Campanha', description: 'Peças de campanha e variações' },
  { type: 'weekly', name: 'Conteúdo Semanal', description: '7 dias de pauta' },
  { type: 'images_only', name: 'Apenas Imagens', description: 'Gerar visuais para moodboard' },
];

export const OUTPUT_TYPE_LABELS: Record<OutputType, string> = {
  concept: 'Conceito Narrativo',
  script: 'Roteiro',
  storyboard: 'Storyboard',
  shotlist: 'Shotlist',
  moodboard: 'Moodboard',
  campaign: 'Campanha',
  weekly_plan: 'Plano Semanal',
  pdf_pack: 'PDF Pack',
};
