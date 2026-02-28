import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id, title, description, category, status, priority, due_date, tags")
      .eq("user_id", user.id)
      .neq("status", "done")
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) throw error;
    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [], message: "Sem tarefas pendentes." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const taskList = tasks
      .slice(0, 60)
      .map(t => `ID:${t.id} | "${t.title}" | prio:${t.priority} | status:${t.status} | prazo:${t.due_date || "sem"} | cat:${t.category}`)
      .join("\n");

    const prompt = `Analise estas tarefas e sugira MUDANÇAS de prioridade. Data atual: ${today}.

Prioridades: urgent, high, normal, low.

Critérios:
- Tarefas com prazo próximo (< 3 dias) devem ser urgent ou high
- Tarefas atrasadas devem ser urgent
- Tarefas sem prazo e sem importância clara: low
- Só sugira MUDANÇAS (onde a prioridade atual parece errada)
- Máximo 10 sugestões

TAREFAS:
${taskList}

Responda SOMENTE JSON (sem markdown):
{"suggestions":[{"id":"uuid","priority":"urgent|high|normal|low","reason":"motivo curto (max 12 palavras)"}]}
Se nenhuma mudança: {"suggestions":[]}`;

    const aiResult = await chatCompletion({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const rawText = aiResult.choices?.[0]?.message?.content || "{}";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    let result = { suggestions: [] as any[] };
    try {
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { suggestions: [] };
    } catch {
      result = { suggestions: [] };
    }

    // Filter only valid task IDs
    const taskIds = new Set(tasks.map(t => t.id));
    result.suggestions = (result.suggestions || []).filter((s: any) => taskIds.has(s.id));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("suggest-task-priorities error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
