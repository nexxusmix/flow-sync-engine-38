import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import {
  ProspectList,
  Prospect,
  Cadence,
  CadenceStep,
  ProspectOpportunity,
  ProspectActivity,
  ProspectFilters,
  OpportunityFilters,
  OpportunityStage,
  ProspectStatus,
  ProspectPriority,
} from '@/types/prospecting';

interface ProspectingState {
  // Data
  lists: ProspectList[];
  prospects: Prospect[];
  cadences: Cadence[];
  opportunities: ProspectOpportunity[];
  activities: ProspectActivity[];
  
  // Filters
  prospectFilters: ProspectFilters;
  opportunityFilters: OpportunityFilters;
  
  // UI State
  isLoading: boolean;
  selectedProspect: Prospect | null;
  selectedOpportunity: ProspectOpportunity | null;
  
  // Actions - Lists
  fetchLists: () => Promise<void>;
  createList: (data: Partial<ProspectList>) => Promise<ProspectList | null>;
  deleteList: (id: string) => Promise<void>;
  
  // Actions - Prospects
  fetchProspects: () => Promise<void>;
  createProspect: (data: Partial<Prospect>) => Promise<Prospect | null>;
  updateProspect: (id: string, data: Partial<Prospect>) => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;
  blacklistProspect: (id: string, reason: string) => Promise<void>;
  importProspects: (prospects: Partial<Prospect>[]) => Promise<void>;
  
  // Actions - Cadences
  fetchCadences: () => Promise<void>;
  createCadence: (data: Partial<Cadence>) => Promise<Cadence | null>;
  updateCadence: (id: string, data: Partial<Cadence>) => Promise<void>;
  deleteCadence: (id: string) => Promise<void>;
  addCadenceStep: (cadenceId: string, step: Partial<CadenceStep>) => Promise<void>;
  updateCadenceStep: (stepId: string, data: Partial<CadenceStep>) => Promise<void>;
  deleteCadenceStep: (stepId: string) => Promise<void>;
  
  // Actions - Opportunities
  fetchOpportunities: () => Promise<void>;
  createOpportunity: (prospectId: string, data: Partial<ProspectOpportunity>) => Promise<ProspectOpportunity | null>;
  updateOpportunity: (id: string, data: Partial<ProspectOpportunity>) => Promise<void>;
  moveOpportunityStage: (id: string, stage: OpportunityStage) => Promise<void>;
  deleteOpportunity: (id: string) => Promise<void>;
  
  // Actions - Activities
  fetchActivities: (opportunityId?: string) => Promise<void>;
  fetchTodayActivities: () => Promise<ProspectActivity[]>;
  createActivity: (opportunityId: string, data: Partial<ProspectActivity>) => Promise<ProspectActivity | null>;
  completeActivity: (id: string, outcome?: string) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  
  // Filters
  setProspectFilters: (filters: Partial<ProspectFilters>) => void;
  setOpportunityFilters: (filters: Partial<OpportunityFilters>) => void;
  resetFilters: () => void;
  
  // Selection
  setSelectedProspect: (prospect: Prospect | null) => void;
  setSelectedOpportunity: (opportunity: ProspectOpportunity | null) => void;
  
  // Getters
  getFilteredProspects: () => Prospect[];
  getFilteredOpportunities: () => ProspectOpportunity[];
  getOpportunitiesByStage: (stage: OpportunityStage) => ProspectOpportunity[];
  getOverdueActivities: () => ProspectActivity[];
  getStats: () => {
    totalProspects: number;
    activeProspects: number;
    totalOpportunities: number;
    wonOpportunities: number;
    todayActivities: number;
    overdueActivities: number;
    pipelineValue: number;
  };
}

const defaultProspectFilters: ProspectFilters = {
  search: '',
  list_id: 'all',
  status: 'all',
  priority: 'all',
  niche: '',
};

const defaultOpportunityFilters: OpportunityFilters = {
  search: '',
  stage: 'all',
  owner: 'all',
  hasNextAction: 'all',
};

export const useProspectingStore = create<ProspectingState>((set, get) => ({
  lists: [],
  prospects: [],
  cadences: [],
  opportunities: [],
  activities: [],
  prospectFilters: defaultProspectFilters,
  opportunityFilters: defaultOpportunityFilters,
  isLoading: false,
  selectedProspect: null,
  selectedOpportunity: null,

  // Lists
  fetchLists: async () => {
    const { data, error } = await supabase
      .from('prospect_lists')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ lists: data as ProspectList[] });
    }
  },

  createList: async (data) => {
    const insertData = { name: data.name || 'Nova Lista', ...data };
    const { data: newList, error } = await supabase
      .from('prospect_lists')
      .insert([insertData as any])
      .select()
      .single();
    
    if (!error && newList) {
      set((state) => ({ lists: [newList as ProspectList, ...state.lists] }));
      return newList as ProspectList;
    }
    return null;
  },

  deleteList: async (id) => {
    await supabase.from('prospect_lists').delete().eq('id', id);
    set((state) => ({ lists: state.lists.filter((l) => l.id !== id) }));
  },

  // Prospects
  fetchProspects: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('prospects')
      .select('*, prospect_lists(*)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ prospects: data as Prospect[], isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  createProspect: async (data) => {
    const insertData = { company_name: data.company_name || 'Novo Prospect', ...data };
    const { data: newProspect, error } = await supabase
      .from('prospects')
      .insert([insertData as any])
      .select()
      .single();
    
    if (!error && newProspect) {
      set((state) => ({ prospects: [newProspect as Prospect, ...state.prospects] }));
      return newProspect as Prospect;
    }
    return null;
  },

  updateProspect: async (id, data) => {
    const { error } = await supabase
      .from('prospects')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (!error) {
      set((state) => ({
        prospects: state.prospects.map((p) =>
          p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
        ),
      }));
    }
  },

  deleteProspect: async (id) => {
    await supabase.from('prospects').delete().eq('id', id);
    set((state) => ({ prospects: state.prospects.filter((p) => p.id !== id) }));
  },

  blacklistProspect: async (id, reason) => {
    await supabase.from('do_not_contact').insert([{ prospect_id: id, reason }]);
    await supabase.from('prospects').update({ status: 'blacklisted' }).eq('id', id);
    set((state) => ({
      prospects: state.prospects.map((p) =>
        p.id === id ? { ...p, status: 'blacklisted' as ProspectStatus } : p
      ),
    }));
  },

  importProspects: async (prospects) => {
    const insertData = prospects.map((p) => ({ 
      company_name: p.company_name || 'Prospect Importado',
      ...p 
    }));
    const { data, error } = await supabase
      .from('prospects')
      .insert(insertData as any[])
      .select();
    
    if (!error && data) {
      set((state) => ({ prospects: [...(data as Prospect[]), ...state.prospects] }));
    }
  },

  // Cadences
  fetchCadences: async () => {
    const { data: cadencesData } = await supabase
      .from('cadences')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { data: stepsData } = await supabase
      .from('cadence_steps')
      .select('*')
      .order('step_order', { ascending: true });
    
    if (cadencesData) {
      const cadences = (cadencesData as Cadence[]).map((c) => ({
        ...c,
        steps: (stepsData as CadenceStep[] || []).filter((s) => s.cadence_id === c.id),
      }));
      set({ cadences });
    }
  },

  createCadence: async (data) => {
    const insertData = { name: data.name || 'Nova Cadência', ...data };
    const { data: newCadence, error } = await supabase
      .from('cadences')
      .insert([insertData as any])
      .select()
      .single();
    
    if (!error && newCadence) {
      set((state) => ({ cadences: [{ ...(newCadence as Cadence), steps: [] }, ...state.cadences] }));
      return newCadence as Cadence;
    }
    return null;
  },

  updateCadence: async (id, data) => {
    const updateData = { ...data, updated_at: new Date().toISOString() };
    await supabase.from('cadences').update(updateData as any).eq('id', id);
    set((state) => ({
      cadences: state.cadences.map((c) =>
        c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c
      ),
    }));
  },

  deleteCadence: async (id) => {
    await supabase.from('cadences').delete().eq('id', id);
    set((state) => ({ cadences: state.cadences.filter((c) => c.id !== id) }));
  },

  addCadenceStep: async (cadenceId, step) => {
    const insertData = {
      cadence_id: cadenceId,
      step_order: step.step_order || 1,
      channel: step.channel || 'whatsapp',
      template: step.template || '',
      ...step,
    };
    const { data } = await supabase
      .from('cadence_steps')
      .insert([insertData as any])
      .select()
      .single();
    
    if (data) {
      set((state) => ({
        cadences: state.cadences.map((c) =>
          c.id === cadenceId ? { ...c, steps: [...(c.steps || []), data as CadenceStep] } : c
        ),
      }));
    }
  },

  updateCadenceStep: async (stepId, data) => {
    await supabase.from('cadence_steps').update(data).eq('id', stepId);
    set((state) => ({
      cadences: state.cadences.map((c) => ({
        ...c,
        steps: c.steps?.map((s) => (s.id === stepId ? { ...s, ...data } : s)),
      })),
    }));
  },

  deleteCadenceStep: async (stepId) => {
    await supabase.from('cadence_steps').delete().eq('id', stepId);
    set((state) => ({
      cadences: state.cadences.map((c) => ({
        ...c,
        steps: c.steps?.filter((s) => s.id !== stepId),
      })),
    }));
  },

  // Opportunities
  fetchOpportunities: async () => {
    const { data, error } = await supabase
      .from('prospect_opportunities')
      .select('*, prospects(*)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ opportunities: data as ProspectOpportunity[] });
    }
  },

  createOpportunity: async (prospectId, data) => {
    const prospect = get().prospects.find((p) => p.id === prospectId);
    const { data: newOpp, error } = await supabase
      .from('prospect_opportunities')
      .insert([{
        ...data,
        prospect_id: prospectId,
        title: data.title || prospect?.company_name || 'Nova Oportunidade',
      }])
      .select('*, prospects(*)')
      .single();
    
    if (!error && newOpp) {
      set((state) => ({ opportunities: [newOpp as ProspectOpportunity, ...state.opportunities] }));
      return newOpp as ProspectOpportunity;
    }
    return null;
  },

  updateOpportunity: async (id, data) => {
    const updateData: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
    
    if (data.stage === 'won' && !data.won_at) {
      updateData.won_at = new Date().toISOString();
    }
    if (data.stage === 'lost' && !data.lost_at) {
      updateData.lost_at = new Date().toISOString();
    }
    
    await supabase.from('prospect_opportunities').update(updateData).eq('id', id);
    set((state) => ({
      opportunities: state.opportunities.map((o) =>
        o.id === id ? { ...o, ...updateData } as ProspectOpportunity : o
      ),
    }));
  },

  moveOpportunityStage: async (id, stage) => {
    await get().updateOpportunity(id, { stage });
  },

  deleteOpportunity: async (id) => {
    await supabase.from('prospect_opportunities').delete().eq('id', id);
    set((state) => ({ opportunities: state.opportunities.filter((o) => o.id !== id) }));
  },

  // Activities
  fetchActivities: async (opportunityId) => {
    let query = supabase
      .from('prospect_activities')
      .select('*, prospect_opportunities(*, prospects(*))')
      .order('due_at', { ascending: true });
    
    if (opportunityId) {
      query = query.eq('opportunity_id', opportunityId);
    }
    
    const { data } = await query;
    if (data) {
      set({ activities: data as ProspectActivity[] });
    }
  },

  fetchTodayActivities: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data } = await supabase
      .from('prospect_activities')
      .select('*, prospect_opportunities(*, prospects(*))')
      .eq('completed', false)
      .lte('due_at', tomorrow.toISOString())
      .order('due_at', { ascending: true });
    
    return (data as ProspectActivity[]) || [];
  },

  createActivity: async (opportunityId, data) => {
    const insertData = {
      opportunity_id: opportunityId,
      title: data.title || 'Nova Atividade',
      type: data.type || 'followup',
      ...data,
    };
    const { data: newActivity, error } = await supabase
      .from('prospect_activities')
      .insert([insertData as any])
      .select()
      .single();
    
    if (!error && newActivity) {
      set((state) => ({ activities: [newActivity as ProspectActivity, ...state.activities] }));
      
      // Update opportunity next action
      if (data.due_at) {
        await get().updateOpportunity(opportunityId, {
          next_action_at: data.due_at,
          next_action_type: data.type as ProspectOpportunity['next_action_type'],
        });
      }
      
      return newActivity as ProspectActivity;
    }
    return null;
  },

  completeActivity: async (id, outcome) => {
    const now = new Date().toISOString();
    await supabase
      .from('prospect_activities')
      .update({ completed: true, completed_at: now, outcome })
      .eq('id', id);
    
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, completed: true, completed_at: now, outcome } : a
      ),
    }));
  },

  deleteActivity: async (id) => {
    await supabase.from('prospect_activities').delete().eq('id', id);
    set((state) => ({ activities: state.activities.filter((a) => a.id !== id) }));
  },

  // Filters
  setProspectFilters: (filters) =>
    set((state) => ({ prospectFilters: { ...state.prospectFilters, ...filters } })),

  setOpportunityFilters: (filters) =>
    set((state) => ({ opportunityFilters: { ...state.opportunityFilters, ...filters } })),

  resetFilters: () =>
    set({ prospectFilters: defaultProspectFilters, opportunityFilters: defaultOpportunityFilters }),

  // Selection
  setSelectedProspect: (prospect) => set({ selectedProspect: prospect }),
  setSelectedOpportunity: (opportunity) => set({ selectedOpportunity: opportunity }),

  // Getters
  getFilteredProspects: () => {
    const { prospects, prospectFilters } = get();
    return prospects.filter((p) => {
      if (prospectFilters.search && !p.company_name.toLowerCase().includes(prospectFilters.search.toLowerCase())) {
        return false;
      }
      if (prospectFilters.list_id !== 'all' && p.list_id !== prospectFilters.list_id) {
        return false;
      }
      if (prospectFilters.status !== 'all' && p.status !== prospectFilters.status) {
        return false;
      }
      if (prospectFilters.priority !== 'all' && p.priority !== prospectFilters.priority) {
        return false;
      }
      if (prospectFilters.niche && !p.niche?.toLowerCase().includes(prospectFilters.niche.toLowerCase())) {
        return false;
      }
      return true;
    });
  },

  getFilteredOpportunities: () => {
    const { opportunities, opportunityFilters } = get();
    const now = new Date();
    
    return opportunities.filter((o) => {
      if (opportunityFilters.search) {
        const searchLower = opportunityFilters.search.toLowerCase();
        const matchesTitle = o.title.toLowerCase().includes(searchLower);
        const matchesCompany = (o as any).prospects?.company_name?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesCompany) return false;
      }
      if (opportunityFilters.stage !== 'all' && o.stage !== opportunityFilters.stage) {
        return false;
      }
      if (opportunityFilters.hasNextAction === 'yes' && !o.next_action_at) {
        return false;
      }
      if (opportunityFilters.hasNextAction === 'no' && o.next_action_at) {
        return false;
      }
      if (opportunityFilters.hasNextAction === 'overdue' && o.next_action_at) {
        if (new Date(o.next_action_at) >= now) return false;
      }
      return true;
    });
  },

  getOpportunitiesByStage: (stage) => {
    return get().opportunities.filter((o) => o.stage === stage);
  },

  getOverdueActivities: () => {
    const now = new Date();
    return get().activities.filter(
      (a) => !a.completed && a.due_at && new Date(a.due_at) < now
    );
  },

  getStats: () => {
    const { prospects, opportunities, activities } = get();
    const now = new Date();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return {
      totalProspects: prospects.length,
      activeProspects: prospects.filter((p) => p.status === 'active').length,
      totalOpportunities: opportunities.length,
      wonOpportunities: opportunities.filter((o) => o.stage === 'won').length,
      todayActivities: activities.filter(
        (a) => !a.completed && a.due_at && new Date(a.due_at) <= today
      ).length,
      overdueActivities: activities.filter(
        (a) => !a.completed && a.due_at && new Date(a.due_at) < now
      ).length,
      pipelineValue: opportunities
        .filter((o) => !['won', 'lost'].includes(o.stage))
        .reduce((acc, o) => acc + (o.estimated_value || 0), 0),
    };
  },
}));
