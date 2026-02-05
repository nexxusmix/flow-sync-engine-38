import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// CRM Stage type from database
export interface CRMStage {
  id: string;
  key: string;
  title: string;
  color: string;
  order_index: number;
}

// Normalized types for UI consumption
export interface Deal {
  id: string;
  title: string;
  stage: string;
  value: number;
  contactId: string | null;
  contactName: string;
  company: string;
  source: string | null;
  score: number | null;
  temperature: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  linkedProjectId: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

// Legacy export for backward compatibility - now with full type support
export const CRM_STAGES: CRMStage[] = [
  { id: 'lead', key: 'lead', title: 'Lead', color: 'bg-zinc-500', order_index: 1 },
  { id: 'qualificacao', key: 'qualificacao', title: 'Qualificação', color: 'bg-amber-500', order_index: 2 },
  { id: 'diagnostico', key: 'diagnostico', title: 'Diagnóstico', color: 'bg-purple-500', order_index: 3 },
  { id: 'proposta', key: 'proposta', title: 'Proposta', color: 'bg-blue-500', order_index: 4 },
  { id: 'negociacao', key: 'negociacao', title: 'Negociação', color: 'bg-pink-500', order_index: 5 },
  { id: 'fechado', key: 'fechado', title: 'Fechado', color: 'bg-emerald-500', order_index: 6 },
  { id: 'onboarding', key: 'onboarding', title: 'Onboarding', color: 'bg-cyan-500', order_index: 7 },
  { id: 'pos_venda', key: 'pos_venda', title: 'Pós-Venda', color: 'bg-green-500', order_index: 8 },
];

export function useCRM() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch CRM stages from database
  const { data: stages = CRM_STAGES } = useQuery({
    queryKey: ['crm-stages'],
    queryFn: async (): Promise<CRMStage[]> => {
      const { data, error } = await supabase
        .from('crm_stages')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching stages:', error);
        return [];
      }
      
      return (data || []).map(stage => ({
        id: stage.id,
        key: stage.key,
        title: stage.title,
        color: stage.color || 'bg-zinc-500',
        order_index: stage.order_index,
      }));
    },
    enabled: !!user,
  });

  // Fetch all deals from crm_deals
  const { data: deals = [], isLoading: isLoadingDeals, isFetching: isFetchingDeals, refetch: refetchDeals } = useQuery({
    queryKey: ['crm-deals'],
    queryFn: async (): Promise<Deal[]> => {
      const { data, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          contact:crm_contacts(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deals:', error);
        return [];
      }
      
      return (data || []).map(deal => ({
        id: deal.id,
        title: deal.title,
        stage: deal.stage_key || 'lead',
        value: deal.value || 0,
        contactId: deal.contact_id,
        contactName: deal.contact?.name || 'Sem contato',
        company: deal.contact?.company || '',
        source: deal.source,
        score: deal.score,
        temperature: deal.temperature,
        nextAction: deal.next_action,
        nextActionAt: deal.next_action_at,
        linkedProjectId: deal.project_id,
        lostReason: deal.lost_reason,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at,
      }));
    },
    enabled: !!user,
  });

  // Fetch all contacts from crm_contacts
  const { data: contacts = [], isLoading: isLoadingContacts, isFetching: isFetchingContacts, refetch: refetchContacts } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: async (): Promise<Contact[]> => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        return [];
      }
      
      return (data || []).map(contact => ({
        id: contact.id,
        name: contact.name,
        company: contact.company,
        email: contact.email,
        phone: contact.phone,
        instagram: contact.instagram,
        notes: contact.notes,
        tags: contact.tags || [],
        createdAt: contact.created_at,
      }));
    },
    enabled: !!user,
  });

  const isLoading = !!user && ((isLoadingDeals && isFetchingDeals) || (isLoadingContacts && isFetchingContacts));

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: async (input: { 
      title: string; 
      contactId?: string; 
      stage?: string; 
      value?: number; 
      source?: string;
      temperature?: string;
    }) => {
      const { data, error } = await supabase
        .from('crm_deals')
        .insert({
          title: input.title,
          contact_id: input.contactId || null,
          stage_key: input.stage || 'lead',
          value: input.value || 0,
          source: input.source || null,
          temperature: input.temperature || 'warm',
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
      stage_key: string; 
      value: number;
      source: string;
      temperature: string;
      score: number;
      next_action: string;
      next_action_at: string;
      project_id: string;
      lost_reason: string;
    }> }) => {
      const { error } = await supabase
        .from('crm_deals')
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
      const { error } = await supabase
        .from('crm_deals')
        .update({ stage_key: stage })
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
      const updates = won
        ? { stage_key: 'fechado', project_id: projectId }
        : { stage_key: 'lost', lost_reason: lostReason };

      const { error } = await supabase
        .from('crm_deals')
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
        .from('crm_deals')
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
      company?: string;
      email?: string;
      phone?: string;
      instagram?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert({
          name: input.name,
          company: input.company || null,
          email: input.email || null,
          phone: input.phone || null,
          instagram: input.instagram || null,
          notes: input.notes || null,
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
      name: string;
      company: string;
      email: string;
      phone: string;
      instagram: string;
      notes: string;
      tags: string[];
    }> }) => {
      const { error } = await supabase
        .from('crm_contacts')
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
        .from('crm_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
      toast.success('Contato excluído!');
    },
  });

  // Calculate metrics using stages from DB or fallback
  const stagesForMetrics = stages.length > 0 ? stages : CRM_STAGES;
  
  const metrics = {
    totalDeals: deals.length,
    totalValue: deals.reduce((acc, d) => acc + d.value, 0),
    dealsByStage: stagesForMetrics.reduce((acc, stage) => {
      const stageDeals = deals.filter(d => d.stage === stage.key);
      acc[stage.key] = {
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
      };
      return acc;
    }, {} as Record<string, { count: number; value: number }>),
    forecast: deals
      .filter(d => d.stage !== 'lost' && d.score && d.score > 0)
      .reduce((acc, d) => acc + (d.value * (d.score || 50) / 100), 0),
  };

  return {
    // Data
    deals,
    contacts,
    stages,
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
