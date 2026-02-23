import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { tasks, command, action } = await req.json();

    // If action is provided, execute it directly
    if (action) {
      return await executeAction(sb, user.id, tasks, action);
    }

    // Otherwise, interpret the command with AI
    if (!command || typeof command !== 'string') {
      return new Response(JSON.stringify({ error: 'command string required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const prompt = `Você é um assistente de produtividade que interpreta comandos em linguagem natural sobre tarefas.

Analise o comando do usuário e as tarefas fornecidas. Retorne um JSON com a seguinte estrutura EXATA (sem markdown):

{
  "intent": "delete_duplicates|delete_completed|delete_dormant|archive_completed|reorganize_priority|create_week_plan|consolidate_similar|redistribute_backlog|auto_optimize_all|delete_no_category|move_category|custom",
  "action_type": "destructive|organizational|strategic|automation",
  "summary": "Descrição clara do que será feito",
  "requires_confirmation": true/false,
  "affected_task_ids": ["id1", "id2"],
  "details": {
    "count": número de tarefas afetadas,
    "description": "detalhe da ação",
    "changes": [{"id": "task_id", "field": "campo", "old_value": "antigo", "new_value": "novo"}]
  }
}

REGRAS DE INTERPRETAÇÃO:
- "apagar duplicados" ou "remover duplicados" → intent: delete_duplicates, identifique tarefas com títulos muito similares
- "excluir concluídas" ou "apagar terminadas" → intent: delete_completed
- "apagar dormentes" ou "remover dormindo" → intent: delete_dormant (tarefas sem atualização há mais de 7 dias que NÃO estão em done)
- "reorganizar" ou "priorizar" → intent: reorganize_priority
- "criar plano semanal" ou "planejar semana" → intent: create_week_plan
- "consolidar" ou "juntar parecidas" → intent: consolidate_similar
- "distribuir backlog" → intent: redistribute_backlog
- "otimizar tudo" ou "limpeza total" → intent: auto_optimize_all
- "apagar sem categoria" → intent: delete_no_category
- "mover pessoais para vida" → intent: move_category
- Ações que deletam → action_type: destructive, requires_confirmation: true
- Ações que reorganizam → action_type: organizational
- Ações que planejam → action_type: strategic

Data atual: ${new Date().toISOString().split('T')[0]}

Comando do usuário: "${command}"

Tarefas (${tasks.length} total):
${JSON.stringify(tasks.map((t: any) => ({ id: t.id, title: t.title, status: t.status, category: t.category, due_date: t.due_date, tags: t.tags, updated_at: t.updated_at, completed_at: t.completed_at })), null, 2)}`;

    const aiResp = await chatCompletion({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 8192,
    });
    let content = aiResp.choices?.[0]?.message?.content?.trim() || '';
    // Clean markdown wrappers
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      content = content.replace(/,\s*([}\]])/g, '$1').replace(/\/\/[^\n]*/g, '');
      try { result = JSON.parse(content); } catch {
        return new Response(JSON.stringify({ error: 'A IA retornou formato inválido. Tente reformular o comando.' }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

async function executeAction(sb: any, userId: string, tasks: any[], action: any) {
  const results: any = { success: true, affected_ids: [], action: action.intent, summary: '' };

  try {
    switch (action.intent) {
      case 'delete_duplicates':
      case 'delete_completed':
      case 'delete_dormant':
      case 'delete_no_category': {
        const ids = action.affected_task_ids || [];
        if (ids.length === 0) break;
        const { error } = await sb.from('tasks').delete().in('id', ids);
        if (error) throw error;
        results.affected_ids = ids;
        results.summary = `${ids.length} tarefas removidas com sucesso.`;
        break;
      }
      case 'archive_completed': {
        const ids = action.affected_task_ids || [];
        if (ids.length === 0) break;
        const { error } = await sb.from('tasks').delete().in('id', ids);
        if (error) throw error;
        results.affected_ids = ids;
        results.summary = `${ids.length} tarefas concluídas arquivadas (removidas).`;
        break;
      }
      case 'reorganize_priority':
      case 'redistribute_backlog':
      case 'move_category':
      case 'consolidate_similar':
      case 'create_week_plan': {
        const changes = action.details?.changes || [];
        for (const change of changes) {
          if (!change.id || !change.field) continue;
          const update: Record<string, any> = {};
          update[change.field] = change.new_value;
          const { error } = await sb.from('tasks').update(update).eq('id', change.id);
          if (error) console.error('Update error for', change.id, error);
          else results.affected_ids.push(change.id);
        }
        results.summary = `${results.affected_ids.length} tarefas atualizadas.`;
        break;
      }
      case 'auto_optimize_all': {
        // Execute deletions first
        const deleteIds = action.affected_task_ids || [];
        if (deleteIds.length > 0) {
          await sb.from('tasks').delete().in('id', deleteIds);
          results.affected_ids.push(...deleteIds);
        }
        // Then apply changes
        const changes = action.details?.changes || [];
        for (const change of changes) {
          if (!change.id || !change.field) continue;
          const update: Record<string, any> = {};
          update[change.field] = change.new_value;
          await sb.from('tasks').update(update).eq('id', change.id);
          if (!results.affected_ids.includes(change.id)) results.affected_ids.push(change.id);
        }
        results.summary = `Otimização completa: ${results.affected_ids.length} tarefas processadas.`;
        break;
      }
      default:
        results.summary = 'Ação não reconhecida.';
    }
  } catch (err) {
    console.error('Execute error:', err);
    results.success = false;
    results.summary = `Erro ao executar: ${err.message}`;
  }

  return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
