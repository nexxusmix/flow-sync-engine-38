import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface InstagramPost {
  id: string;
  title: string;
  format: string;
  pillar: string | null;
  objective: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  hook: string | null;
  script: string | null;
  caption_short: string | null;
  caption_medium: string | null;
  caption_long: string | null;
  cta: string | null;
  pinned_comment: string | null;
  hashtags: string[];
  cover_suggestion: string | null;
  carousel_slides: any[];
  story_sequence: any[];
  checklist: any[];
  ai_generated: boolean;
  project_id: string | null;
  campaign_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface InstagramHook {
  id: string;
  hook_text: string;
  category: string | null;
  format: string | null;
  hook_score: number;
  score_breakdown: any;
  times_used: number;
  ai_generated: boolean;
  created_at: string;
}

export interface ProfileConfig {
  id: string;
  profile_handle: string | null;
  profile_name: string | null;
  niche: string | null;
  sub_niche: string | null;
  target_audience: string | null;
  brand_voice: string | null;
  competitors: any[];
  content_pillars: any[];
  posting_frequency: any;
  bio_current: string | null;
  bio_suggestions: any[];
  profile_score: number;
  profile_analysis: any;
  strategic_briefing: any;
  autopilot_enabled: boolean;
}

export interface ProfileSnapshot {
  id: string;
  followers: number;
  following: number;
  posts_count: number;
  avg_engagement: number;
  avg_reach: number;
  best_posting_time: string | null;
  snapshot_date: string;
}

export interface InstagramCampaign {
  id: string;
  name: string;
  objective: string | null;
  target_audience: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  status: string;
  key_messages: any[];
  content_plan: any[];
  kpis: any;
  result_report: any;
  created_at: string;
}

export const POST_STATUSES = [
  { key: 'idea', label: 'Ideia', color: 'bg-muted text-muted-foreground' },
  { key: 'planned', label: 'Planejado', color: 'bg-blue-500/15 text-blue-400' },
  { key: 'in_production', label: 'Em Produção', color: 'bg-amber-500/15 text-amber-400' },
  { key: 'ready', label: 'Pronto', color: 'bg-emerald-500/15 text-emerald-400' },
  { key: 'scheduled', label: 'Agendado', color: 'bg-cyan-500/15 text-cyan-400' },
  { key: 'published', label: 'Publicado', color: 'bg-primary/15 text-primary' },
];

export const PILLARS = [
  { key: 'autoridade', label: 'Autoridade', color: 'hsl(210, 80%, 50%)' },
  { key: 'portfolio', label: 'Portfólio', color: 'hsl(280, 60%, 50%)' },
  { key: 'bastidores', label: 'Bastidores', color: 'hsl(30, 80%, 50%)' },
  { key: 'social_proof', label: 'Social Proof', color: 'hsl(140, 60%, 40%)' },
  { key: 'educacao', label: 'Educação', color: 'hsl(350, 60%, 50%)' },
  { key: 'venda', label: 'Venda', color: 'hsl(45, 90%, 50%)' },
];

export const FORMATS = [
  { key: 'reel', label: 'Reels', icon: 'movie' },
  { key: 'carousel', label: 'Carrossel', icon: 'view_carousel' },
  { key: 'single', label: 'Foto', icon: 'photo_camera' },
  { key: 'story', label: 'Story', icon: 'amp_stories' },
  { key: 'story_sequence', label: 'Sequência Stories', icon: 'slideshow' },
];

// Queries
export function useInstagramPosts() {
  return useQuery({
    queryKey: ['instagram-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_posts')
        .select('*')
        .order('position', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data || []) as InstagramPost[];
    },
  });
}

export function useInstagramHooks() {
  return useQuery({
    queryKey: ['instagram-hooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_hooks')
        .select('*')
        .order('hook_score', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as InstagramHook[];
    },
  });
}

export function useProfileConfig() {
  return useQuery({
    queryKey: ['instagram-profile-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_profile_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ProfileConfig | null;
    },
  });
}

export function useProfileSnapshots() {
  return useQuery({
    queryKey: ['instagram-profile-snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_profile_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as ProfileSnapshot[];
    },
  });
}

export function useInstagramCampaigns() {
  return useQuery({
    queryKey: ['instagram-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as InstagramCampaign[];
    },
  });
}

// Mutations
export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Partial<InstagramPost>) => {
      const { data, error } = await supabase
        .from('instagram_posts')
        .insert(post as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instagram-posts'] });
      toast.success('Post criado');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InstagramPost> & { id: string }) => {
      const { error } = await supabase
        .from('instagram_posts')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['instagram-posts'] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instagram_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instagram-posts'] });
      toast.success('Post removido');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSaveProfileConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<ProfileConfig>) => {
      const { data: existing } = await supabase
        .from('instagram_profile_config')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('instagram_profile_config')
          .update(config as any)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('instagram_profile_config')
          .insert(config as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instagram-profile-config'] });
      toast.success('Configuração salva');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSaveSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (snapshot: Partial<ProfileSnapshot>) => {
      const { error } = await supabase
        .from('instagram_profile_snapshots')
        .insert(snapshot as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instagram-profile-snapshots'] });
      toast.success('Snapshot salvo');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSaveHooks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hooks: Partial<InstagramHook>[]) => {
      const { error } = await supabase
        .from('instagram_hooks')
        .insert(hooks as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instagram-hooks'] });
      toast.success('Hooks salvos');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// AI Actions
export function useInstagramAI() {
  return useMutation({
    mutationFn: async ({ action, data }: { action: string; data: any }) => {
      const { data: result, error } = await supabase.functions.invoke('instagram-ai', {
        body: { action, data },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result?.result;
    },
    onError: (e: any) => toast.error(e.message || 'Erro na IA'),
  });
}
