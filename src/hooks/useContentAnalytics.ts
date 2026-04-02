import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_WORKSPACE_ID_ID } from '@/constants/workspace';

export interface ContentKPIs {
  totalItems: number;
  publishedCount: number;
  publishedThisMonth: number;
  draftCount: number;
  scheduledCount: number;
  reviewCount: number;
  approvedCount: number;
  overdueCount: number;
  approvalRate: number;
  totalReach: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  engagementRate: number;
  recentItems: {
    id: string;
    title: string;
    channel: string | null;
    status: string | null;
    published_at: string | null;
    scheduled_at: string | null;
    views: number;
    likes: number;
    reach: number;
  }[];
  channelBreakdown: { channel: string; count: number }[];
}

export function useContentAnalytics() {
  return useQuery({
    queryKey: ['content-analytics'],
    queryFn: async (): Promise<ContentKPIs> => {
      // Fetch content items
      const { data: items, error: itemsErr } = await supabase
        .from('content_items')
        .select('id, title, channel, status, published_at, scheduled_at, created_at, due_at')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID)
        .order('created_at', { ascending: false });

      if (itemsErr) throw itemsErr;
      const allItems = items || [];

      // Fetch metrics
      const { data: metrics, error: metricsErr } = await supabase
        .from('content_metrics')
        .select('content_item_id, views, likes, comments, shares, reach')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID);

      if (metricsErr) throw metricsErr;
      const allMetrics = metrics || [];

      // Aggregate metrics by content_item_id (take latest / sum)
      const metricsMap = new Map<string, { views: number; likes: number; comments: number; shares: number; reach: number }>();
      for (const m of allMetrics) {
        const existing = metricsMap.get(m.content_item_id);
        if (!existing) {
          metricsMap.set(m.content_item_id, {
            views: m.views || 0,
            likes: m.likes || 0,
            comments: m.comments || 0,
            shares: m.shares || 0,
            reach: m.reach || 0,
          });
        } else {
          // Keep highest values (latest snapshot)
          existing.views = Math.max(existing.views, m.views || 0);
          existing.likes = Math.max(existing.likes, m.likes || 0);
          existing.comments = Math.max(existing.comments, m.comments || 0);
          existing.shares = Math.max(existing.shares, m.shares || 0);
          existing.reach = Math.max(existing.reach, m.reach || 0);
        }
      }

      const publishedCount = allItems.filter(i => i.status === 'published' || i.status === 'publicado').length;
      const draftCount = allItems.filter(i => i.status === 'draft' || i.status === 'rascunho' || i.status === 'idea').length;
      const scheduledCount = allItems.filter(i => i.status === 'scheduled' || i.status === 'agendado').length;
      const reviewCount = allItems.filter(i => i.status === 'review').length;
      const approvedCount = allItems.filter(i => i.status === 'approved').length;

      // Published this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const publishedThisMonth = allItems.filter(i =>
        (i.status === 'published' || i.status === 'publicado') &&
        i.published_at && i.published_at >= monthStart
      ).length;

      // Overdue: has due date in the past, not published/archived
      const overdueCount = allItems.filter(i =>
        i.due_at && new Date(i.due_at) < now &&
        !['published', 'publicado', 'archived'].includes(i.status || '')
      ).length;

      // Approval rate: approved+published / (approved+published+review) 
      const totalReviewed = approvedCount + publishedCount + reviewCount;
      const approvalRate = totalReviewed > 0 ? ((approvedCount + publishedCount) / totalReviewed) * 100 : 0;

      let totalReach = 0, totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0;
      for (const m of metricsMap.values()) {
        totalReach += m.reach;
        totalViews += m.views;
        totalLikes += m.likes;
        totalComments += m.comments;
        totalShares += m.shares;
      }

      const totalEngagements = totalLikes + totalComments + totalShares;
      const engagementRate = totalReach > 0 ? (totalEngagements / totalReach) * 100 : 0;

      // Recent items with their metrics
      const recentItems = allItems.slice(0, 10).map(item => {
        const m = metricsMap.get(item.id);
        return {
          id: item.id,
          title: item.title,
          channel: item.channel,
          status: item.status,
          published_at: item.published_at,
          scheduled_at: item.scheduled_at,
          views: m?.views || 0,
          likes: m?.likes || 0,
          reach: m?.reach || 0,
        };
      });

      // Channel breakdown
      const channelMap = new Map<string, number>();
      for (const item of allItems) {
        const ch = item.channel || 'outro';
        channelMap.set(ch, (channelMap.get(ch) || 0) + 1);
      }
      const channelBreakdown = Array.from(channelMap.entries())
        .map(([channel, count]) => ({ channel, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalItems: allItems.length,
        publishedCount,
        publishedThisMonth,
        draftCount,
        scheduledCount,
        reviewCount,
        approvedCount,
        overdueCount,
        approvalRate,
        totalReach,
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        engagementRate,
        recentItems,
        channelBreakdown,
      };
    },
  });
}
