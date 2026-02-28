import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, tasks } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um especialista em automação de fluxos de trabalho e gestão de tarefas.
Sua função é gerar regras de automação inteligentes para um sistema de tarefas.

Cada regra deve ter:
- name: nome descritivo em português
- trigger_type: um de "on_status_change", "on_create", "on_due_date"
- condition_json: objeto com condições (ex: { from_status: "any", to_status: "done" })
- action_json: objeto com { type, value } onde type é "move_to_status", "set_priority" ou "add_tag"

Status válidos: backlog, todo, doing, review, done
Prioridades válidas: urgent, high, normal, low

Gere 3-5 regras relevantes e úteis baseadas no contexto fornecido.
Se receber tarefas existentes, analise padrões recorrentes e sugira automações baseadas no comportamento real.`;

    let userMessage = "";
    if (tasks && tasks.length > 0) {
      userMessage = `Analise estas tarefas e identifique padrões recorrentes para sugerir automações inteligentes:\n\n${JSON.stringify(tasks.map((t: any) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        tags: t.tags,
        created_at: t.created_at,
        updated_at: t.updated_at,
      })), null, 2)}`;
    } else {
      userMessage = prompt || "Gere automações úteis para gestão de tarefas de uma agência de marketing digital";
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
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_automation_rules",
              description: "Salva as regras de automação geradas pela IA",
              parameters: {
                type: "object",
                properties: {
                  rules: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nome descritivo da regra" },
                        trigger_type: { type: "string", enum: ["on_status_change", "on_create", "on_due_date"] },
                        condition_json: {
                          type: "object",
                          properties: {
                            from_status: { type: "string" },
                            to_status: { type: "string" },
                          },
                        },
                        action_json: {
                          type: "object",
                          properties: {
                            type: { type: "string", enum: ["move_to_status", "set_priority", "add_tag"] },
                            value: { type: "string" },
                          },
                          required: ["type", "value"],
                        },
                      },
                      required: ["name", "trigger_type", "condition_json", "action_json"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["rules"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_automation_rules" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, tente novamente em alguns segundos." }), {
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

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ rules: parsed.rules || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-task-automations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
