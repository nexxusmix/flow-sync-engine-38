import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface KnowledgeArticle {
  id: string;
  workspace_id: string;
  title: string;
  category: string | null;
  content_md: string;
  tags: string[];
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface UseKnowledgeFilters {
  category?: string;
  search?: string;
  isPublished?: boolean;
}

export function useKnowledge(filters?: UseKnowledgeFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['knowledge-articles', filters],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_articles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.isPublished !== undefined) {
        query = query.eq('is_published', filters.isPublished);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content_md.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KnowledgeArticle[];
    },
  });

  const getArticle = (articleId: string) => {
    return useQuery({
      queryKey: ['knowledge-article', articleId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('knowledge_articles')
          .select('*')
          .eq('id', articleId)
          .single();

        if (error) throw error;
        return data as KnowledgeArticle;
      },
      enabled: !!articleId,
    });
  };

  const createArticle = useMutation({
    mutationFn: async (article: Partial<Pick<KnowledgeArticle, 'title' | 'category' | 'content_md' | 'tags'>>) => {
      // Get profile ID for created_by
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      const { data, error } = await supabase
        .from('knowledge_articles')
        .insert({
          title: article.title || 'Novo Artigo',
          category: article.category,
          content_md: article.content_md || '',
          tags: article.tags || [],
          created_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('event_logs').insert({
        action: 'article_created',
        entity_type: 'knowledge_article',
        entity_id: data.id,
        actor_id: user?.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
    },
  });

  const updateArticle = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KnowledgeArticle> & { id: string }) => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('event_logs').insert({
        action: 'article_updated',
        entity_type: 'knowledge_article',
        entity_id: id,
        actor_id: user?.id,
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-article', variables.id] });
    },
  });

  const archiveArticle = useMutation({
    mutationFn: async (articleId: string) => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .update({ is_published: false })
        .eq('id', articleId)
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('event_logs').insert({
        action: 'article_archived',
        entity_type: 'knowledge_article',
        entity_id: articleId,
        actor_id: user?.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;

      // Log event
      await supabase.from('event_logs').insert({
        action: 'article_deleted',
        entity_type: 'knowledge_article',
        entity_id: articleId,
        actor_id: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
    },
  });

  // Get unique categories
  const categories = [...new Set(articles?.map(a => a.category).filter(Boolean) || [])];

  return {
    articles,
    isLoading,
    error,
    categories,
    getArticle,
    createArticle: createArticle.mutate,
    isCreating: createArticle.isPending,
    updateArticle: updateArticle.mutate,
    isUpdating: updateArticle.isPending,
    archiveArticle: archiveArticle.mutate,
    deleteArticle: deleteArticle.mutate,
  };
}
