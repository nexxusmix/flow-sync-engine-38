import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// CRM Stage configuration
export const CRM_STAGES = [
  { id: 'lead', title: 'Leads', color: 'bg-zinc-500' },
  { id: 'qualificacao', title: 'Qualificação', color: 'bg-blue-500' },
  { id: 'diagnostico', title: 'Diagnóstico', color: 'bg-indigo-500' },
  { id: 'proposta', title: 'Proposta', color: 'bg-amber-500' },
  { id: 'negociacao', title: 'Negociação', color: 'bg-orange-500' },
  { id: 'fechado', title: 'Fechado', color: 'bg-emerald-500' },
  { id: 'onboarding', title: 'Onboarding', color: 'bg-purple-500' },
  { id: 'posvenda', title: 'Pós-Venda', color: 'bg-pink-500' },
];

// Normalized types for UI consumption
export interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  prospectId: string | null;
  prospectName: string;
  company: string;
  source: string | null;
  assignedTo: string | null;
  linkedProjectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  linkedin: string | null;
  source: string | null;
  niche: string | null;
  score: number;
  tags: string[];
  createdAt: string;
}

export function useCRM() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all deals with prospects
  const { data: deals = [], isLoading: isLoadingDeals, isFetching: isFetchingDeals, refetch: refetchDeals } = useQuery({
    queryKey: ['crm-deals'],
    queryFn: async (): Promise<Deal[]> => {
      const { data, error } = await supabase
        .from('prospect_opportunities')
        .select(`
          *,
          prospect:prospects(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deals:', error);
        return [];
      }
      
      // Transform to normalized format
      return (data || []).map(deal => ({
        id: deal.id,
        title: deal.title,
        stage: deal.stage || 'lead',
        value: deal.estimated_value || 0,
        probability: deal.probability || 20,
        prospectId: deal.prospect_id,
        prospectName: deal.prospect?.decision_maker_name || deal.prospect?.company_name || 'Sem contato',
        company: deal.prospect?.company_name || '',
        source: null,
        assignedTo: null,
        linkedProjectId: deal.linked_project_id,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
      }));
    },
    enabled: !!user,
  });

  // Fetch all prospects/contacts
  const { data: contacts = [], isLoading: isLoadingContacts, isFetching: isFetchingContacts, refetch: refetchContacts } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: async (): Promise<Contact[]> => {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        return [];
      }
      
      // Transform to normalized format
      return (data || []).map(prospect => ({
        id: prospect.id,
        name: prospect.decision_maker_name || prospect.company_name,
        company: prospect.company_name,
        email: prospect.email,
        phone: prospect.phone,
        instagram: prospect.instagram,
        linkedin: prospect.linkedin,
        source: null,
        niche: prospect.niche,
        score: 0,
        tags: prospect.tags || [],
        createdAt: prospect.created_at,
      }));
    },
    enabled: !!user,
  });

  // Only show loading when actually fetching, not when query is disabled
  const isLoading = !!user && ((isLoadingDeals && isFetchingDeals) || (isLoadingContacts && isFetchingContacts));

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: async (input: { 
      title: string; 
      prospectId?: string; 
      stage?: string; 
      value?: number; 
      probability?: number;
      source?: string;
    }) => {
      const { data, error } = await supabase
        .from('prospect_opportunities')
        .insert({
          title: input.title,
          prospect_id: input.prospectId || null,
          stage: input.stage || 'lead',
          estimated_value: input.value || 0,
          probability: input.probability || 20,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      toast.success('Deal criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating deal:', error);
      toast.error('Erro ao criar deal');
    },
  });

  // Update deal mutation
  const updateDealMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ 
      title: string; 
      stage: string; 
      estimated_value: number;
      probability: number;
      origin: string;
      linked_project_id: string;
    }> }) => {
      const { error } = await supabase
        .from('prospect_opportunities')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    },
    onError: (error) => {
      console.error('Error updating deal:', error);
      toast.error('Erro ao atualizar deal');
    },
  });

  // Move deal to stage (for drag-drop)
  const moveDealToStageMutation = useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: string; stage: string }) => {
      const updates: Record<string, unknown> = { stage };
      
      // If moving to "fechado", set won_at
      if (stage === 'fechado') {
        updates.won_at = new Date().toISOString();
        updates.probability = 100;
      }

      const { error } = await supabase
        .from('prospect_opportunities')
        .update(updates)
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
    },
  });

  // Close deal (won or lost)
  const closeDealMutation = useMutation({
    mutationFn: async ({ dealId, won, projectId, lostReason }: { 
      dealId: string; 
      won: boolean; 
      projectId?: string;
      lostReason?: string;
    }) => {
      const updates: Record<string, unknown> = won
        ? { stage: 'fechado', won_at: new Date().toISOString(), probability: 100, linked_project_id: projectId }
        : { stage: 'lost', lost_at: new Date().toISOString(), probability: 0, lost_reason: lostReason };

      const { error } = await supabase
        .from('prospect_opportunities')
        .update(updates)
        .eq('id', dealId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      toast.success(variables.won ? 'Deal fechado como ganho!' : 'Deal fechado como perdido');
    },
  });

  // Delete deal
  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prospect_opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      toast.success('Deal excluído!');
    },
  });

  // Create contact mutation
  const createContactMutation = useMutation({
    mutationFn: async (input: { 
      name: string;
      company: string;
      email?: string;
      phone?: string;
      instagram?: string;
      linkedin?: string;
      source?: string;
      niche?: string;
    }) => {
      const { data, error } = await supabase
        .from('prospects')
        .insert({
          company_name: input.company,
          decision_maker_name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          instagram: input.instagram || null,
          linkedin: input.linkedin || null,
          niche: input.niche || null,
          tags: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      toast.success('Contato criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating contact:', error);
      toast.error('Erro ao criar contato');
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ 
      company_name: string;
      decision_maker_name: string;
      email: string;
      phone: string;
      instagram: string;
      linkedin: string;
      origin: string;
      niche: string;
      tags: string[];
    }> }) => {
      const { error } = await supabase
        .from('prospects')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      toast.success('Contato atualizado!');
    },
  });

  // Delete contact
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      toast.success('Contato excluído!');
    },
  });

  // Calculate metrics
  const metrics = {
    totalDeals: deals.length,
    totalValue: deals.reduce((acc, d) => acc + d.value, 0),
    dealsByStage: CRM_STAGES.reduce((acc, stage) => {
      const stageDeals = deals.filter(d => d.stage === stage.id);
      acc[stage.id] = {
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
      };
      return acc;
    }, {} as Record<string, { count: number; value: number }>),
    forecast: deals
      .filter(d => d.stage !== 'lost' && d.probability > 0)
      .reduce((acc, d) => acc + (d.value * d.probability / 100), 0),
  };

  return {
    // Data
    deals,
    contacts,
    metrics,
    isLoading,
    
    // Deal actions
    createDeal: createDealMutation.mutate,
    updateDeal: updateDealMutation.mutate,
    moveDealToStage: moveDealToStageMutation.mutate,
    closeDeal: closeDealMutation.mutate,
    deleteDeal: deleteDealMutation.mutate,
    
    // Contact actions
    createContact: createContactMutation.mutate,
    updateContact: updateContactMutation.mutate,
    deleteContact: deleteContactMutation.mutate,
    
    // Refetch
    refetchDeals,
    refetchContacts,
    
    // Loading states
    isCreatingDeal: createDealMutation.isPending,
    isCreatingContact: createContactMutation.isPending,
  };
}

// Hook for activities
export function useDealActivities(dealId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['deal-activities', dealId],
    queryFn: async () => {
      if (!dealId) return [];
      
      const { data, error } = await supabase
        .from('prospect_activities')
        .select('*')
        .eq('opportunity_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(a => ({
        id: a.id,
        opportunityId: a.opportunity_id,
        type: a.type,
        title: a.title,
        description: a.description,
        dueAt: a.due_at,
        completedAt: a.completed_at,
        createdAt: a.created_at,
      }));
    },
    enabled: !!user && !!dealId,
  });

  const createActivityMutation = useMutation({
    mutationFn: async (input: { 
      opportunityId: string;
      type?: string;
      title: string;
      description?: string;
      dueAt?: string;
    }) => {
      const { data, error } = await supabase
        .from('prospect_activities')
        .insert({
          opportunity_id: input.opportunityId,
          type: input.type || 'task',
          title: input.title,
          description: input.description || null,
          due_at: input.dueAt || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-activities', dealId] });
      toast.success('Atividade criada!');
    },
  });

  const completeActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('prospect_activities')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', activityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-activities', dealId] });
    },
  });

  return {
    activities,
    isLoading,
    createActivity: createActivityMutation.mutate,
    completeActivity: completeActivityMutation.mutate,
  };
}
