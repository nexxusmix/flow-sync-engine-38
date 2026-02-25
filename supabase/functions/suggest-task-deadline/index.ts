/**
 * Edge function: suggest-task-deadline
 * Suggests a due_date for a task based on title, description, category and complexity
 */
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

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { title, description, category, tags, task_ids } = await req.json();

    // If task_ids provided, suggest deadlines for multiple tasks
    let tasksToAnalyze: any[] = [];

    if (task_ids?.length) {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, category, tags, priority, status, created_at")
        .eq("user_id", user.id)
        .in("id", task_ids)
        .is("due_date", null);
      if (error) throw error;
      tasksToAnalyze = data || [];
    } else if (title) {
      // Single task inline suggestion
      tasksToAnalyze = [{ id: "new", title, description, category, tags }];
    }

    if (tasksToAnalyze.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [], message: "Nenhuma tarefa sem prazo." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's existing tasks for context (avg completion time, workload)
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("status, due_date, completed_at, created_at, category")
      .eq("user_id", user.id)
      .neq("status", "done")
      .limit(50);

    const pendingCount = existingTasks?.length || 0;
    const todayStr = new Date().toISOString().split("T")[0];

    const prompt = `Você é um assistente de planejamento. Sugira prazos realistas para as tarefas abaixo.

CRITÉRIOS:
- Tarefas simples (ligar, enviar email, revisar): 1-2 dias úteis
- Tarefas médias (criar documento, organizar, pesquisar): 3-5 dias úteis
- Tarefas complexas (desenvolver, implementar, projeto): 7-14 dias úteis
- Considere a carga atual: ${pendingCount} tarefas pendentes
- Não sugira finais de semana (sáb/dom)
- Hoje: ${todayStr}

TAREFAS:
${tasksToAnalyze.map(t => `- ID: ${t.id} | Título: "${t.title}" | Categoria: ${t.category || 'operacao'} | Descrição: ${t.description || 'sem descrição'}`).join("\n")}

Responda SOMENTE em JSON array: [{"id": "...", "due_date": "YYYY-MM-DD", "complexity": "simple|medium|complex", "reason": "explicação curta em português"}]`;

    const aiResult = await chatCompletion({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const rawText = aiResult.choices?.[0]?.message?.content || "[]";
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("suggest-task-deadline error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
