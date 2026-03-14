import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    // Fetch user's tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, category, tags")
      .eq("user_id", user.id);
    if (tasksError) throw tasksError;

    // Fetch upcoming events (next 48h)
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const { data: events } = await supabase
      .from("calendar_events")
      .select("id, title, start_at, event_type")
      .gte("start_at", now.toISOString())
      .lte("start_at", in48h.toISOString())
      .limit(10);

    // Fetch overdue revenues
    const todayStr = now.toISOString().split("T")[0];
    const { data: overdueRevenues } = await supabase
      .from("revenues")
      .select("id, description, amount, due_date, project_id")
      .eq("status", "pending")
      .lt("due_date", todayStr)
      .limit(5);

    const pending = tasks?.filter(t => t.status !== "done") || [];
    const overdue = pending.filter(t => t.due_date && t.due_date < todayStr);
    const dueToday = pending.filter(t => t.due_date === todayStr);
    const urgent = pending.filter(t => t.priority === "urgent" || t.priority === "high");

    const prompt = `Você é um assistente de produtividade para uma produtora/agência. Gere:
1. Um resumo executivo breve (máx 4 frases) em português brasileiro sobre o estado das tarefas.
2. Um array de ações sugeridas (máx 5) que o usuário deveria fazer agora.

Dados:
- Total pendentes: ${pending.length}
- Atrasadas: ${overdue.length} ${overdue.length > 0 ? `(${overdue.slice(0, 3).map(t => `"${t.title}" [id:${t.id}]`).join(", ")})` : ""}
- Vencendo hoje: ${dueToday.length} ${dueToday.length > 0 ? `(${dueToday.slice(0, 3).map(t => `"${t.title}" [id:${t.id}]`).join(", ")})` : ""}
- Urgentes/alta prioridade: ${urgent.length}
- Categorias: ${JSON.stringify([...new Set(pending.map(t => t.category))])}
- Próximos eventos (48h): ${events?.length || 0} ${events?.length ? `(${events.slice(0, 3).map(e => `"${e.title}"`).join(", ")})` : ""}
- Cobranças atrasadas: ${overdueRevenues?.length || 0} ${overdueRevenues?.length ? `(${overdueRevenues.slice(0, 2).map(r => `"${r.description}" R$${r.amount}`).join(", ")})` : ""}

Retorne APENAS JSON válido no formato:
{
  "summary": "texto do resumo aqui",
  "suggested_actions": [
    { "type": "mark_done", "label": "Concluir tarefa X", "data": { "task_id": "..." } },
    { "type": "send_message", "label": "Cobrar cliente Y", "data": { "context": "..." } },
    { "type": "schedule_meeting", "label": "Agendar reunião sobre Z", "data": { "title": "...", "context": "..." } },
    { "type": "create_task", "label": "Criar tarefa para W", "data": { "title": "...", "category": "..." } },
    { "type": "generate_proposal", "label": "Gerar proposta para projeto P", "data": { "context": "..." } }
  ]
}

Tipos de ação válidos: mark_done, send_message, schedule_meeting, create_task, generate_proposal.
Horário atual: ${now.getHours()}h. Comece o resumo com saudação baseada no horário.
Seja direto, motivador e prático.`;

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY not configured");

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response (handle markdown code blocks)
    let summary = "Não foi possível gerar o resumo.";
    let suggestedActions: unknown[] = [];

    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = parsed.summary || summary;
        suggestedActions = Array.isArray(parsed.suggested_actions) ? parsed.suggested_actions : [];
      }
    } catch {
      // Fallback: use raw text as summary
      summary = rawText.replace(/```[\s\S]*```/g, '').trim() || summary;
    }

    return new Response(
      JSON.stringify({
        summary,
        suggested_actions: suggestedActions.slice(0, 5),
        stats: {
          pending: pending.length,
          overdue: overdue.length,
          dueToday: dueToday.length,
          urgent: urgent.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
