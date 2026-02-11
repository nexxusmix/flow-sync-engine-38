import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ============================================
// POLO AI V3 - Execution Engine (Expanded Tools)
// ============================================

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
  status?: string;
  entityId?: string;
}

interface ExecutionPlan {
  context: Record<string, string | undefined>;
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

const ENTITY_MAP: Record<string, string> = {
  client: 'crm_contacts',
  clients: 'crm_contacts',
  contact: 'crm_contacts',
  contacts: 'crm_contacts',
  company: 'crm_companies',
  companies: 'crm_companies',
  project: 'projects',
  projects: 'projects',
  contract: 'contracts',
  contracts: 'contracts',
  proposal: 'proposals',
  proposals: 'proposals',
  content: 'content_items',
  content_item: 'content_items',
  content_items: 'content_items',
  campaign: 'campaigns',
  campaigns: 'campaigns',
  milestone: 'project_milestones',
  milestones: 'project_milestones',
  revenue: 'revenues',
  revenues: 'revenues',
  expense: 'expenses',
  expenses: 'expenses',
  task: 'tasks',
  tasks: 'tasks',
  idea: 'content_ideas',
  ideas: 'content_ideas',
  event: 'calendar_events',
  events: 'calendar_events',
  knowledge: 'knowledge_articles',
};

function resolveTable(entity: string): string | null {
  return ENTITY_MAP[entity.toLowerCase()] || null;
}

// ── Tool implementations ──

async function toolSearch(
  supabase: ReturnType<typeof createClient>,
  entity: string, query: string, workspaceId: string,
): Promise<{ data: unknown[] | null; error: string | null }> {
  const table = resolveTable(entity);
  if (!table) return { data: null, error: `Entidade desconhecida: ${entity}` };

  const searchFields = ['name', 'title', 'project_name', 'client_name', 'code', 'description'];
  const q = query.toLowerCase();

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('workspace_id', workspaceId)
    .or(searchFields.map(f => `${f}.ilike.%${q}%`).join(','))
    .limit(10);

  return { data: data || [], error: error?.message || null };
}

async function toolUpsert(
  supabase: ReturnType<typeof createClient>,
  entity: string, data: Record<string, unknown>,
  matchBy?: string, workspaceId?: string,
): Promise<{ data: unknown | null; before: unknown | null; error: string | null }> {
  const table = resolveTable(entity);
  if (!table) return { data: null, before: null, error: `Entidade desconhecida: ${entity}` };

  let existingRecord: any = null;

  if (matchBy && data[matchBy]) {
    const { data: existing } = await supabase.from(table).select('*').eq(matchBy, data[matchBy]).maybeSingle();
    existingRecord = existing;
  }

  if (workspaceId && !data.workspace_id) data.workspace_id = workspaceId;

  if (existingRecord) {
    const { data: updated, error } = await supabase.from(table).update(data).eq('id', existingRecord.id).select().single();
    return { data: updated, before: existingRecord, error: error?.message || null };
  } else {
    const { data: inserted, error } = await supabase.from(table).insert(data).select().single();
    return { data: inserted, before: null, error: error?.message || null };
  }
}

async function toolLink(
  supabase: ReturnType<typeof createClient>,
  fromEntity: string, fromId: string, toEntity: string, toId: string,
): Promise<{ success: boolean; error: string | null }> {
  const relationMap: Record<string, { table: string; fk: string }> = {
    'contract-project': { table: 'contracts', fk: 'project_id' },
    'proposal-project': { table: 'proposals', fk: 'project_id' },
    'content-campaign': { table: 'content_items', fk: 'campaign_id' },
    'content-project': { table: 'content_items', fk: 'project_id' },
    'milestone-project': { table: 'project_milestones', fk: 'project_id' },
    'revenue-project': { table: 'revenues', fk: 'project_id' },
    'task-project': { table: 'tasks', fk: 'project_id' },
    'event-project': { table: 'calendar_events', fk: 'project_id' },
  };

  const key = `${fromEntity.toLowerCase()}-${toEntity.toLowerCase()}`;
  const mapping = relationMap[key];
  if (!mapping) return { success: false, error: `Relacionamento não suportado: ${key}` };

  const { error } = await supabase.from(mapping.table).update({ [mapping.fk]: toId }).eq('id', fromId);
  return { success: !error, error: error?.message || null };
}

async function toolUpdateStatus(
  supabase: ReturnType<typeof createClient>,
  entity: string, entityId: string, status: string,
): Promise<{ data: unknown | null; before: unknown | null; error: string | null }> {
  const table = resolveTable(entity);
  if (!table) return { data: null, before: null, error: `Entidade desconhecida: ${entity}` };

  const { data: before } = await supabase.from(table).select('*').eq('id', entityId).single();
  const { data: updated, error } = await supabase.from(table).update({ status }).eq('id', entityId).select().single();
  return { data: updated, before, error: error?.message || null };
}

async function toolSyncFinancial(
  supabase: ReturnType<typeof createClient>,
  contractId: string, milestones?: { description: string; value: number; due_date?: string }[],
): Promise<{ created: number; error: string | null }> {
  const { data: contract } = await supabase.from('contracts').select('*').eq('id', contractId).single();
  if (!contract) return { created: 0, error: 'Contrato não encontrado' };

  let created = 0;
  if (milestones && milestones.length > 0) {
    for (const ms of milestones) {
      const { error } = await supabase.from('project_milestones').insert({
        project_id: contract.project_id,
        workspace_id: contract.workspace_id,
        name: ms.description,
        value: ms.value,
        due_date: ms.due_date,
        status: 'pending',
      });
      if (!error) {
        created++;
        await supabase.from('revenues').insert({
          project_id: contract.project_id,
          workspace_id: contract.workspace_id,
          description: ms.description,
          value: ms.value,
          due_date: ms.due_date,
          status: 'pending',
          contract_id: contractId,
        });
      }
    }
  }
  return { created, error: null };
}

async function toolCreateTasks(
  supabase: ReturnType<typeof createClient>,
  data: Record<string, unknown>, workspaceId: string,
): Promise<{ created: number; error: string | null }> {
  const tasks = (data.tasks || []) as { title: string; description?: string; priority?: string; due_date?: string }[];
  let created = 0;
  for (const task of tasks) {
    const { error } = await supabase.from('tasks').insert({
      workspace_id: workspaceId,
      project_id: data.project_id,
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      due_date: task.due_date || null,
      status: 'todo',
    });
    if (!error) created++;
  }
  return { created, error: null };
}

async function toolCreateContent(
  supabase: ReturnType<typeof createClient>,
  data: Record<string, unknown>, workspaceId: string,
): Promise<{ data: unknown | null; error: string | null }> {
  const insertData = { ...data, workspace_id: workspaceId, status: data.status || 'draft' };
  const { data: inserted, error } = await supabase.from('content_items').insert(insertData).select().single();
  return { data: inserted, error: error?.message || null };
}

async function toolCreateEvent(
  supabase: ReturnType<typeof createClient>,
  data: Record<string, unknown>, workspaceId: string,
): Promise<{ data: unknown | null; error: string | null }> {
  const insertData = { ...data, workspace_id: workspaceId, provider: 'manual' };
  const { data: inserted, error } = await supabase.from('calendar_events').insert(insertData).select().single();
  return { data: inserted, error: error?.message || null };
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { runId, plan, userId, workspaceId } = await req.json() as {
      runId: string; plan: ExecutionPlan; userId: string; workspaceId: string;
    };

    if (!runId || !plan || !userId) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('agent_runs').update({ status: 'executing' }).eq('id', runId);

    const results: ActionResult[] = [];
    const errors: string[] = [];

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const t0 = Date.now();
      let result: ActionResult;

      try {
        switch (step.action) {
          case 'search': {
            const r = await toolSearch(supabase, step.entity!, step.query!, workspaceId);
            result = { step_index: i, action_type: 'search', entity_type: step.entity, status: r.error ? 'error' : 'success', after_json: { results: r.data }, error_message: r.error || undefined, duration_ms: Date.now() - t0 };
            break;
          }
          case 'upsert': {
            const r = await toolUpsert(supabase, step.entity!, step.data!, step.matchBy, workspaceId);
            result = { step_index: i, action_type: 'upsert', entity_type: step.entity, entity_id: (r.data as any)?.id, status: r.error ? 'error' : 'success', before_json: r.before as any, after_json: r.data as any, error_message: r.error || undefined, duration_ms: Date.now() - t0 };
            break;
          }
          case 'link': {
            const r = await toolLink(supabase, step.fromEntity!, step.fromId!, step.toEntity!, step.toId!);
            result = { step_index: i, action_type: 'link', entity_type: `${step.fromEntity}-${step.toEntity}`, status: r.error ? 'error' : 'success', error_message: r.error || undefined, duration_ms: Date.now() - t0 };
            break;
          }
          case 'update_status': {
            const r = await toolUpdateStatus(supabase, step.entity!, step.entityId || step.data?.id as string, step.status || step.data?.status as string);
            result = { step_index: i, action_type: 'update_status', entity_type: step.entity, entity_id: step.entityId, status: r.error ? 'error' : 'success', before_json: r.before as any, after_json: r.data as any, error_message: r.error || undefined, duration_ms: Date.now() - t0 };
            break;
          }
          case 'update_contract_status': {
            const r = await toolUpdateStatus(supabase, 'contract', step.contractId!, step.data?.status as string || 'signed');
            result = { step_index: i, action_type: 'update_contract_status', entity_type: 'contract', entity_id: step.contractId, status: r.error ? 'error' : 'success', before_json: r.before as any, after_json: r.data as any, error_message: r.error || undefined, duration_ms: Date.now() - t0 };
            break;
          }
          case 'sync_financial': {
            const r = await toolSyncFinancial(supabase, step.contractId!, step.data?.milestones as any);
            result = { step_index: i, action_type: 'sync_financial', entity_type: 'financial', status: r.error ? 'error' : 'success', after_json: { created: r.created }, error_message: r.error || undefined, duration_ms: Date.now() - t0 };
            break;
          }
          case 'create_tasks': {
            const r = await toolCreateTasks(supabase, step.data || {}, workspaceId);
            result = { step_index: i, action_type: 'create_tasks', entity_type: 'task', status: r.error ? 'error' : 'success', after_json: { created: r.created }, error_message: r.error || undefined, duration_ms: Date.now() - t0 };
            break;
          }
          case 'create_content': {
            const r = await toolCreateContent(supabase, step.data || {}, workspaceId);
            result = { step_index: i, action_type: 'create_content', entity_type: 'content', entity_id: (r.data as any)?.id, status: r.error ? 'error' : 'success', after_json: r.data as any, error_message: r.error || undefined, duration_ms: Date.now() - t0 };
            break;
          }
          case 'create_event': {
            const r = await toolCreateEvent(supabase, step.data || {}, workspaceId);
            result = { step_index: i, action_type: 'create_event', entity_type: 'event', entity_id: (r.data as any)?.id, status: r.error ? 'error' : 'success', after_json: r.data as any, error_message: r.error || undefined, duration_ms: Date.now() - t0 };
            break;
          }
          default:
            result = { step_index: i, action_type: step.action, status: 'error', error_message: `Ação desconhecida: ${step.action}`, duration_ms: Date.now() - t0 };
        }
      } catch (err) {
        result = { step_index: i, action_type: step.action, status: 'error', error_message: err instanceof Error ? err.message : 'Erro desconhecido', duration_ms: Date.now() - t0 };
      }

      results.push(result);

      await supabase.from('agent_actions').insert({
        run_id: runId, step_index: i, action_type: result.action_type,
        entity_type: result.entity_type, entity_id: result.entity_id,
        input_json: step, before_json: result.before_json, after_json: result.after_json,
        status: result.status, error_message: result.error_message, duration_ms: result.duration_ms,
      });

      if (result.status === 'error') errors.push(result.error_message || 'Erro desconhecido');
    }

    const allFailed = results.every(r => r.status === 'error');
    await supabase.from('agent_runs').update({
      status: allFailed ? 'error' : 'success',
      result_json: { actions: results, errors },
      error_message: errors.length > 0 ? errors.join('; ') : null,
      completed_at: new Date().toISOString(),
    }).eq('id', runId);

    return new Response(JSON.stringify({ success: !allFailed, results, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[polo-ai-execute] Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
