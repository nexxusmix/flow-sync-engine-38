import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tasks } = await req.json();
    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const today = new Date().toISOString().split("T")[0];
    const taskList = tasks.map((t: any) =>
      `- [${t.id}] "${t.title}" | prioridade: ${t.priority} | prazo: ${t.due_date || "sem prazo"} | categoria: ${t.category} | status: ${t.status} | tags: ${(t.tags || []).join(", ") || "nenhuma"}`
    ).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente de produtividade. Analise as tarefas pendentes e sugira as melhores para executar HOJE (${today}), na ordem ideal. Considere: urgência, prazos próximos, prioridade, dependências lógicas e equilíbrio de categorias. Máximo 8 tarefas. Dê uma justificativa curta (1 frase) para cada.`,
          },
          {
            role: "user",
            content: `Tarefas pendentes:\n${taskList}\n\nSugira a sequência ideal para hoje.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_daily_tasks",
              description: "Return ordered list of tasks to do today with reasons.",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        task_id: { type: "string", description: "The task ID from the list" },
                        position: { type: "number", description: "Order position starting from 1" },
                        reason: { type: "string", description: "Brief reason why this task should be done at this position" },
                      },
                      required: ["task_id", "position", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_daily_tasks" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    // Validate task_ids exist
    const validIds = new Set(tasks.map((t: any) => t.id));
    const suggestions = (parsed.suggestions || [])
      .filter((s: any) => validIds.has(s.task_id))
      .sort((a: any, b: any) => a.position - b.position);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("suggest-daily-plan error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
