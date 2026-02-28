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

    const { tasks } = await req.json();
    if (!tasks || !Array.isArray(tasks)) {
      return new Response(JSON.stringify({ error: 'tasks array required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Pre-compute stats locally so AI only needs to add insights
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const byStatus: Record<string, number> = { backlog: 0, week: 0, today: 0, done: 0 };
    const byCat: Record<string, number> = { pessoal: 0, operacao: 0, projeto: 0 };
    const overdueTasks: string[] = [];
    const dormantTasks: string[] = [];

    for (const t of tasks) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byCat[t.category] = (byCat[t.category] || 0) + 1;
      if (t.due_date && t.due_date < nowStr && t.status !== 'done') {
        overdueTasks.push(t.title);
      }
      if (t.updated_at && t.updated_at < sevenDaysAgo && t.status !== 'done') {
        dormantTasks.push(t.title);
      }
    }

    // Only send compact task list to AI for insights/duplicates
    const taskSummary = tasks
      .filter((t: any) => t.status !== 'done')
      .slice(0, 60)
      .map((t: any) => `"${t.title}" [${t.status}/${t.category}]`)
      .join('\n');

    const prompt = `Analise estas tarefas e retorne APENAS um JSON (sem markdown):
{"duplicates":{"count":N,"groups":[["título1","título2"]]},"insights":["max 3 insights curtos"],"recommendations":["max 3 recomendações curtas"]}

REGRAS: insights e recommendations máximo 3 itens cada, frases curtas (max 15 palavras). duplicates só títulos muito similares.

Tarefas:\n${taskSummary}`;

    const aiResp = await chatCompletion({
      model: 'google/gemini-2.5-flash-lite',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1500,
    });
    let content = aiResp.choices?.[0]?.message?.content?.trim() || '';
    if (content.startsWith('```json')) content = content.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    else if (content.startsWith('```')) content = content.replace(/^```\s*/, '').replace(/```\s*$/, '');

    let aiResult: any = {};
    try {
      aiResult = JSON.parse(content);
    } catch {
      content = content.replace(/,\s*([}\]])/g, '$1').replace(/\/\/[^\n]*/g, '');
      try { aiResult = JSON.parse(content); } catch { aiResult = {}; }
    }

    const result = {
      total: tasks.length,
      by_status: byStatus,
      by_category: byCat,
      overdue: { count: overdueTasks.length, tasks: overdueTasks.slice(0, 5) },
      dormant: { count: dormantTasks.length, tasks: dormantTasks.slice(0, 5) },
      duplicates: aiResult.duplicates || { count: 0, groups: [] },
      insights: aiResult.insights || ["Análise processada com dados locais."],
      recommendations: aiResult.recommendations || ["Mantenha suas tarefas atualizadas."],
    };
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
