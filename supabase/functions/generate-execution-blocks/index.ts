import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function sanitizeAndParse(raw: string): any {
  let content = raw.trim();
  // Remove markdown fences
  if (content.startsWith('```json')) content = content.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  else if (content.startsWith('```')) content = content.replace(/^```\s*/, '').replace(/```\s*$/, '');

  // First try direct parse
  try { return JSON.parse(content); } catch {}

  // Sanitize: trailing commas, comments
  content = content
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Try to fix truncated JSON by closing open structures
  try { return JSON.parse(content); } catch {}

  // Attempt to find last valid closing and truncate
  const lastBrace = content.lastIndexOf('}');
  const lastBracket = content.lastIndexOf(']');
  if (lastBrace > 0 || lastBracket > 0) {
    const cutAt = Math.max(lastBrace, lastBracket) + 1;
    let truncated = content.substring(0, cutAt);
    // Try to close any open structures
    const openBraces = (truncated.match(/{/g) || []).length - (truncated.match(/}/g) || []).length;
    const openBrackets = (truncated.match(/\[/g) || []).length - (truncated.match(/]/g) || []).length;
    for (let i = 0; i < openBrackets; i++) truncated += ']';
    for (let i = 0; i < openBraces; i++) truncated += '}';
    try { return JSON.parse(truncated); } catch {}
  }

  return null;
}

function prioritizeTasks(tasks: any[], limit: number): any[] {
  // Sort: tasks with due_date first (earliest first), then by creation order
  const sorted = [...tasks].sort((a, b) => {
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    return 0;
  });
  return sorted.slice(0, limit);
}

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

    const { tasks } = await req.json();
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return new Response(JSON.stringify({ error: 'tasks array required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Limit to top 20 most urgent tasks
    const limitedTasks = prioritizeTasks(tasks, 20);

    const prompt = `Você é um especialista em neurociência da produtividade, TDAH e técnicas de execução.
Analise estas tarefas e gere um PLANO DE EXECUÇÃO em blocos otimizados.

TÉCNICAS A APLICAR:
- Eat the Frog (tarefa mais difícil primeiro)
- Pomodoro (blocos de 25min + 5min pausa)
- Time Boxing (limitar tempo por tarefa)
- 2-Minute Rule (tarefas rápidas primeiro)
- Context Batching (agrupar por contexto similar)

REGRAS OBRIGATÓRIAS DE FORMATO:
- Retorne APENAS JSON puro, sem markdown, sem comentários
- Use APENAS aspas duplas
- Máximo 6 blocos no total
- Máximo 4 tarefas por bloco
- 2-3 dicas curtas
- Inclua pausas (type: "break") entre blocos intensos

Formato exato:
{"blocks":[{"id":"block_1","title":"Título","type":"deep_work","technique":"Pomodoro 25min","duration_minutes":25,"tasks":[{"id":"id","title":"título","estimated_minutes":15,"cognitive_type":"deep"}]}],"total_estimated_minutes":60,"tips":["dica 1","dica 2"]}

Tarefas (${limitedTasks.length} de ${tasks.length} total):
${JSON.stringify(limitedTasks)}`;

    const callAI = async (taskList: any[], maxTokens: number) => {
      const p = taskList === limitedTasks ? prompt : prompt.replace(
        `Tarefas (${limitedTasks.length} de ${tasks.length} total):\n${JSON.stringify(limitedTasks)}`,
        `Tarefas (${taskList.length}):\n${JSON.stringify(taskList)}`
      );
      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}` },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: p }],
          temperature: 0.3,
          max_tokens: maxTokens,
        }),
      });
      if (!resp.ok) throw new Error(`AI error: ${resp.status}`);
      const aiResp = await resp.json();
      return aiResp.choices?.[0]?.message?.content?.trim() || '';
    };

    // First attempt with full 20 tasks
    let content = await callAI(limitedTasks, 8192);
    let result = sanitizeAndParse(content);

    // Retry with fewer tasks if parse failed
    if (!result) {
      console.warn('First parse failed, retrying with top 10 tasks');
      const fewerTasks = limitedTasks.slice(0, 10);
      content = await callAI(fewerTasks, 8192);
      result = sanitizeAndParse(content);
    }

    if (!result) {
      console.error('JSON parse failed after retry. Content:', content?.substring(0, 500));
      return new Response(JSON.stringify({ error: 'A IA retornou formato inválido. Tente novamente.' }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
