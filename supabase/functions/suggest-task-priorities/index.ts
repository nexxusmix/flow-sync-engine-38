import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { task_ids } = await req.json();

    // Fetch specified tasks
    let query = supabase
      .from("tasks")
      .select("id, title, description, status, category, tags, due_date, created_at, priority")
      .eq("user_id", user.id)
      .neq("status", "done");

    if (task_ids?.length) {
      query = query.in("id", task_ids);
    } else {
      query = query.in("priority", ["normal", "low"]);
    }

    const { data: tasks, error } = await query;
    if (error) throw error;
    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [], message: "Nenhuma tarefa para priorizar." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const prompt = `Analise as seguintes tarefas e sugira prioridade para cada uma. Use APENAS: urgent, high, normal, low.

Critérios:
- urgent: vence hoje ou está atrasada, ou bloqueante
- high: vence em 3 dias, ou é importante para o projeto
- normal: vence em 7+ dias, rotineira
- low: sem prazo, pouco impacto

Hoje: ${todayStr}

Tarefas:
${tasks.map(t => `- ID: ${t.id} | Título: "${t.title}" | Prazo: ${t.due_date || "sem prazo"} | Categoria: ${t.category} | Prioridade atual: ${t.priority} | Criada: ${t.created_at.split("T")[0]}`).join("\n")}

Responda SOMENTE em JSON array: [{"id": "...", "priority": "...", "reason": "explicação curta em português"}]`;

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY not configured");

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1000, temperature: 0.3 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    // Extract JSON from markdown code blocks if present
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
