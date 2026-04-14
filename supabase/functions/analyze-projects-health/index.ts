import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM = `Você é o analista sênior Squad Hub. Analise a saúde de um projeto audiovisual com base em DADOS CONCRETOS (prazos, tarefas, pagamentos, comunicação, feedback).

SEMPRE use a ferramenta save_health para retornar a análise.

Regras:
- Seja direto, sem generalidades
- Antecipe problemas com base em sinais fracos (tarefas atrasadas, pagamentos parados, silêncio do cliente, entregas aproximando)
- Score 0-100: 80+ saudável, 60-79 atenção, 40-59 risco, <40 crítico
- Observações e alertas devem ser ACIONÁVEIS, não descritivos
- Moeda: R$ X.XXX,XX`;

const TOOL = {
  type: "function",
  function: {
    name: "save_health",
    description: "Retorna a análise estruturada de saúde do projeto",
    parameters: {
      type: "object",
      properties: {
        score: { type: "integer", description: "0-100" },
        status: {
          type: "string",
          enum: ["healthy", "attention", "at_risk", "critical"],
        },
        executive_summary: { type: "string" },
        delay_probability: { type: "integer" },
        delay_severity: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
        },
        financial_risk: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
        },
        client_health: {
          type: "string",
          enum: ["healthy", "attention", "at_risk", "critical"],
        },
        risks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              severity: { type: "string", enum: ["red", "yellow", "green"] },
              title: { type: "string" },
              description: { type: "string" },
            },
            required: ["type", "severity", "title", "description"],
          },
        },
        action_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              priority: { type: "integer" },
              title: { type: "string" },
              reason: { type: "string" },
              impact_area: { type: "string" },
            },
            required: ["priority", "title", "reason"],
          },
        },
        bottlenecks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              stage: { type: "string" },
              issue: { type: "string" },
              avg_days_stuck: { type: "integer" },
            },
            required: ["stage", "issue"],
          },
        },
        observations: {
          type: "array",
          items: { type: "string" },
          description: "Observações contextuais que o gestor deveria saber",
        },
        alerts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              level: { type: "string", enum: ["info", "warning", "danger"] },
              message: { type: "string" },
            },
            required: ["level", "message"],
          },
        },
      },
      required: [
        "score",
        "status",
        "executive_summary",
        "risks",
        "action_items",
        "bottlenecks",
        "observations",
        "alerts",
      ],
    },
  },
};

async function analyzeOne(
  supabase: ReturnType<typeof createClient>,
  project: any,
) {
  const [tasksRes, revenuesRes, stagesRes, updatesRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("title,status,priority,due_date,created_at,completed_at")
      .eq("project_id", project.id)
      .limit(80),
    supabase
      .from("revenues")
      .select("amount,status,due_date,paid_at")
      .eq("project_id", project.id),
    supabase
      .from("project_stages")
      .select("title,status,planned_end,actual_end")
      .eq("project_id", project.id),
    supabase
      .from("project_updates")
      .select("type,content,created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const prompt = `PROJETO: ${JSON.stringify({
    name: project.name,
    client: project.client_name,
    status: project.status,
    due_date: project.due_date,
    contract_value: project.contract_value,
    health_score_legacy: project.health_score,
    created_at: project.created_at,
  })}

TAREFAS (${tasksRes.data?.length || 0}): ${JSON.stringify(
    tasksRes.data || [],
  )}

RECEITAS: ${JSON.stringify(revenuesRes.data || [])}

ETAPAS: ${JSON.stringify(stagesRes.data || [])}

ÚLTIMAS INTERAÇÕES/ATUALIZAÇÕES: ${JSON.stringify(updatesRes.data || [])}

HOJE: ${new Date().toISOString().split("T")[0]}

Analise e chame save_health com a análise completa.`;

  const result = await chatCompletion({
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: prompt },
    ],
    model: "google/gemini-2.5-flash",
    temperature: 0.3,
    tools: [TOOL],
    tool_choice: { type: "function", function: { name: "save_health" } },
  });

  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return tool call");
  const args = JSON.parse(toolCall.function.arguments);
  return { ...args, model_used: result.provider };
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const { project_id, workspace_id } = body;

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Fetch target projects
    let query = supabase
      .from("projects")
      .select("*")
      .in("status", ["active", "in_progress", "paused"]);
    if (project_id) query = supabase.from("projects").select("*").eq("id", project_id);
    if (workspace_id) query = query.eq("workspace_id", workspace_id);

    const { data: projects, error: projErr } = await query.limit(100);
    if (projErr) throw projErr;
    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({ analyzed: 0, message: "Nenhum projeto ativo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const project of projects) {
      try {
        const analysis = await analyzeOne(supabase, project);
        const { error: insErr } = await supabase
          .from("project_health_snapshots")
          .insert({
            project_id: project.id,
            workspace_id: project.workspace_id,
            ...analysis,
          });
        if (insErr) throw insErr;
        results.push({ project_id: project.id, status: analysis.status, score: analysis.score });
      } catch (e: any) {
        errors.push({ project_id: project.id, error: e.message });
      }
    }

    return new Response(
      JSON.stringify({
        analyzed: results.length,
        failed: errors.length,
        results,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("analyze-projects-health error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
