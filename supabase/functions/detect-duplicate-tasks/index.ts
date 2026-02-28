/**
 * Edge function: detect-duplicate-tasks
 * Proactively detects duplicate or very similar tasks
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header missing");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    // Fetch all non-done tasks
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id, title, description, category, status, tags")
      .eq("user_id", user.id)
      .neq("status", "done")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    if (!tasks || tasks.length < 2) {
      return new Response(
        JSON.stringify({ duplicates: [], message: "Poucas tarefas para análise." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Analise as tarefas abaixo e identifique DUPLICATAS ou tarefas MUITO SIMILARES que podem ser consolidadas.

Critérios de similaridade:
- Títulos praticamente iguais (diferenças mínimas)
- Tarefas que tratam do mesmo assunto com palavras diferentes
- Tarefas que podem ser unificadas em uma só

NÃO marque como duplicatas:
- Tarefas do mesmo tema mas ações claramente diferentes
- Tarefas para pessoas/clientes diferentes

TAREFAS:
${tasks.map(t => `- ID: ${t.id} | "${t.title}" [${t.category}/${t.status}]`).join("\n")}

Responda SOMENTE em JSON:
{"duplicates": [{"group": ["id1", "id2"], "reason": "explicação curta", "keep": "id do que sugere manter", "merge_title": "título sugerido para a tarefa unificada"}]}
Se não houver duplicatas, retorne {"duplicates": []}`;

    const aiResult = await chatCompletion({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const rawText = aiResult.choices?.[0]?.message?.content || "{}";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { duplicates: [] };

    // Enrich with task titles
    const taskMap = Object.fromEntries(tasks.map(t => [t.id, t]));
    const enriched = (result.duplicates || []).map((d: any) => ({
      ...d,
      tasks: d.group?.map((id: string) => taskMap[id]).filter(Boolean) || [],
    }));

    return new Response(
      JSON.stringify({ duplicates: enriched }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("detect-duplicate-tasks error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
