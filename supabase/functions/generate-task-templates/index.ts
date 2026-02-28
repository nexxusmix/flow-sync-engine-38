import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, existingTasks } = await req.json();
    if (!prompt && !existingTasks) {
      return new Response(JSON.stringify({ error: "prompt or existingTasks required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um especialista em gestão de projetos e tarefas. Gere templates de tarefas reutilizáveis, completos e práticos.

Categorias válidas: operacao, pessoal, projeto
Prioridades válidas: urgent, high, normal, low

Cada template deve ter:
- title: nome curto e descritivo
- description: descrição clara do que a tarefa envolve
- category: uma das categorias válidas
- priority: uma das prioridades válidas
- tags: array de 2-4 tags relevantes
- checklist_items: array de objetos {title} com 3-6 subtarefas práticas

Gere entre 3 e 5 templates relevantes e variados.`;

    let userPrompt: string;
    if (existingTasks && existingTasks.length > 0) {
      const taskSummary = existingTasks
        .slice(0, 30)
        .map((t: any) => `- ${t.title} [${t.category}/${t.priority}]`)
        .join("\n");
      userPrompt = `Analise estas tarefas existentes e identifique padrões recorrentes para criar templates reutilizáveis:\n\n${taskSummary}\n\nCrie templates baseados nos padrões que você identificou.`;
    } else {
      userPrompt = `Crie templates de tarefas para: ${prompt}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_templates",
              description: "Save generated task templates",
              parameters: {
                type: "object",
                properties: {
                  templates: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        category: { type: "string", enum: ["operacao", "pessoal", "projeto"] },
                        priority: { type: "string", enum: ["urgent", "high", "normal", "low"] },
                        tags: { type: "array", items: { type: "string" } },
                        checklist_items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { title: { type: "string" } },
                            required: ["title"],
                          },
                        },
                      },
                      required: ["title", "description", "category", "priority", "tags", "checklist_items"],
                    },
                  },
                },
                required: ["templates"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_templates" } },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const templates = parsed.templates || [];

    return new Response(JSON.stringify({ templates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-task-templates error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
