import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEFAULT_WORKSPACE = "00000000-0000-0000-0000-000000000000";

export function useInstagramConnection() {
  return useQuery({
    queryKey: ['instagram-connection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_connections')
        .select('*')
        .eq('workspace_id', DEFAULT_WORKSPACE)
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useConnectInstagramManual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await supabase
        .from('instagram_connections')
        .upsert({
          workspace_id: DEFAULT_WORKSPACE,
          ig_username: username,
          ig_user_id: `manual_${username}`,
          access_token: 'manual',
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'workspace_id,ig_username',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instagram-connection'] });
      toast.success(`Conectado a @${data.ig_username}!`);
    },
    onError: (error) => {
      toast.error(`Erro ao conectar: ${error.message}`);
    },
  });
}

export function useDisconnectInstagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('instagram_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instagram-connection'] });
      toast.success('Instagram desconectado.');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useInstagramInsights(connectionId?: string) {
  return useQuery({
    queryKey: ['instagram-insights', connectionId],
    enabled: !!connectionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instagram_insights')
        .select('*')
        .eq('connection_id', connectionId!)
        .order('collected_at', { ascending: false });

      if (error) throw error;

      const accountMetrics: Record<string, number> = {};
      const mediaMetrics: Record<string, { likes: number; comments: number; reach: number; impressions: number; saved: number; shares: number }> = {};
      let storyMetrics: Record<string, number> = {};

      for (const row of data || []) {
        if (row.media_type === 'account') {
          if (!accountMetrics[row.metric_name]) {
            accountMetrics[row.metric_name] = Number(row.metric_value);
          }
        } else if (row.media_type === 'story') {
          storyMetrics[row.metric_name] = (storyMetrics[row.metric_name] || 0) + Number(row.metric_value);
        } else if (row.media_id) {
          if (!mediaMetrics[row.media_id]) {
            mediaMetrics[row.media_id] = { likes: 0, comments: 0, reach: 0, impressions: 0, saved: 0, shares: 0 };
          }
          const m = mediaMetrics[row.media_id];
          const val = Number(row.metric_value);
          if (row.metric_name === 'likes') m.likes = val;
          if (row.metric_name === 'comments') m.comments = val;
          if (row.metric_name === 'reach') m.reach = val;
          if (row.metric_name === 'impressions') m.impressions = val;
          if (row.metric_name === 'saved') m.saved = val;
          if (row.metric_name === 'shares') m.shares = val;
        }
      }

      const mediaValues = Object.values(mediaMetrics);
      const totalReach = mediaValues.reduce((s, m) => s + m.reach, 0);
      const totalLikes = mediaValues.reduce((s, m) => s + m.likes, 0);
      const totalComments = mediaValues.reduce((s, m) => s + m.comments, 0);
      const totalShares = mediaValues.reduce((s, m) => s + m.shares, 0);
      const totalSaved = mediaValues.reduce((s, m) => s + m.saved, 0);
      const totalImpressions = mediaValues.reduce((s, m) => s + m.impressions, 0);
      const totalEngagement = totalLikes + totalComments + totalShares + totalSaved;
      const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

      return {
        account: accountMetrics,
        media: mediaMetrics,
        stories: storyMetrics,
        totals: {
          followers: accountMetrics.followers_count || 0,
          reach: totalReach + (accountMetrics.reach || 0),
          impressions: totalImpressions + (accountMetrics.impressions || 0),
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
          saved: totalSaved,
          engagement: totalEngagement,
          engagementRate: Math.round(engagementRate * 100) / 100,
          postsAnalyzed: mediaValues.length,
          profileViews: accountMetrics.profile_views || 0,
        },
        raw: data,
      };
    },
  });
}
