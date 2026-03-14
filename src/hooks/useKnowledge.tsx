import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface KnowledgeArticle {
  id: string;
  workspace_id: string;
  title: string;
  category: string | null;
  category_id: string | null;
  content: string;
  summary: string | null;
  article_type: string;
  status: string;
  tags: string[];
  is_published: boolean;
  created_by: string | null;
  reviewer_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  version: number;
  views_count: number;
  helpful_count: number;
  published_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  sort_order: number;
}

export interface KnowledgeFaqItem {
  id: string;
  question: string;
  answer: string;
  category_id: string | null;
  is_published: boolean;
  views_count: number;
}

interface UseKnowledgeFilters {
  category?: string;
  search?: string;
  isPublished?: boolean;
  articleType?: string;
}

export function useKnowledge(filters?: UseKnowledgeFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: articles, isLoading } = useQuery({
    queryKey: ['knowledge-articles', filters],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_articles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.isPublished !== undefined) query = query.eq('is_published', filters.isPublished);
      if (filters?.articleType) query = query.eq('article_type', filters.articleType);
      if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as KnowledgeArticle[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('sort_order');
      return (data || []) as KnowledgeCategory[];
    },
  });

  const { data: faqItems } = useQuery({
    queryKey: ['knowledge-faq'],
    queryFn: async () => {
      const { data } = await supabase
        .from('knowledge_faq_items')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');
      return (data || []) as KnowledgeFaqItem[];
    },
  });

  const createArticle = useMutation({
    mutationFn: async (article: { title: string; category?: string; content?: string; article_type?: string }) => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .insert({
          title: article.title,
          category: article.category || 'Geral',
          content: article.content || '',
          article_type: article.article_type || 'article',
          status: 'draft',
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      toast.success('Artigo criado!');
    },
  });

  const updateArticle = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      toast.success('Artigo salvo!');
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('knowledge_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      toast.success('Artigo removido');
    },
  });

  const archiveArticle = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('knowledge_articles').update({ is_published: false, status: 'archived' }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-articles'] });
      toast.success('Artigo arquivado');
    },
  });

  const createFaq = useMutation({
    mutationFn: async (item: { question: string; answer: string }) => {
      const { error } = await supabase.from('knowledge_faq_items').insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-faq'] });
      toast.success('FAQ criada!');
    },
  });

  const uniqueCategories = [...new Set(articles?.map(a => a.category).filter(Boolean) || [])];

  return {
    articles: articles || [],
    isLoading,
    categories: categories || [],
    categoryNames: uniqueCategories,
    faqItems: faqItems || [],
    createArticle: createArticle.mutate,
    isCreating: createArticle.isPending,
    updateArticle: updateArticle.mutate,
    archiveArticle: archiveArticle.mutate,
    deleteArticle: deleteArticle.mutate,
    createFaq: createFaq.mutate,
  };
}
