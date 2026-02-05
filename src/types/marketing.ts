// Marketing & Content Types

export type ContentPillar = 'autoridade' | 'bastidores' | 'cases' | 'oferta' | 'prova_social' | 'educacional';
export type ContentFormat = 'reel' | 'post' | 'carousel' | 'story' | 'short' | 'long' | 'ad' | 'youtube' | 'email';
export type ContentChannel = 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'email' | 'site';
export type IdeaStatus = 'backlog' | 'selected' | 'discarded';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended';
export type ContentItemStatus = 'briefing' | 'writing' | 'recording' | 'editing' | 'review' | 'approved' | 'scheduled' | 'published' | 'archived';

export interface ContentIdea {
  id: string;
  workspace_id: string;
  title: string;
  hook?: string;
  pillar?: ContentPillar;
  format?: ContentFormat;
  channel?: ContentChannel;
  target?: string;
  reference_links?: Record<string, unknown>[];
  notes?: string;
  score: number;
  status: IdeaStatus;
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
  // Computed
  content_items_count?: number;
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
  created_at: string;
  updated_at: string;
  // Relations
  campaign?: Campaign;
  idea?: ContentIdea;
  comments?: ContentComment[];
  checklist?: ContentChecklist[];
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
