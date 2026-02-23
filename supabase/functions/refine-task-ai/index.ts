import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ActionType =
  | "grammar"
  | "refine"
  | "rewrite_professional"
  | "checklist"
  | "estimate_progress"
  | "optimize_all";

interface RequestBody {
  action: ActionType;
  text?: string;
  tasks?: Array<{ id: string; title: string; description?: string | null }>;
}

function getPrompt(action: ActionType, text: string): string {
  switch (action) {
    case "grammar":
      return `Corrija gramaticalmente o texto abaixo mantendo o significado original e sem alterar o contexto. Retorne apenas o texto corrigido, nada mais.\n\n${text}`;
    case "refine":
      return `Refine sutilmente o texto abaixo apenas melhorando clareza e gramática, sem alterar estrutura ou intenção. Retorne apenas o texto refinado, nada mais.\n\n${text}`;
    case "rewrite_professional":
      return `Refine o texto abaixo deixando mais claro, objetivo e profissional, mantendo o significado original. Retorne apenas o texto reescrito, nada mais.\n\n${text}`;
    case "checklist":
      return `Transforme a tarefa abaixo em um checklist de subtarefas claras e acionáveis. Retorne APENAS um JSON array de strings, sem markdown, sem explicações.\nExemplo: ["Passo 1", "Passo 2"]\n\nTarefa: ${text}`;
    case "estimate_progress":
      return `Baseado na descrição da tarefa abaixo, estime um percentual realista de progresso. Retorne APENAS um número de 0 a 100, nada mais.\n\n${text}`;
    default:
      return text;
  }
}

function getOptimizeAllPrompt(
  tasks: Array<{ id: string; title: string; description?: string | null }>
): string {
  const taskList = tasks
    .map(
      (t, i) =>
        `${i + 1}. ID: ${t.id}\n   Título: ${t.title}\n   Descrição: ${t.description || "(sem descrição)"}`
    )
    .join("\n\n");

  return `Analise as tarefas abaixo e para cada uma:
1. Corrija gramática do título e descrição
2. Sugira uma prioridade (normal, alta, urgente)
3. Sugira uma categoria (pessoal, operacao, projeto)
4. Identifique se está mal escrita (flag)

Retorne APENAS um JSON array com objetos, sem markdown:
[{"id":"...", "title":"título corrigido", "description":"descrição corrigida", "priority":"normal|alta|urgente", "category":"pessoal|operacao|projeto", "flagged": false}]

Tarefas:
${taskList}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, text, tasks } = (await req.json()) as RequestBody;

    if (!action) {
      return new Response(JSON.stringify({ error: "action is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // LOVABLE_API_KEY handled in ai-client.ts

    let prompt: string;
    if (action === "optimize_all") {
      if (!tasks || tasks.length === 0) {
        return new Response(
          JSON.stringify({ error: "tasks array required for optimize_all" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      prompt = getOptimizeAllPrompt(tasks);
    } else {
      if (!text) {
        return new Response(
          JSON.stringify({ error: "text is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      prompt = getPrompt(action, text);
    }

    const data = await chatCompletion({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente especializado em organização de tarefas profissionais. Responda apenas com o conteúdo solicitado, sem explicações extras, sem markdown wrapping.",
        },
        { role: "user", content: prompt },
      ],
    });
    let result = data.choices?.[0]?.message?.content?.trim() || "";

    // For JSON actions, try to parse
    if (action === "checklist" || action === "optimize_all") {
      // Strip markdown code fences if present
      result = result.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
      try {
        const parsed = JSON.parse(result);
        return new Response(JSON.stringify({ result: parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        console.error("Failed to parse JSON result:", result);
        return new Response(JSON.stringify({ result, raw: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "estimate_progress") {
      const num = parseInt(result.replace(/\D/g, ""), 10);
      return new Response(
        JSON.stringify({ result: isNaN(num) ? 50 : Math.min(100, Math.max(0, num)) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("refine-task-ai error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro interno",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
