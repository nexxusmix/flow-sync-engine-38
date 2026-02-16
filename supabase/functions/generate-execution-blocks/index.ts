import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return new Response(JSON.stringify({ error: 'tasks array required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const prompt = `Você é um especialista em neurociência da produtividade, TDAH e técnicas de execução.
Analise estas tarefas e gere um PLANO DE EXECUÇÃO em blocos otimizados.

TÉCNICAS A APLICAR:
- Eat the Frog (tarefa mais difícil primeiro na manhã)
- Pomodoro (blocos de 25min + 5min pausa)
- Time Boxing (limitar tempo por tarefa)
- 2-Minute Rule (tarefas rápidas primeiro)
- Context Batching (agrupar por contexto similar)
- Alternância Cognitiva (alternar deep/shallow work)
- Energy Management (tarefas pesadas = alta energia)

Retorne APENAS um JSON válido (sem markdown):
{
  "blocks": [
    {
      "id": "block_1",
      "title": "Deep Work — Tarefas Complexas",
      "type": "deep_work|shallow_work|break",
      "technique": "Pomodoro 45min",
      "duration_minutes": 45,
      "tasks": [
        {"id": "task_id", "title": "título", "estimated_minutes": 20, "cognitive_type": "deep|shallow|quick"}
      ]
    }
  ],
  "total_estimated_minutes": 120,
  "tips": ["dica 1 baseada em neurociência", "dica 2"]
}

REGRAS:
- Inclua pausas (type: "break") entre blocos de trabalho intenso
- Tarefas urgentes/com prazo próximo devem vir primeiro
- Agrupe tarefas similares no mesmo bloco
- Estime tempo realista por tarefa
- Máximo 4 tarefas por bloco
- Inclua 2-3 dicas de produtividade baseadas em neurociência

Tarefas:
${JSON.stringify(tasks, null, 2)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);
    const aiResp = await response.json();
    let content = aiResp.choices?.[0]?.message?.content?.trim() || '';
    if (content.startsWith('```json')) content = content.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    else if (content.startsWith('```')) content = content.replace(/^```\s*/, '').replace(/```\s*$/, '');

    const result = JSON.parse(content);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
