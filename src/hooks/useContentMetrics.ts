import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContentMetric {
  id: string;
  content_item_id: string;
  workspace_id: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  views: number;
  collected_at: string;
  created_at: string;
}

export interface MetricsInput {
  likes?: number;
  comments?: number;
  shares?: number;
  reach?: number;
  views?: number;
}

export interface AggregatedMetrics {
  totalReach: number;
  totalEngagement: number; // likes + comments
  averageEngagement: number;
  publishedCount: number;
}

export function useContentMetrics(contentItemId?: string) {
  const [metrics, setMetrics] = useState<ContentMetric | null>(null);
  const [history, setHistory] = useState<ContentMetric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMetrics = async () => {
    if (!contentItemId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_metrics')
        .select('*')
        .eq('content_item_id', contentItemId)
        .order('collected_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setMetrics(data[0] as ContentMetric);
        setHistory(data as ContentMetric[]);
      } else {
        setMetrics(null);
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMetrics = async (input: MetricsInput): Promise<boolean> => {
    if (!contentItemId) return false;
    
    setIsSaving(true);
    try {
      const payload = {
        content_item_id: contentItemId,
        likes: input.likes || 0,
        comments: input.comments || 0,
        shares: input.shares || 0,
        reach: input.reach || 0,
        views: input.views || 0,
        collected_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('content_metrics')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setMetrics(data as ContentMetric);
      setHistory(prev => [data as ContentMetric, ...prev]);
      toast.success('Métricas salvas com sucesso!');
      return true;
    } catch (err) {
      console.error('Error saving metrics:', err);
      toast.error('Erro ao salvar métricas');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [contentItemId]);

  return {
    metrics,
    history,
    isLoading,
    isSaving,
    saveMetrics,
    refetch: fetchMetrics,
  };
}

export function useAggregatedMetrics() {
  const [aggregated, setAggregated] = useState<AggregatedMetrics>({
    totalReach: 0,
    totalEngagement: 0,
    averageEngagement: 0,
    publishedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchAggregated = async () => {
    setIsLoading(true);
    try {
      // Fetch all metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('content_metrics')
        .select('content_item_id, likes, comments, shares, reach, views');

      if (metricsError) throw metricsError;

      // Get unique content items with metrics
      const uniqueItems = new Set((metricsData || []).map(m => m.content_item_id));
      
      // Calculate aggregates from the most recent metric per item
      const latestByItem: Record<string, typeof metricsData[0]> = {};
      (metricsData || []).forEach(m => {
        if (!latestByItem[m.content_item_id]) {
          latestByItem[m.content_item_id] = m;
        }
      });

      const items = Object.values(latestByItem);
      const totalReach = items.reduce((sum, m) => sum + (m.reach || 0), 0);
      const totalEngagement = items.reduce((sum, m) => sum + (m.likes || 0) + (m.comments || 0), 0);
      const publishedCount = items.length;
      const averageEngagement = publishedCount > 0 ? Math.round(totalEngagement / publishedCount) : 0;

      setAggregated({
        totalReach,
        totalEngagement,
        averageEngagement,
        publishedCount,
      });
    } catch (err) {
      console.error('Error fetching aggregated metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAggregated();
  }, []);

  return {
    aggregated,
    isLoading,
    refetch: fetchAggregated,
  };
}
