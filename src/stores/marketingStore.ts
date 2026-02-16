import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import {
  ContentIdea,
  Campaign,
  ContentItem,
  ContentComment,
  ContentChecklist,
  InstagramReference,
  ContentFilters,
  IdeaFilters,
  ContentItemStatus,
  IdeaStatus,
} from '@/types/marketing';

interface MarketingState {
  // Data
  ideas: ContentIdea[];
  campaigns: Campaign[];
  contentItems: ContentItem[];
  instagramRefs: InstagramReference[];
  
  // Filters
  contentFilters: ContentFilters;
  ideaFilters: IdeaFilters;
  
  // UI State
  isLoading: boolean;
  selectedItem: ContentItem | null;
  selectedIdea: ContentIdea | null;
  
  // Actions - Ideas
  fetchIdeas: () => Promise<void>;
  createIdea: (data: Partial<ContentIdea>) => Promise<ContentIdea | null>;
  updateIdea: (id: string, data: Partial<ContentIdea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  promoteIdeaToContent: (ideaId: string) => Promise<ContentItem | null>;
  
  // Actions - Campaigns
  fetchCampaigns: () => Promise<void>;
  createCampaign: (data: Partial<Campaign>) => Promise<Campaign | null>;
  updateCampaign: (id: string, data: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  
  // Actions - Content Items
  fetchContentItems: () => Promise<void>;
  createContentItem: (data: Partial<ContentItem>) => Promise<ContentItem | null>;
  updateContentItem: (id: string, data: Partial<ContentItem>) => Promise<void>;
  updateContentStatus: (id: string, status: ContentItemStatus) => Promise<void>;
  deleteContentItem: (id: string) => Promise<void>;
  
  // Actions - Comments
  addComment: (itemId: string, text: string, authorName?: string) => Promise<void>;
  
  // Actions - Checklist
  addChecklistItem: (itemId: string, title: string) => Promise<void>;
  toggleChecklistItem: (checklistId: string, done: boolean) => Promise<void>;
  
  // Actions - Instagram
  fetchInstagramRefs: () => Promise<void>;
  saveInstagramRef: (data: Partial<InstagramReference>) => Promise<InstagramReference | null>;
  
  // Filters
  setContentFilters: (filters: Partial<ContentFilters>) => void;
  setIdeaFilters: (filters: Partial<IdeaFilters>) => void;
  resetFilters: () => void;
  
  // Selection
  setSelectedItem: (item: ContentItem | null) => void;
  setSelectedIdea: (idea: ContentIdea | null) => void;
  
  // Getters
  getFilteredIdeas: () => ContentIdea[];
  getFilteredContentItems: () => ContentItem[];
  getContentByStatus: (status: ContentItemStatus) => ContentItem[];
  getContentForCalendar: (month: number, year: number) => ContentItem[];
  getStats: () => {
    inProduction: number;
    overdue: number;
    approved: number;
    scheduledThisWeek: number;
    publishedThisMonth: number;
    totalIdeas: number;
    activeCampaigns: number;
  };
}

const defaultContentFilters: ContentFilters = {
  search: '',
  channel: 'all',
  pillar: 'all',
  format: 'all',
  status: 'all',
  campaign_id: 'all',
  dateRange: 'month',
};

const defaultIdeaFilters: IdeaFilters = {
  search: '',
  pillar: 'all',
  channel: 'all',
  format: 'all',
  status: 'all',
};

export const useMarketingStore = create<MarketingState>((set, get) => ({
  ideas: [],
  campaigns: [],
  contentItems: [],
  instagramRefs: [],
  contentFilters: defaultContentFilters,
  ideaFilters: defaultIdeaFilters,
  isLoading: false,
  selectedItem: null,
  selectedIdea: null,

  // Ideas
  fetchIdeas: async () => {
    const { data, error } = await supabase
      .from('content_ideas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ ideas: data as ContentIdea[] });
    }
  },

  createIdea: async (data) => {
    const insertData = { title: data.title || 'Nova Ideia', ...data };
    const { data: newIdea, error } = await supabase
      .from('content_ideas')
      .insert([insertData as any])
      .select()
      .single();
    
    if (!error && newIdea) {
      set((state) => ({ ideas: [newIdea as ContentIdea, ...state.ideas] }));
      return newIdea as ContentIdea;
    }
    return null;
  },

  updateIdea: async (id, data) => {
    await supabase.from('content_ideas').update(data as any).eq('id', id);
    set((state) => ({
      ideas: state.ideas.map((i) => (i.id === id ? { ...i, ...data } : i)),
    }));
  },

  deleteIdea: async (id) => {
    await supabase.from('content_ideas').delete().eq('id', id);
    set((state) => ({ ideas: state.ideas.filter((i) => i.id !== id) }));
  },

  promoteIdeaToContent: async (ideaId) => {
    const idea = get().ideas.find((i) => i.id === ideaId);
    if (!idea) return null;
    
    const contentItem = await get().createContentItem({
      idea_id: ideaId,
      title: idea.title,
      channel: idea.channel,
      format: idea.format,
      pillar: idea.pillar,
      hook: idea.hook,
      notes: idea.notes,
      status: 'briefing',
    });
    
    // Mark idea as selected
    await get().updateIdea(ideaId, { status: 'selected' });
    
    return contentItem;
  },

  // Campaigns
  fetchCampaigns: async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ campaigns: data as Campaign[] });
    }
  },

  createCampaign: async (data) => {
    const insertData = { name: data.name || 'Nova Campanha', ...data };
    const { data: newCampaign, error } = await supabase
      .from('campaigns')
      .insert([insertData as any])
      .select()
      .single();
    
    if (!error && newCampaign) {
      set((state) => ({ campaigns: [newCampaign as Campaign, ...state.campaigns] }));
      return newCampaign as Campaign;
    }
    return null;
  },

  updateCampaign: async (id, data) => {
    await supabase.from('campaigns').update(data as any).eq('id', id);
    set((state) => ({
      campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  },

  deleteCampaign: async (id) => {
    await supabase.from('campaigns').delete().eq('id', id);
    set((state) => ({ campaigns: state.campaigns.filter((c) => c.id !== id) }));
  },

  // Content Items
  fetchContentItems: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('content_items')
      .select('*, campaigns(*), content_ideas(*)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      // Batch fetch comments and checklist for all items
      const itemIds = (data as any[]).map((i) => i.id);
      
      const [commentsResult, checklistResult] = await Promise.all([
        supabase.from('content_comments').select('*').in('content_item_id', itemIds).order('created_at', { ascending: false }),
        supabase.from('content_checklist').select('*').in('content_item_id', itemIds).order('created_at', { ascending: true }),
      ]);
      
      const commentsByItem = (commentsResult.data || []).reduce((acc: Record<string, any[]>, c: any) => {
        (acc[c.content_item_id] ||= []).push(c);
        return acc;
      }, {});
      
      const checklistByItem = (checklistResult.data || []).reduce((acc: Record<string, any[]>, c: any) => {
        (acc[c.content_item_id] ||= []).push(c);
        return acc;
      }, {});
      
      const itemsWithRelations = (data as any[]).map((item) => ({
        ...item,
        campaign: item.campaigns,
        idea: item.content_ideas,
        comments: commentsByItem[item.id] || [],
        checklist: checklistByItem[item.id] || [],
      }));
      
      set({ contentItems: itemsWithRelations as ContentItem[], isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  createContentItem: async (data) => {
    const insertData = { title: data.title || 'Novo Conteúdo', ...data };
    const { data: newItem, error } = await supabase
      .from('content_items')
      .insert([insertData as any])
      .select()
      .single();
    
    if (!error && newItem) {
      const item = { ...(newItem as ContentItem), comments: [], checklist: [] };
      set((state) => ({ contentItems: [item, ...state.contentItems] }));
      return item;
    }
    return null;
  },

  updateContentItem: async (id, data) => {
    await supabase.from('content_items').update(data as any).eq('id', id);
    set((state) => ({
      contentItems: state.contentItems.map((i) => (i.id === id ? { ...i, ...data } : i)),
      selectedItem: state.selectedItem?.id === id ? { ...state.selectedItem, ...data } : state.selectedItem,
    }));
  },

  updateContentStatus: async (id, status) => {
    const updateData: Partial<ContentItem> = { status };
    
    // Auto-fill dates based on status
    if (status === 'published' && !get().contentItems.find(i => i.id === id)?.published_at) {
      updateData.published_at = new Date().toISOString();
    }
    
    await get().updateContentItem(id, updateData);
  },

  deleteContentItem: async (id) => {
    await supabase.from('content_items').delete().eq('id', id);
    set((state) => ({ 
      contentItems: state.contentItems.filter((i) => i.id !== id),
      selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
    }));
  },

  // Comments
  addComment: async (itemId, text, authorName) => {
    const { data } = await supabase
      .from('content_comments')
      .insert([{ content_item_id: itemId, text, author_name: authorName || 'Usuário' }])
      .select()
      .single();
    
    if (data) {
      set((state) => ({
        contentItems: state.contentItems.map((i) =>
          i.id === itemId ? { ...i, comments: [data as ContentComment, ...(i.comments || [])] } : i
        ),
        selectedItem: state.selectedItem?.id === itemId 
          ? { ...state.selectedItem, comments: [data as ContentComment, ...(state.selectedItem.comments || [])] }
          : state.selectedItem,
      }));
    }
  },

  // Checklist
  addChecklistItem: async (itemId, title) => {
    const { data } = await supabase
      .from('content_checklist')
      .insert([{ content_item_id: itemId, title }])
      .select()
      .single();
    
    if (data) {
      set((state) => ({
        contentItems: state.contentItems.map((i) =>
          i.id === itemId ? { ...i, checklist: [...(i.checklist || []), data as ContentChecklist] } : i
        ),
        selectedItem: state.selectedItem?.id === itemId 
          ? { ...state.selectedItem, checklist: [...(state.selectedItem.checklist || []), data as ContentChecklist] }
          : state.selectedItem,
      }));
    }
  },

  toggleChecklistItem: async (checklistId, done) => {
    const status = done ? 'done' : 'pending';
    await supabase.from('content_checklist').update({ status }).eq('id', checklistId);
    
    set((state) => ({
      contentItems: state.contentItems.map((i) => ({
        ...i,
        checklist: i.checklist?.map((c) => (c.id === checklistId ? { ...c, status } : c)),
      })),
      selectedItem: state.selectedItem ? {
        ...state.selectedItem,
        checklist: state.selectedItem.checklist?.map((c) => (c.id === checklistId ? { ...c, status } : c)),
      } : null,
    }));
  },

  // Instagram
  fetchInstagramRefs: async () => {
    const { data } = await supabase
      .from('instagram_references')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      set({ instagramRefs: data as InstagramReference[] });
    }
  },

  saveInstagramRef: async (data) => {
    const { data: newRef, error } = await supabase
      .from('instagram_references')
      .insert([data as any])
      .select()
      .single();
    
    if (!error && newRef) {
      set((state) => ({ instagramRefs: [newRef as InstagramReference, ...state.instagramRefs] }));
      return newRef as InstagramReference;
    }
    return null;
  },

  // Filters
  setContentFilters: (filters) =>
    set((state) => ({ contentFilters: { ...state.contentFilters, ...filters } })),

  setIdeaFilters: (filters) =>
    set((state) => ({ ideaFilters: { ...state.ideaFilters, ...filters } })),

  resetFilters: () =>
    set({ contentFilters: defaultContentFilters, ideaFilters: defaultIdeaFilters }),

  // Selection
  setSelectedItem: (item) => set({ selectedItem: item }),
  setSelectedIdea: (idea) => set({ selectedIdea: idea }),

  // Getters
  getFilteredIdeas: () => {
    const { ideas, ideaFilters } = get();
    return ideas.filter((i) => {
      if (ideaFilters.search && !i.title.toLowerCase().includes(ideaFilters.search.toLowerCase())) return false;
      if (ideaFilters.pillar !== 'all' && i.pillar !== ideaFilters.pillar) return false;
      if (ideaFilters.channel !== 'all' && i.channel !== ideaFilters.channel) return false;
      if (ideaFilters.format !== 'all' && i.format !== ideaFilters.format) return false;
      if (ideaFilters.status !== 'all' && i.status !== ideaFilters.status) return false;
      return true;
    });
  },

  getFilteredContentItems: () => {
    const { contentItems, contentFilters } = get();
    const now = new Date();
    
    return contentItems.filter((i) => {
      if (contentFilters.search && !i.title.toLowerCase().includes(contentFilters.search.toLowerCase())) return false;
      if (contentFilters.channel !== 'all' && i.channel !== contentFilters.channel) return false;
      if (contentFilters.pillar !== 'all' && i.pillar !== contentFilters.pillar) return false;
      if (contentFilters.format !== 'all' && i.format !== contentFilters.format) return false;
      if (contentFilters.status !== 'all' && i.status !== contentFilters.status) return false;
      if (contentFilters.campaign_id !== 'all' && i.campaign_id !== contentFilters.campaign_id) return false;
      
      // Date range filter
      if (contentFilters.dateRange !== 'all' && i.scheduled_at) {
        const scheduledDate = new Date(i.scheduled_at);
        if (contentFilters.dateRange === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekAhead = new Date(now);
          weekAhead.setDate(weekAhead.getDate() + 7);
          if (scheduledDate < weekAgo || scheduledDate > weekAhead) return false;
        } else if (contentFilters.dateRange === 'month') {
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          const monthAhead = new Date(now);
          monthAhead.setMonth(monthAhead.getMonth() + 1);
          if (scheduledDate < monthAgo || scheduledDate > monthAhead) return false;
        }
      }
      
      return true;
    });
  },

  getContentByStatus: (status) => {
    const { contentItems, contentFilters } = get();
    return contentItems.filter((i) => {
      if (i.status !== status) return false;
      if (contentFilters.search && !i.title.toLowerCase().includes(contentFilters.search.toLowerCase())) return false;
      if (contentFilters.channel !== 'all' && i.channel !== contentFilters.channel) return false;
      if (contentFilters.campaign_id !== 'all' && i.campaign_id !== contentFilters.campaign_id) return false;
      return true;
    });
  },

  getContentForCalendar: (month, year) => {
    return get().contentItems.filter((i) => {
      const date = i.scheduled_at ? new Date(i.scheduled_at) : i.due_at ? new Date(i.due_at) : null;
      if (!date) return false;
      return date.getMonth() === month && date.getFullYear() === year;
    });
  },

  getStats: () => {
    const { contentItems, ideas, campaigns } = get();
    const now = new Date();
    const weekAhead = new Date(now);
    weekAhead.setDate(weekAhead.getDate() + 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      inProduction: contentItems.filter((i) => 
        ['writing', 'recording', 'editing', 'review'].includes(i.status)
      ).length,
      overdue: contentItems.filter((i) => 
        i.due_at && new Date(i.due_at) < now && !['published', 'archived'].includes(i.status)
      ).length,
      approved: contentItems.filter((i) => i.status === 'approved').length,
      scheduledThisWeek: contentItems.filter((i) => 
        i.status === 'scheduled' && i.scheduled_at && new Date(i.scheduled_at) <= weekAhead
      ).length,
      publishedThisMonth: contentItems.filter((i) => 
        i.status === 'published' && i.published_at && new Date(i.published_at) >= monthStart
      ).length,
      totalIdeas: ideas.filter((i) => i.status === 'backlog').length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
    };
  },
}));
