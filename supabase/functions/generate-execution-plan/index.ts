import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { task } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um especialista em neurociência cognitiva, psicologia comportamental e ciência de produtividade (Deep Work, carga cognitiva, fadiga decisional).

Analise a tarefa fornecida e gere um plano de execução inteligente. Responda APENAS com a tool call solicitada.

Regras:
- estimate_min/estimate_max em minutos (range realista)
- energy_level: "baixa", "media" ou "alta"
- work_mode: "deep_work" (foco profundo), "admin" (operacional), "criativo" (ideação/design), "comunicacao" (reuniões/emails)
- cognitive_load: 0-100 (carga mental necessária)
- break_pattern: formato "trabalho/pausa" em minutos (ex: "50/10", "25/5", "90/20")
- next_action: a primeira micro-ação que leva menos de 2 minutos (regra dos 2 min)
- micro_steps: 3-7 passos claros e acionáveis
- definition_of_done: 2-5 critérios objetivos de conclusão
- suggested_time_slot: melhor período do dia (ex: "manhã cedo", "início da tarde", "qualquer")
- emergency_mode: true se tarefa está atrasada, gerar versão simplificada com menos passos`;

    const userPrompt = `Tarefa: ${task.title}
${task.description ? `Descrição: ${task.description}` : ''}
Status: ${task.status}
Categoria: ${task.category}
${task.due_date ? `Prazo: ${task.due_date}` : 'Sem prazo definido'}
${task.tags?.length ? `Tags: ${task.tags.join(', ')}` : ''}
${task.is_overdue ? 'ATENÇÃO: Esta tarefa está ATRASADA!' : ''}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_execution_plan",
            description: "Gera plano de execução inteligente para a tarefa",
            parameters: {
              type: "object",
              properties: {
                estimate_min: { type: "integer", description: "Tempo mínimo estimado em minutos" },
                estimate_max: { type: "integer", description: "Tempo máximo estimado em minutos" },
                energy_level: { type: "string", enum: ["baixa", "media", "alta"] },
                next_action: { type: "string", description: "Primeira micro-ação (regra dos 2 min)" },
                micro_steps: { type: "array", items: { type: "string" }, description: "3-7 passos acionáveis" },
                work_mode: { type: "string", enum: ["deep_work", "admin", "criativo", "comunicacao"] },
                break_pattern: { type: "string", description: "Padrão trabalho/pausa em minutos" },
                definition_of_done: { type: "array", items: { type: "string" }, description: "Critérios de conclusão" },
                cognitive_load: { type: "integer", description: "Carga cognitiva 0-100" },
                suggested_time_slot: { type: "string", description: "Melhor período do dia" },
                emergency_mode: { type: "boolean", description: "Modo emergência para tarefas atrasadas" },
              },
              required: ["estimate_min", "estimate_max", "energy_level", "next_action", "micro_steps", "work_mode", "break_pattern", "definition_of_done", "cognitive_load"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_execution_plan" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call returned from AI");
    }

    const plan = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-execution-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
