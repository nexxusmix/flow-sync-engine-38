import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEFAULT_WORKSPACE = "00000000-0000-0000-0000-000000000000";
const META_APP_ID = "META_APP_ID_PLACEHOLDER"; // Replaced at runtime from edge fn

// Scopes for Instagram Business
const SCOPES = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

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

      // Aggregate by metric_name for account-level
      const accountMetrics: Record<string, number> = {};
      const mediaMetrics: Record<string, { likes: number; comments: number; reach: number; impressions: number; saved: number; shares: number }> = {};
      let storyMetrics: Record<string, number> = {};

      for (const row of data || []) {
        if (row.media_type === 'account') {
          // Keep latest value per metric
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

      // Calculate totals across media
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

export function useSyncInstagramInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await supabase.functions.invoke('fetch-instagram-insights', {
        body: { connection_id: connectionId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instagram-insights'] });
      toast.success(`Sincronizado! ${data.saved} métricas coletadas.`);
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error(`Erro ao sincronizar: ${error.message}`);
    },
  });
}

export function useMetaOAuthCallback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, redirect_uri }: { code: string; redirect_uri: string }) => {
      const { data, error } = await supabase.functions.invoke('meta-oauth-callback', {
        body: { code, redirect_uri },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instagram-connection'] });
      toast.success(`Conectado a @${data.connection.username}!`);
    },
    onError: (error) => {
      console.error('OAuth error:', error);
      toast.error(`Erro na conexão: ${error.message}`);
    },
  });
}

export function getMetaOAuthUrl(redirectUri: string, appId: string) {
  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${SCOPES}&response_type=code`;
}
