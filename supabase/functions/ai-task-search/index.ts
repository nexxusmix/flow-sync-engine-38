import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, tasks } = await req.json();
    // LOVABLE_API_KEY handled in ai-client.ts
    

    const taskList = tasks
      .map((t: any) => `[${t.id}] "${t.title}" (status:${t.status}, cat:${t.category}${t.tags?.length ? ', tags:' + t.tags.join(',') : ''}${t.due_date ? ', prazo:' + t.due_date : ''}${t.description ? ', desc:' + t.description.slice(0, 80) : ''})`)
      .join("\n");

    const aiData = await chatCompletion({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content: `Você é um assistente que filtra tarefas. O usuário fará uma busca em linguagem natural. Retorne APENAS os IDs das tarefas que correspondem à busca. Use a tool suggest_matches.`,
        },
        {
          role: "user",
          content: `Busca: "${query}"\n\nTarefas:\n${taskList}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_matches",
            description: "Return IDs of tasks matching the query",
            parameters: {
              type: "object",
              properties: {
                matchedIds: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of task IDs that match the search query",
                },
              },
              required: ["matchedIds"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "suggest_matches" } },
    });
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ matchedIds: parsed.matchedIds || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ matchedIds: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-task-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
