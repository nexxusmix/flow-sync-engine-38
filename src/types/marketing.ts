// Marketing & Content Types

export type ContentPillar = 'autoridade' | 'bastidores' | 'cases' | 'oferta' | 'prova_social' | 'educacional';
export type ContentFormat = 'reel' | 'post' | 'carousel' | 'story' | 'short' | 'long' | 'ad' | 'youtube' | 'email';
export type ContentChannel = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'email' | 'site';
export type IdeaStatus = 'backlog' | 'selected' | 'discarded';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended' | 'planning' | 'completed';
export type ContentItemStatus = 'briefing' | 'writing' | 'recording' | 'editing' | 'review' | 'approved' | 'scheduled' | 'published' | 'archived';
export type CreativeStatus = 'draft' | 'in_design' | 'ready' | 'launched' | 'paused';
export type AssetType = 'logo' | 'luts' | 'template' | 'font' | 'photo' | 'video' | 'doc' | 'other';

export interface ContentIdea {
  id: string;
  workspace_id: string;
  title: string;
  hook?: string;
  angle?: string;
  pillar?: ContentPillar;
  format?: ContentFormat;
  channel?: ContentChannel;
  target?: string;
  reference_links?: Record<string, unknown>[];
  notes?: string;
  score: number;
  priority: number;
  status: IdeaStatus;
  ai_generated?: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  objective?: string;
  offer?: string;
  audience?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  kpis?: Record<string, unknown>;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
  content_items_count?: number;
  creatives?: CampaignCreative[];
}

export interface CampaignCreative {
  id: string;
  campaign_id: string;
  title: string;
  format?: string;
  copy?: string;
  hook?: string;
  cta?: string;
  status: CreativeStatus;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  workspace_id: string;
  idea_id?: string;
  project_id?: string;
  campaign_id?: string;
  title: string;
  channel?: ContentChannel;
  format?: ContentFormat;
  pillar?: ContentPillar;
  status: ContentItemStatus;
  owner_id?: string;
  owner_name?: string;
  owner_initials?: string;
  due_at?: string;
  scheduled_at?: string;
  published_at?: string;
  post_url?: string;
  hook?: string;
  caption_short?: string;
  caption_long?: string;
  cta?: string;
  hashtags?: string;
  script?: string;
  notes?: string;
  assets?: string[];
  ai_generated?: boolean;
  created_at: string;
  updated_at: string;
  campaign?: Campaign;
  idea?: ContentIdea;
  comments?: ContentComment[];
  checklist?: ContentChecklist[];
  content_script?: ContentScript;
}

export interface ContentScript {
  id: string;
  idea_id?: string;
  content_item_id?: string;
  script?: string;
  shotlist?: ShotlistItem[];
  caption_variations?: string[];
  hashtags?: string[];
  cta?: string;
  ai_generated?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShotlistItem {
  order: number;
  scene: string;
  duration?: string;
  notes?: string;
}

export interface ContentComment {
  id: string;
  content_item_id: string;
  author_id?: string;
  author_name?: string;
  text: string;
  created_at: string;
}

export interface ContentChecklist {
  id: string;
  content_item_id: string;
  title: string;
  status: 'pending' | 'done';
  created_at: string;
}

export interface BrandKit {
  id: string;
  workspace_id: string;
  account_id?: string;
  name: string;
  tone_of_voice?: string;
  do_list?: string;
  dont_list?: string;
  colors?: ColorItem[];
  fonts?: FontItem[];
  reference_links?: ReferenceLink[];
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ColorItem {
  hex: string;
  name: string;
  usage?: string;
}

export interface FontItem {
  name: string;
  weight: number;
  usage?: string;
}

export interface ReferenceLink {
  url: string;
  title?: string;
}

export interface MarketingAsset {
  id: string;
  workspace_id: string;
  brand_kit_id?: string;
  project_id?: string;
  type: AssetType;
  title: string;
  storage_path?: string;
  public_url?: string;
  file_size?: number;
  mime_type?: string;
  tags?: string[];
  created_at: string;
}

export interface InstagramConnection {
  id: string;
  workspace_id: string;
  ig_username: string;
  ig_user_id?: string;
  access_token?: string;
  token_expires_at?: string;
  connected_at: string;
  updated_at: string;
}

export interface InstagramSnapshot {
  id: string;
  workspace_id: string;
  connection_id?: string;
  profile_data?: InstagramProfile;
  latest_posts?: InstagramPost[];
  insights?: Record<string, unknown>;
  fetched_at: string;
}

export interface InstagramProfile {
  username: string;
  name?: string;
  biography?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

export interface InstagramPost {
  id: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
}

export interface InstagramReference {
  id: string;
  workspace_id: string;
  project_id?: string;
  content_idea_id?: string;
  content_item_id?: string;
  media_id?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
  timestamp?: string;
  tags?: string[];
  note?: string;
  created_at: string;
}

// Content Item Stages for Pipeline
export const CONTENT_ITEM_STAGES: { type: ContentItemStatus; name: string; color: string }[] = [
  { type: 'briefing', name: 'Briefing', color: 'bg-slate-500' },
  { type: 'writing', name: 'Copy/Roteiro', color: 'bg-blue-500' },
  { type: 'recording', name: 'Gravação', color: 'bg-purple-500' },
  { type: 'editing', name: 'Edição', color: 'bg-orange-500' },
  { type: 'review', name: 'Revisão', color: 'bg-amber-500' },
  { type: 'approved', name: 'Aprovado', color: 'bg-emerald-500' },
  { type: 'scheduled', name: 'Agendado', color: 'bg-cyan-500' },
  { type: 'published', name: 'Publicado', color: 'bg-primary' },
];

export const CONTENT_PILLARS: { type: ContentPillar; name: string; color: string }[] = [
  { type: 'autoridade', name: 'Autoridade', color: 'bg-purple-500' },
  { type: 'bastidores', name: 'Bastidores', color: 'bg-amber-500' },
  { type: 'cases', name: 'Cases', color: 'bg-emerald-500' },
  { type: 'oferta', name: 'Oferta', color: 'bg-red-500' },
  { type: 'prova_social', name: 'Prova Social', color: 'bg-blue-500' },
  { type: 'educacional', name: 'Educacional', color: 'bg-cyan-500' },
];

export const CONTENT_FORMATS: { type: ContentFormat; name: string; icon: string }[] = [
  { type: 'reel', name: 'Reel', icon: 'movie' },
  { type: 'post', name: 'Post', icon: 'image' },
  { type: 'carousel', name: 'Carrossel', icon: 'view_carousel' },
  { type: 'story', name: 'Story', icon: 'amp_stories' },
  { type: 'short', name: 'Short', icon: 'video_library' },
  { type: 'long', name: 'Vídeo Longo', icon: 'smart_display' },
  { type: 'ad', name: 'Anúncio', icon: 'ads_click' },
  { type: 'youtube', name: 'YouTube', icon: 'play_circle' },
  { type: 'email', name: 'E-mail', icon: 'mail' },
];

export const CONTENT_CHANNELS: { type: ContentChannel; name: string; icon: string; color: string }[] = [
  { type: 'instagram', name: 'Instagram', icon: 'photo_camera', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { type: 'tiktok', name: 'TikTok', icon: 'music_note', color: 'bg-black' },
  { type: 'youtube', name: 'YouTube', icon: 'play_circle', color: 'bg-red-500' },
  { type: 'linkedin', name: 'LinkedIn', icon: 'work', color: 'bg-blue-600' },
  { type: 'email', name: 'E-mail', icon: 'mail', color: 'bg-slate-500' },
  { type: 'site', name: 'Site', icon: 'language', color: 'bg-primary' },
];

export const ASSET_TYPES: { type: AssetType; name: string; icon: string }[] = [
  { type: 'logo', name: 'Logo', icon: 'badge' },
  { type: 'luts', name: 'LUTs', icon: 'tune' },
  { type: 'template', name: 'Template', icon: 'dashboard' },
  { type: 'font', name: 'Fonte', icon: 'text_fields' },
  { type: 'photo', name: 'Foto', icon: 'photo' },
  { type: 'video', name: 'Vídeo', icon: 'videocam' },
  { type: 'doc', name: 'Documento', icon: 'description' },
  { type: 'other', name: 'Outro', icon: 'folder' },
];

// Filters
export interface ContentFilters {
  search: string;
  channel: ContentChannel | 'all';
  pillar: ContentPillar | 'all';
  format: ContentFormat | 'all';
  status: ContentItemStatus | 'all';
  campaign_id: string;
  dateRange: 'week' | 'month' | 'all';
}

export interface IdeaFilters {
  search: string;
  pillar: ContentPillar | 'all';
  channel: ContentChannel | 'all';
  format: ContentFormat | 'all';
  status: IdeaStatus | 'all';
}

// AI Generation Types
export interface GeneratedIdea {
  title: string;
  hook: string;
  angle: string;
  pillar: ContentPillar;
  format: ContentFormat;
  channel: ContentChannel;
  score: number;
}

export interface GeneratedScript {
  script: string;
  shotlist: ShotlistItem[];
  caption_variations: string[];
  hashtags: string[];
  cta: string;
}
