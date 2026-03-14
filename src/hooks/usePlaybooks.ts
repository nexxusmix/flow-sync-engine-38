import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlaybookStep {
  id: string;
  phase_id: string;
  playbook_id: string;
  title: string;
  description: string | null;
  step_type: string;
  is_required: boolean;
  sort_order: number;
  relative_day_offset: number;
  assigned_role: string | null;
  depends_on_step_id: string | null;
  evidence_required: string | null;
  metadata: Record<string, any>;
}

export interface PlaybookPhase {
  id: string;
  playbook_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  relative_start_days: number;
  relative_duration_days: number | null;
  steps?: PlaybookStep[];
}

export interface Playbook {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  objective: string | null;
  category: string;
  playbook_type: string;
  when_to_use: string | null;
  tags: string[];
  status: string;
  version_number: number;
  is_template: boolean;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  phases?: PlaybookPhase[];
}

export interface PlaybookApplication {
  id: string;
  playbook_id: string | null;
  applied_to_entity_type: string;
  applied_to_entity_id: string;
  applied_by: string | null;
  status: string;
  completed_steps: number;
  total_steps: number;
  started_at: string;
  completed_at: string | null;
}

export const PLAYBOOK_CATEGORIES = [
  { key: 'onboarding', label: 'Onboarding', icon: 'rocket_launch' },
  { key: 'projeto', label: 'Projeto', icon: 'movie_filter' },
  { key: 'campanha', label: 'Campanha', icon: 'campaign' },
  { key: 'comercial', label: 'Comercial', icon: 'handshake' },
  { key: 'financeiro', label: 'Financeiro', icon: 'payments' },
  { key: 'entrega', label: 'Entrega', icon: 'local_shipping' },
  { key: 'qa', label: 'QA / Revisão', icon: 'fact_check' },
  { key: 'operacao', label: 'Operação', icon: 'settings' },
  { key: 'pos-venda', label: 'Pós-venda', icon: 'support_agent' },
  { key: 'renovacao', label: 'Renovação', icon: 'autorenew' },
];

export function usePlaybooks() {
  const qc = useQueryClient();

  const { data: playbooks = [], isLoading } = useQuery({
    queryKey: ['playbooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playbooks')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as Playbook[]) || [];
    },
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['playbook-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playbook_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as PlaybookApplication[]) || [];
    },
  });

  return { playbooks, applications, isLoading };
}

export function usePlaybookDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['playbook', id],
    enabled: !!id,
    queryFn: async () => {
      const { data: pb, error } = await supabase
        .from('playbooks')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;

      const { data: phases } = await supabase
        .from('playbook_phases')
        .select('*')
        .eq('playbook_id', id!)
        .order('sort_order');

      const { data: steps } = await supabase
        .from('playbook_steps')
        .select('*')
        .eq('playbook_id', id!)
        .order('sort_order');

      const phasesWithSteps = (phases || []).map((ph: any) => ({
        ...ph,
        steps: (steps || []).filter((s: any) => s.phase_id === ph.id),
      }));

      return { ...(pb as unknown as Playbook), phases: phasesWithSteps } as Playbook;
    },
  });
}

export function useSavePlaybook() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playbook,
      phases,
    }: {
      playbook: Partial<Playbook> & { title: string };
      phases?: { title: string; description?: string; sort_order: number; steps: { title: string; description?: string; step_type?: string; is_required?: boolean; sort_order: number; assigned_role?: string; relative_day_offset?: number }[] }[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      let pbId = playbook.id;

      if (pbId) {
        const { error } = await supabase.from('playbooks').update({
          title: playbook.title,
          description: playbook.description,
          objective: playbook.objective,
          category: playbook.category,
          playbook_type: playbook.playbook_type,
          when_to_use: playbook.when_to_use,
          tags: playbook.tags,
          status: playbook.status,
          updated_at: new Date().toISOString(),
        } as any).eq('id', pbId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('playbooks').insert([{
          title: playbook.title,
          description: playbook.description,
          objective: playbook.objective,
          category: playbook.category || 'operacao',
          playbook_type: playbook.playbook_type || 'process',
          when_to_use: playbook.when_to_use,
          tags: playbook.tags || [],
          status: playbook.status || 'draft',
          is_template: playbook.is_template || false,
          created_by: userData.user.id,
        }] as any).select().single();
        if (error) throw error;
        pbId = (data as any).id;
      }

      if (phases && pbId) {
        // Clear existing phases/steps
        await supabase.from('playbook_phases').delete().eq('playbook_id', pbId);

        for (const phase of phases) {
          const { data: phData, error: phErr } = await supabase.from('playbook_phases').insert([{
            playbook_id: pbId,
            title: phase.title,
            description: phase.description,
            sort_order: phase.sort_order,
          }] as any).select().single();
          if (phErr) throw phErr;

          if (phase.steps.length > 0) {
            const stepsToInsert = phase.steps.map(s => ({
              phase_id: (phData as any).id,
              playbook_id: pbId,
              title: s.title,
              description: s.description,
              step_type: s.step_type || 'task',
              is_required: s.is_required ?? true,
              sort_order: s.sort_order,
              assigned_role: s.assigned_role,
              relative_day_offset: s.relative_day_offset || 0,
            }));
            const { error: stErr } = await supabase.from('playbook_steps').insert(stepsToInsert as any);
            if (stErr) throw stErr;
          }
        }
      }

      return pbId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
      toast.success('Playbook salvo!');
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao salvar playbook'),
  });
}

export function useDeletePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('playbooks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
      toast.success('Playbook excluído');
    },
  });
}

export function useApplyPlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      playbookId,
      entityType,
      entityId,
    }: {
      playbookId: string;
      entityType: string;
      entityId: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Get playbook with phases/steps
      const { data: pb } = await supabase.from('playbooks').select('*').eq('id', playbookId).single();
      if (!pb) throw new Error('Playbook not found');

      const { data: phases } = await supabase.from('playbook_phases').select('*').eq('playbook_id', playbookId).order('sort_order');
      const { data: steps } = await supabase.from('playbook_steps').select('*').eq('playbook_id', playbookId).order('sort_order');

      const totalSteps = (steps || []).length;

      // Create application
      const { data: app, error: appErr } = await supabase.from('playbook_applications').insert([{
        playbook_id: playbookId,
        playbook_version: (pb as any).version_number,
        applied_to_entity_type: entityType,
        applied_to_entity_id: entityId,
        applied_by: userData.user.id,
        total_steps: totalSteps,
      }] as any).select().single();
      if (appErr) throw appErr;

      // Create application steps
      if (steps && steps.length > 0) {
        const phaseMap = new Map((phases || []).map((p: any) => [p.id, p.title]));
        const appSteps = (steps as any[]).map((s, i) => ({
          application_id: (app as any).id,
          step_id: s.id,
          phase_title: phaseMap.get(s.phase_id) || '',
          step_title: s.title,
          is_required: s.is_required,
          sort_order: i,
        }));
        await supabase.from('playbook_application_steps').insert(appSteps as any);
      }

      // Increment usage count
      await supabase.from('playbooks').update({ usage_count: ((pb as any).usage_count || 0) + 1 } as any).eq('id', playbookId);

      return (app as any).id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
      qc.invalidateQueries({ queryKey: ['playbook-applications'] });
      toast.success('Playbook aplicado com sucesso!');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
