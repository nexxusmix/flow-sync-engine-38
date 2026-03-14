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
  post_url: string | null;
  thumbnail_url: string | null;
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
  avatar_url: string | null;
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
  { key: 'planned', label: 'Planejado', color: 'bg-primary/15 text-primary' },
  { key: 'in_production', label: 'Em Produção', color: 'bg-primary/10 text-primary/70' },
  { key: 'ready', label: 'Pronto', color: 'bg-primary/20 text-primary' },
  { key: 'scheduled', label: 'Agendado', color: 'bg-primary/15 text-primary/80' },
  { key: 'published', label: 'Publicado', color: 'bg-primary/15 text-primary' },
];

export const PILLARS = [
  { key: 'autoridade', label: 'Autoridade', color: 'hsl(195, 100%, 40%)' },
  { key: 'portfolio', label: 'Portfólio', color: 'hsl(195, 100%, 35%)' },
  { key: 'bastidores', label: 'Bastidores', color: 'hsl(195, 80%, 45%)' },
  { key: 'social_proof', label: 'Social Proof', color: 'hsl(195, 70%, 50%)' },
  { key: 'educacao', label: 'Educação', color: 'hsl(195, 60%, 55%)' },
  { key: 'venda', label: 'Venda', color: 'hsl(195, 50%, 60%)' },
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
function getInstagramAIFriendlyErrorMessage(input?: string): string {
  const msg = (input || '').toLowerCase();

  if (
    msg.includes('402') ||
    msg.includes('insufficient_credits') ||
    msg.includes('créditos insuficientes') ||
    msg.includes('payment required')
  ) {
    return 'Créditos insuficientes. Adicione créditos ao workspace para usar as funções de IA.';
  }

  if (msg.includes('429') || msg.includes('rate limit')) {
    return 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.';
  }

  if (msg.includes('non-2xx') || msg.includes('edge function returned')) {
    return 'Não foi possível processar a IA agora. Tente novamente em instantes.';
  }

  return input || 'Erro na IA';
}

export function useInstagramAI() {
  return useMutation({
    mutationFn: async ({ action, data }: { action: string; data: any }) => {
      const { data: result, error } = await supabase.functions.invoke('instagram-ai', {
        body: { action, data },
      });

      if (error) {
        throw new Error(getInstagramAIFriendlyErrorMessage(error.message));
      }

      if (result?.error) {
        throw new Error(getInstagramAIFriendlyErrorMessage(result.error));
      }

      return result?.result;
    },
    onError: (e: any) => toast.error(getInstagramAIFriendlyErrorMessage(e?.message || 'Erro na IA')),
  });
}

// AI-powered post update
export function useUpdatePostWithAI() {
  const qc = useQueryClient();
  const ai = useInstagramAI();
  const update = useUpdatePost();

  const generateAndUpdate = async ({
    postId,
    topic,
    format,
    pillar,
    command,
    reference_url,
    file_content,
    field,
  }: {
    postId: string;
    topic?: string;
    format?: string;
    pillar?: string;
    command?: string;
    reference_url?: string;
    file_content?: string;
    field?: string;
  }) => {
    const result = await ai.mutateAsync({
      action: 'generate_from_context',
      data: { topic, format, pillar, command, reference_url, file_content, field },
    });

    if (!result) throw new Error('IA não retornou resultado');

    const updates: Record<string, any> = { id: postId };
    if (result.hook !== undefined) updates.hook = result.hook;
    if (result.script !== undefined) updates.script = result.script;
    if (result.caption_short !== undefined) updates.caption_short = result.caption_short;
    if (result.caption_medium !== undefined) updates.caption_medium = result.caption_medium;
    if (result.caption_long !== undefined) updates.caption_long = result.caption_long;
    if (result.cta !== undefined) updates.cta = result.cta;
    if (result.pinned_comment !== undefined) updates.pinned_comment = result.pinned_comment;
    if (result.hashtags !== undefined) updates.hashtags = result.hashtags;
    if (result.cover_suggestion !== undefined) updates.cover_suggestion = result.cover_suggestion;
    if (result.carousel_slides !== undefined) updates.carousel_slides = result.carousel_slides;
    if (result.story_sequence !== undefined) updates.story_sequence = result.story_sequence;
    updates.ai_generated = true;

    await update.mutateAsync(updates as any);
    return result;
  };

  return {
    generateAndUpdate,
    isPending: ai.isPending || update.isPending,
  };
}

// Publish to Instagram
export function usePublishToInstagram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      post_id: string;
      image_url?: string;
      image_urls?: string[];
      video_url?: string;
      caption?: string;
      media_type?: 'IMAGE' | 'CAROUSEL' | 'REELS';
    }) => {
      const { data, error } = await supabase.functions.invoke('publish-to-instagram', {
        body: payload,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instagram-posts'] });
      toast.success('Publicado no Instagram com sucesso! 🎉');
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao publicar'),
  });
}

// AI Memory: save feedback when user edits AI-generated content
export function useSaveAIFeedback() {
  return useMutation({
    mutationFn: async (feedback: {
      post_id?: string;
      field_name: string;
      original_text: string;
      edited_text: string;
      category?: string;
      format?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: { action: 'save_feedback', data: feedback },
      });
      if (error) console.warn('Feedback save failed:', error);
      return data;
    },
  });
}

// AI Memory: save performance data
export function useSaveAIPerformance() {
  return useMutation({
    mutationFn: async (perf: {
      post_id: string;
      engagement_score: number;
      category?: string;
      format?: string;
      topic?: string;
      output_data?: any;
    }) => {
      const { data, error } = await supabase.functions.invoke('instagram-ai', {
        body: { action: 'save_performance', data: perf },
      });
      if (error) console.warn('Performance save failed:', error);
      return data;
    },
  });
}

// AI Memory: query memory entries
export function useAIMemory() {
  return useQuery({
    queryKey: ['instagram-ai-memory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_ai_memory' as any)
        .select('id, memory_type, category, format, topic, field_name, was_accepted, engagement_score, style_tags, tone, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

// ========== Campaign Tasks (Collaboration Board) ==========
export interface CampaignTask {
  id: string;
  campaign_id: string;
  title: string;
  assignee: string;
  status: string;
  priority: string;
  due_date: string;
  position: number;
  created_at: string;
}

export function useCampaignTasks(campaignId: string) {
  return useQuery({
    queryKey: ['instagram-campaign-tasks', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_campaign_tasks' as any)
        .select('*')
        .eq('campaign_id', campaignId)
        .order('position', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as CampaignTask[];
    },
    enabled: !!campaignId,
  });
}

export function useCampaignTaskMutations(campaignId: string) {
  const qc = useQueryClient();
  const key = ['instagram-campaign-tasks', campaignId];

  const create = useMutation({
    mutationFn: async (task: Partial<CampaignTask>) => {
      const { data, error } = await supabase
        .from('instagram_campaign_tasks' as any)
        .insert({ ...task, campaign_id: campaignId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CampaignTask> & { id: string }) => {
      const { error } = await supabase
        .from('instagram_campaign_tasks' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instagram_campaign_tasks' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
}

// ========== Competitors ==========
export interface CampaignCompetitor {
  id: string;
  campaign_id: string;
  name: string;
  handle: string;
  analysis: any;
  created_at: string;
}

export function useCampaignCompetitors(campaignId: string) {
  return useQuery({
    queryKey: ['instagram-competitors', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_competitors' as any)
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as CampaignCompetitor[];
    },
    enabled: !!campaignId,
  });
}

export function useCampaignCompetitorMutations(campaignId: string) {
  const qc = useQueryClient();
  const key = ['instagram-competitors', campaignId];

  const create = useMutation({
    mutationFn: async (comp: { name: string; handle: string }) => {
      const { data, error } = await supabase
        .from('instagram_competitors' as any)
        .insert({ ...comp, campaign_id: campaignId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; analysis?: any }) => {
      const { error } = await supabase
        .from('instagram_competitors' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instagram_competitors' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
}

// ========== Mood Board Items ==========
export interface MoodBoardItem {
  id: string;
  campaign_id: string;
  type: string;
  url: string | null;
  color: string | null;
  note: string | null;
  label: string | null;
  position: number;
  created_at: string;
}

export function useMoodBoardItems(campaignId: string) {
  return useQuery({
    queryKey: ['instagram-mood-items', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_mood_items' as any)
        .select('*')
        .eq('campaign_id', campaignId)
        .order('position', { ascending: true });
      if (error) throw error;
      return (data || []) as MoodBoardItem[];
    },
    enabled: !!campaignId,
  });
}

export function useMoodBoardMutations(campaignId: string) {
  const qc = useQueryClient();
  const key = ['instagram-mood-items', campaignId];

  const create = useMutation({
    mutationFn: async (item: Partial<MoodBoardItem>) => {
      const { data, error } = await supabase
        .from('instagram_mood_items' as any)
        .insert({ ...item, campaign_id: campaignId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instagram_mood_items' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  return { create, remove };
}

// ========== Personas ==========
export interface CampaignPersona {
  id: string;
  campaign_id: string;
  name: string;
  age_range: string;
  pain: string;
  desire: string;
  objection: string;
  funnel_stage: string;
  linked_posts: string[];
  ai_generated: boolean;
  created_at: string;
}

export function useCampaignPersonas(campaignId: string) {
  return useQuery({
    queryKey: ['instagram-personas', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_personas' as any)
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CampaignPersona[];
    },
    enabled: !!campaignId,
  });
}

export function useCampaignPersonaMutations(campaignId: string) {
  const qc = useQueryClient();
  const key = ['instagram-personas', campaignId];

  const create = useMutation({
    mutationFn: async (persona: Partial<CampaignPersona>) => {
      const { data, error } = await supabase
        .from('instagram_personas' as any)
        .insert({ ...persona, campaign_id: campaignId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  const createMany = useMutation({
    mutationFn: async (personas: Partial<CampaignPersona>[]) => {
      const rows = personas.map(p => ({ ...p, campaign_id: campaignId }));
      const { error } = await supabase
        .from('instagram_personas' as any)
        .insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CampaignPersona> & { id: string }) => {
      const { error } = await supabase
        .from('instagram_personas' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instagram_personas' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  return { create, createMany, update, remove };
}

// ========== Automation Rules ==========
export interface CampaignAutomationRule {
  id: string;
  campaign_id: string;
  name: string;
  trigger_config: any;
  action_config: any;
  enabled: boolean;
  created_at: string;
}

export function useCampaignAutomationRules(campaignId: string) {
  return useQuery({
    queryKey: ['instagram-automation-rules', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_automation_rules' as any)
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CampaignAutomationRule[];
    },
    enabled: !!campaignId,
  });
}

export function useCampaignAutomationRuleMutations(campaignId: string) {
  const qc = useQueryClient();
  const key = ['instagram-automation-rules', campaignId];

  const create = useMutation({
    mutationFn: async (rule: { name: string; trigger_config: any; action_config: any; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('instagram_automation_rules' as any)
        .insert({ ...rule, campaign_id: campaignId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; enabled?: boolean }) => {
      const { error } = await supabase
        .from('instagram_automation_rules' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('instagram_automation_rules' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success('Regra removida');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { create, update, remove };
}
