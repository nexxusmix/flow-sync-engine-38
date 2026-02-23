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

    const prompt = `Analise estas tarefas e retorne um JSON com a seguinte estrutura EXATA (sem markdown, sem explicações):
{
  "total": número,
  "by_status": {"backlog": N, "week": N, "today": N, "done": N},
  "by_category": {"pessoal": N, "operacao": N, "projeto": N},
  "overdue": {"count": N, "tasks": ["título1", "título2"]},
  "dormant": {"count": N, "tasks": ["título de tarefas sem atualização há +7 dias"]},
  "duplicates": {"count": N, "groups": [["tarefa similar 1", "tarefa similar 2"]]},
  "insights": ["insight 1", "insight 2"],
  "recommendations": ["recomendação 1", "recomendação 2"]
}

Data atual: ${new Date().toISOString().split('T')[0]}

Tarefas:
${JSON.stringify(tasks, null, 2)}`;

    const aiResp = await chatCompletion({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4096,
    });
    let content = aiResp.choices?.[0]?.message?.content?.trim() || '';
    if (content.startsWith('```json')) content = content.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    else if (content.startsWith('```')) content = content.replace(/^```\s*/, '').replace(/```\s*$/, '');

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      content = content
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      try {
        result = JSON.parse(content);
      } catch (e2) {
        console.error('JSON parse failed after sanitization:', e2, 'Content:', content.substring(0, 500));
        return new Response(JSON.stringify({ error: 'A IA retornou formato inválido. Tente novamente.' }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
