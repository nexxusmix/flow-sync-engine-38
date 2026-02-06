import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// POLO AI - Agent Execution Engine
// Executes planned actions via tools
// ============================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ExecutionStep {
  action: string;
  entity?: string;
  data?: Record<string, unknown>;
  matchBy?: string;
  fromEntity?: string;
  fromId?: string;
  toEntity?: string;
  toId?: string;
  relationType?: string;
  query?: string;
  contractId?: string;
}

interface ExecutionPlan {
  context: {
    client_id?: string;
    project_id?: string;
    contract_id?: string;
    proposal_id?: string;
  };
  steps: ExecutionStep[];
  risk_level: 'low' | 'medium' | 'high';
  needs_confirmation: boolean;
}

interface ActionResult {
  step_index: number;
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  status: 'success' | 'error' | 'skipped';
  before_json?: Record<string, unknown>;
  after_json?: Record<string, unknown>;
  error_message?: string;
  duration_ms: number;
}

// Tool implementations
const tools = {
  // Search for entities
  async search(
    supabase: ReturnType<typeof createClient>,
    entity: string,
    query: string,
    workspaceId: string
  ): Promise<{ data: unknown[] | null; error: string | null }> {
    const entityMap: Record<string, string> = {
      client: 'crm_contacts',
      contact: 'crm_contacts',
      project: 'projects',
      contract: 'contracts',
      proposal: 'proposals',
      content: 'content_items',
      campaign: 'campaigns',
      milestone: 'project_milestones',
      revenue: 'revenues',
    };

    const table = entityMap[entity.toLowerCase()];
    if (!table) {
      return { data: null, error: `Entidade desconhecida: ${entity}` };
    }

    // Search by name, code, or title
    const searchFields = ['name', 'title', 'project_name', 'client_name', 'code'];
    const searchQuery = query.toLowerCase();

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('workspace_id', workspaceId)
      .or(searchFields.map(f => `${f}.ilike.%${searchQuery}%`).join(','))
      .limit(10);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  },

  // Upsert (create or update) entities
  async upsert(
    supabase: ReturnType<typeof createClient>,
    entity: string,
    data: Record<string, unknown>,
    matchBy?: string,
    workspaceId?: string
  ): Promise<{ data: unknown | null; before: unknown | null; error: string | null }> {
    const entityMap: Record<string, string> = {
      project: 'projects',
      contract: 'contracts',
      proposal: 'proposals',
      content: 'content_items',
      campaign: 'campaigns',
      milestone: 'project_milestones',
      revenue: 'revenues',
      expense: 'expenses',
      task: 'tasks',
    };

    const table = entityMap[entity.toLowerCase()];
    if (!table) {
      return { data: null, before: null, error: `Entidade desconhecida: ${entity}` };
    }

    let existingRecord = null;

    // If matchBy is provided, try to find existing record
    if (matchBy && data[matchBy]) {
      const { data: existing } = await supabase
        .from(table)
        .select('*')
        .eq(matchBy, data[matchBy])
        .maybeSingle();
      
      existingRecord = existing;
    }

    // Add workspace_id if not present
    if (workspaceId && !data.workspace_id) {
      data.workspace_id = workspaceId;
    }

    if (existingRecord) {
      // Update existing
      const { data: updated, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', existingRecord.id)
        .select()
        .single();

      return { data: updated, before: existingRecord, error: error?.message || null };
    } else {
      // Insert new
      const { data: inserted, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      return { data: inserted, before: null, error: error?.message || null };
    }
  },

  // Link entities together
  async link(
    supabase: ReturnType<typeof createClient>,
    fromEntity: string,
    fromId: string,
    toEntity: string,
    toId: string,
    relationType: string
  ): Promise<{ success: boolean; error: string | null }> {
    // Handle common relationships
    const relationMap: Record<string, { table: string; fk: string }> = {
      'contract-project': { table: 'contracts', fk: 'project_id' },
      'proposal-project': { table: 'proposals', fk: 'project_id' },
      'content-campaign': { table: 'content_items', fk: 'campaign_id' },
      'content-project': { table: 'content_items', fk: 'project_id' },
      'milestone-project': { table: 'project_milestones', fk: 'project_id' },
      'revenue-project': { table: 'revenues', fk: 'project_id' },
    };

    const key = `${fromEntity.toLowerCase()}-${toEntity.toLowerCase()}`;
    const mapping = relationMap[key];

    if (!mapping) {
      return { success: false, error: `Relacionamento não suportado: ${key}` };
    }

    const { error } = await supabase
      .from(mapping.table)
      .update({ [mapping.fk]: toId })
      .eq('id', fromId);

    return { success: !error, error: error?.message || null };
  },

  // Update contract status
  async updateContractStatus(
    supabase: ReturnType<typeof createClient>,
    contractId: string,
    status: string,
    signedData?: Record<string, unknown>
  ): Promise<{ data: unknown | null; before: unknown | null; error: string | null }> {
    const { data: before } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    const updateData: Record<string, unknown> = { status };
    if (signedData) {
      Object.assign(updateData, signedData);
    }

    const { data: updated, error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single();

    return { data: updated, before, error: error?.message || null };
  },

  // Sync financial data from contract
  async syncFinancialFromContract(
    supabase: ReturnType<typeof createClient>,
    contractId: string,
    milestones?: { description: string; value: number; due_date?: string }[]
  ): Promise<{ created: number; error: string | null }> {
    const { data: contract } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (!contract) {
      return { created: 0, error: 'Contrato não encontrado' };
    }

    let created = 0;

    // Create milestones if provided
    if (milestones && milestones.length > 0) {
      for (const milestone of milestones) {
        const { error } = await supabase
          .from('project_milestones')
          .insert({
            project_id: contract.project_id,
            workspace_id: contract.workspace_id,
            name: milestone.description,
            value: milestone.value,
            due_date: milestone.due_date,
            status: 'pending',
          });

        if (!error) {
          created++;

          // Also create revenue entry
          await supabase
            .from('revenues')
            .insert({
              project_id: contract.project_id,
              workspace_id: contract.workspace_id,
              description: milestone.description,
              value: milestone.value,
              due_date: milestone.due_date,
              status: 'pending',
              contract_id: contractId,
            });
        }
      }
    }

    return { created, error: null };
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { runId, plan, userId, workspaceId } = await req.json() as {
      runId: string;
      plan: ExecutionPlan;
      userId: string;
      workspaceId: string;
    };

    if (!runId || !plan || !userId) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create service role client for execution
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update run status to executing
    await supabase
      .from('agent_runs')
      .update({ status: 'executing' })
      .eq('id', runId);

    const results: ActionResult[] = [];
    const errors: string[] = [];

    // Execute each step
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const startTime = Date.now();
      let result: ActionResult;

      try {
        switch (step.action) {
          case 'search': {
            const searchResult = await tools.search(
              supabase,
              step.entity!,
              step.query!,
              workspaceId
            );
            result = {
              step_index: i,
              action_type: 'search',
              entity_type: step.entity,
              status: searchResult.error ? 'error' : 'success',
              after_json: { results: searchResult.data },
              error_message: searchResult.error || undefined,
              duration_ms: Date.now() - startTime,
            };
            break;
          }

          case 'upsert': {
            const upsertResult = await tools.upsert(
              supabase,
              step.entity!,
              step.data!,
              step.matchBy,
              workspaceId
            );
            result = {
              step_index: i,
              action_type: 'upsert',
              entity_type: step.entity,
              entity_id: (upsertResult.data as { id?: string })?.id,
              status: upsertResult.error ? 'error' : 'success',
              before_json: upsertResult.before as Record<string, unknown> | undefined,
              after_json: upsertResult.data as Record<string, unknown> | undefined,
              error_message: upsertResult.error || undefined,
              duration_ms: Date.now() - startTime,
            };
            break;
          }

          case 'link': {
            const linkResult = await tools.link(
              supabase,
              step.fromEntity!,
              step.fromId!,
              step.toEntity!,
              step.toId!,
              step.relationType!
            );
            result = {
              step_index: i,
              action_type: 'link',
              entity_type: `${step.fromEntity}-${step.toEntity}`,
              status: linkResult.error ? 'error' : 'success',
              error_message: linkResult.error || undefined,
              duration_ms: Date.now() - startTime,
            };
            break;
          }

          case 'update_contract_status': {
            const statusResult = await tools.updateContractStatus(
              supabase,
              step.contractId!,
              step.data?.status as string || 'signed',
              step.data
            );
            result = {
              step_index: i,
              action_type: 'update_contract_status',
              entity_type: 'contract',
              entity_id: step.contractId,
              status: statusResult.error ? 'error' : 'success',
              before_json: statusResult.before as Record<string, unknown> | undefined,
              after_json: statusResult.data as Record<string, unknown> | undefined,
              error_message: statusResult.error || undefined,
              duration_ms: Date.now() - startTime,
            };
            break;
          }

          case 'sync_financial': {
            const syncResult = await tools.syncFinancialFromContract(
              supabase,
              step.contractId!,
              step.data?.milestones as { description: string; value: number; due_date?: string }[]
            );
            result = {
              step_index: i,
              action_type: 'sync_financial',
              entity_type: 'financial',
              status: syncResult.error ? 'error' : 'success',
              after_json: { created: syncResult.created },
              error_message: syncResult.error || undefined,
              duration_ms: Date.now() - startTime,
            };
            break;
          }

          default:
            result = {
              step_index: i,
              action_type: step.action,
              status: 'error',
              error_message: `Ação desconhecida: ${step.action}`,
              duration_ms: Date.now() - startTime,
            };
        }
      } catch (err) {
        result = {
          step_index: i,
          action_type: step.action,
          status: 'error',
          error_message: err instanceof Error ? err.message : 'Erro desconhecido',
          duration_ms: Date.now() - startTime,
        };
      }

      results.push(result);

      // Log action
      await supabase.from('agent_actions').insert({
        run_id: runId,
        step_index: i,
        action_type: result.action_type,
        entity_type: result.entity_type,
        entity_id: result.entity_id,
        input_json: step,
        before_json: result.before_json,
        after_json: result.after_json,
        status: result.status,
        error_message: result.error_message,
        duration_ms: result.duration_ms,
      });

      if (result.status === 'error') {
        errors.push(result.error_message || 'Erro desconhecido');
      }
    }

    // Update run with final status
    const hasErrors = errors.length > 0;
    const allFailed = results.every(r => r.status === 'error');

    await supabase
      .from('agent_runs')
      .update({
        status: allFailed ? 'error' : 'success',
        result_json: { actions: results, errors },
        error_message: hasErrors ? errors.join('; ') : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    return new Response(
      JSON.stringify({
        success: !allFailed,
        results,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[polo-ai-execute] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
