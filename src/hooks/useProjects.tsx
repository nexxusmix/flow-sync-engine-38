import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

// Types from Supabase schema
type DBProject = Database['public']['Tables']['projects']['Row'];
type DBProjectStage = Database['public']['Tables']['project_stages']['Row'];

export interface ProjectWithStages extends DBProject {
  stages: DBProjectStage[];
}

export interface PaymentMilestoneInput {
  title: string;
  percentage?: number;
  amount: number;
  dueDate?: string;
  trigger?: string;
}

export interface CreateProjectInput {
  name: string;
  client_name: string;
  description?: string;
  template?: string;
  start_date?: string;
  due_date?: string;
  contract_value?: number;
  has_payment_block?: boolean;
  payment_milestones?: PaymentMilestoneInput[];
  client_document?: string;
  payment_terms?: string;
}

export type { DBProject, DBProjectStage };

const DEFAULT_STAGES = [
  { stage_key: 'briefing', title: 'Briefing', order_index: 1 },
  { stage_key: 'roteiro', title: 'Roteiro', order_index: 2 },
  { stage_key: 'pre_producao', title: 'Pré-Produção', order_index: 3 },
  { stage_key: 'captacao', title: 'Captação', order_index: 4 },
  { stage_key: 'edicao', title: 'Edição', order_index: 5 },
  { stage_key: 'revisao', title: 'Revisão', order_index: 6 },
  { stage_key: 'aprovacao', title: 'Aprovação', order_index: 7 },
  { stage_key: 'entrega', title: 'Entrega', order_index: 8 },
  { stage_key: 'pos_venda', title: 'Pós-Venda', order_index: 9 },
];

export function useProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch all projects with their stages
  const { data: projects = [], isLoading: queryLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }

      // Fetch stages for all projects
      const projectIds = projectsData?.map(p => p.id) || [];
      
      if (projectIds.length === 0) {
        return [];
      }

      const { data: stagesData, error: stagesError } = await supabase
        .from('project_stages')
        .select('*')
        .in('project_id', projectIds)
        .order('order_index', { ascending: true });

      if (stagesError) {
        console.error('Error fetching stages:', stagesError);
        // Don't throw, just return projects without stages
      }

      // Combine projects with their stages
      const projectsWithStages: ProjectWithStages[] = (projectsData || []).map(project => ({
        ...project,
        stages: (stagesData || []).filter(stage => stage.project_id === project.id),
      }));

      return projectsWithStages;
    },
    enabled: !!user,
  });

  // Loading only when user exists and query is actively loading
  const isLoading = !!user && queryLoading;

  // Get a single project by ID
  const getProject = async (id: string): Promise<ProjectWithStages | null> => {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return null;
    }

    const { data: stages, error: stagesError } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', id)
      .order('order_index', { ascending: true });

    if (stagesError) {
      console.error('Error fetching stages:', stagesError);
      return { ...project, stages: [] };
    }

    return { ...project, stages: stages || [] };
  };

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (input: CreateProjectInput & { banner_style?: string }) => {
      // Create the project without FK references to avoid constraint errors
      const productType = (input as any).product_type || 'production';

      // Resolve owner full_name from profiles
      let ownerName = user?.email?.split('@')[0] || null;
      let ownerId: string | null = null;
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('user_id', user.id)
          .single();
        if (profile) {
          ownerName = profile.full_name || ownerName;
          ownerId = profile.id;
        }
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: input.name,
          client_name: input.client_name,
          description: input.description || null,
          template: input.template || null,
          start_date: input.start_date || null,
          due_date: input.due_date || null,
          contract_value: input.contract_value || 0,
          has_payment_block: input.has_payment_block || false,
          owner_name: ownerName,
          owner_id: ownerId,
          stage_current: 'briefing',
          status: 'active',
          health_score: 100,
          product_type: productType,
        } as any)
        .select()
        .single();

      if (projectError) throw projectError;

      // Create default stages for the project
      const stagesToCreate = DEFAULT_STAGES.map(stage => ({
        project_id: project.id,
        stage_key: stage.stage_key,
        title: stage.title,
        order_index: stage.order_index,
        status: stage.order_index === 1 ? 'in_progress' : 'not_started',
      }));

      const { error: stagesError } = await supabase
        .from('project_stages')
        .insert(stagesToCreate);

      if (stagesError) {
        console.error('Error creating stages:', stagesError);
      }

      // Create calendar event for due date
      if (input.due_date) {
        await supabase.from('calendar_events').insert({
          title: `Entrega: ${input.name}`,
          description: `Data prevista de entrega do projeto`,
          start_at: `${input.due_date}T09:00:00`,
          end_at: `${input.due_date}T18:00:00`,
          event_type: 'deadline',
          project_id: project.id,
        });
      }

      // AUTO-CREATE CONTRACT AND REVENUES if contract_value > 0
      if ((input.contract_value || 0) > 0) {
        // Create contract
        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .insert({
            project_id: project.id,
            project_name: input.name,
            client_name: input.client_name,
            client_document: input.client_document || null,
            total_value: input.contract_value,
            payment_terms: input.payment_terms || '50/50',
            status: 'active',
            start_date: input.start_date || new Date().toISOString().split('T')[0],
          })
          .select('id')
          .single();

        if (contractError) {
          console.error('Error creating contract:', contractError);
        } else {
          const contractId = contractData?.id;

          // Use extracted milestones if available, otherwise default 50/50
          if (input.payment_milestones && input.payment_milestones.length > 0) {
            const revenueInserts = input.payment_milestones.map((m) => ({
              project_id: project.id,
              contract_id: contractId || null,
              description: `${input.name} - ${m.title}`,
              amount: m.amount || (m.percentage && input.contract_value ? Math.round((m.percentage / 100) * input.contract_value * 100) / 100 : 0),
              due_date: m.dueDate || new Date().toISOString().split('T')[0],
              status: 'pending' as const,
              created_by: user?.id,
            }));
            await supabase.from('revenues').insert(revenueInserts);
          } else {
            // Default 50/50
            const entryAmount = (input.contract_value || 0) * 0.5;
            await supabase.from('revenues').insert([
              {
                project_id: project.id,
                contract_id: contractId || null,
                description: `${input.name} - Entrada (50%)`,
                amount: entryAmount,
                due_date: new Date().toISOString().split('T')[0],
                status: 'pending',
                created_by: user?.id,
              },
              {
                project_id: project.id,
                contract_id: contractId || null,
                description: `${input.name} - Entrega (50%)`,
                amount: (input.contract_value || 0) * 0.5,
                due_date: input.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending',
                created_by: user?.id,
              },
            ]);
          }

          // Log event
          await supabase.from('event_logs').insert({
            action: 'project_created_with_contract',
            entity_type: 'project',
            entity_id: project.id,
            details: { contract_id: contractId, milestones_count: input.payment_milestones?.length || 2 },
          });
        }
      }

      // AUTO-GENERATE BANNER with AI
      if (input.banner_style) {
        // Fire and forget - don't block project creation
        supabase.functions.invoke('generate-project-art', {
          body: {
            project_id: project.id,
            art_type: 'banner',
            style: input.banner_style,
          },
        }).catch(err => {
          console.error('Error auto-generating banner:', err);
        });
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Projeto criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast.error('Erro ao criar projeto');
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DBProject> }) => {
      const { data: project, error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If contract_value was updated and > 0, ensure contract and revenues exist
      if (data.contract_value && data.contract_value > 0) {
        // Check if contract exists
        const { data: existingContract } = await supabase
          .from('contracts')
          .select('id')
          .eq('project_id', id)
          .single();

        if (!existingContract) {
          // Create contract
          await supabase.from('contracts').insert({
            project_id: id,
            project_name: project.name,
            client_name: project.client_name,
            total_value: data.contract_value,
            payment_terms: '50/50',
            status: 'active',
            start_date: project.start_date || new Date().toISOString().split('T')[0],
          });

          // Create revenues (50/50 split)
          const entryAmount = data.contract_value * 0.5;
          const deliveryAmount = data.contract_value * 0.5;
          const deliveryDate = project.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          await supabase.from('revenues').insert([
            {
              project_id: id,
              description: `${project.name} - Entrada (50%)`,
              amount: entryAmount,
              due_date: new Date().toISOString().split('T')[0],
              status: 'pending',
              created_by: user?.id,
            },
            {
              project_id: id,
              description: `${project.name} - Entrega (50%)`,
              amount: deliveryAmount,
              due_date: deliveryDate,
              status: 'pending',
              created_by: user?.id,
            },
          ]);
        } else {
          // Update existing contract value
          await supabase.from('contracts').update({ total_value: data.contract_value }).eq('id', existingContract.id);
        }
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Projeto atualizado!');
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast.error('Erro ao atualizar projeto');
    },
  });

  // Complete project (mark as finished)
  const completeProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: 'completed',
          stage_current: 'entrega',
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projeto finalizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error completing project:', error);
      toast.error('Erro ao finalizar projeto');
    },
  });

  // Archive project
  const archiveProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projeto arquivado!');
    },
    onError: (error) => {
      console.error('Error archiving project:', error);
      toast.error('Erro ao arquivar projeto');
    },
  });

  // Delete project
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projeto excluído!');
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      toast.error('Erro ao excluir projeto');
    },
  });

  // Update stage status
  const updateStageMutation = useMutation({
    mutationFn: async ({ stageId, data }: { stageId: string; data: Partial<DBProjectStage> }) => {
      const { error } = await supabase
        .from('project_stages')
        .update(data)
        .eq('id', stageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Move project to stage
  const moveToStageMutation = useMutation({
    mutationFn: async ({ projectId, stageKey }: { projectId: string; stageKey: string }) => {
      const { error } = await supabase
        .from('projects')
        .update({ stage_current: stageKey })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projeto movido para nova etapa!');
    },
  });

  return {
    projects,
    isLoading,
    error,
    refetch,
    getProject,
    createProject: createProjectMutation.mutate,
    updateProject: updateProjectMutation.mutate,
    completeProject: completeProjectMutation.mutate,
    archiveProject: archiveProjectMutation.mutate,
    deleteProject: deleteProjectMutation.mutate,
    updateStage: updateStageMutation.mutate,
    moveToStage: moveToStageMutation.mutate,
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
  };
}

// Hook for single project
export function useProject(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;

      const { data: stages, error: stagesError } = await supabase
        .from('project_stages')
        .select('*')
        .eq('project_id', id)
        .order('order_index', { ascending: true });

      if (stagesError) throw stagesError;

      return { ...project, stages: stages || [] } as ProjectWithStages;
    },
    enabled: !!user && !!id,
  });
}
