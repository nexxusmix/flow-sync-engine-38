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

    // Fetch user's tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, category, tags")
      .eq("user_id", user.id);
    if (tasksError) throw tasksError;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const pending = tasks?.filter(t => t.status !== "done") || [];
    const overdue = pending.filter(t => t.due_date && t.due_date < todayStr);
    const dueToday = pending.filter(t => t.due_date === todayStr);
    const urgent = pending.filter(t => t.priority === "urgent" || t.priority === "high");

    const prompt = `Você é um assistente de produtividade. Gere um resumo executivo breve (máx 4 frases) em português brasileiro sobre o estado das tarefas do usuário. Seja direto e motivador.

Dados:
- Total pendentes: ${pending.length}
- Atrasadas: ${overdue.length} ${overdue.length > 0 ? `(${overdue.slice(0, 3).map(t => `"${t.title}"`).join(", ")})` : ""}
- Vencendo hoje: ${dueToday.length} ${dueToday.length > 0 ? `(${dueToday.slice(0, 3).map(t => `"${t.title}"`).join(", ")})` : ""}
- Urgentes/alta prioridade: ${urgent.length}
- Categorias: ${JSON.stringify([...new Set(pending.map(t => t.category))])}

Formato: texto corrido, sem bullet points. Comece com uma saudação curta baseada no horário (${now.getHours()}h).`;

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY not configured");

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const summary = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "Não foi possível gerar o resumo.";

    return new Response(
      JSON.stringify({
        summary,
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
