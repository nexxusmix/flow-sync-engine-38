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

const SYSTEM = `Você é um consultor sênior fazendo retrospectiva de projeto audiovisual concluído. Seu trabalho é gerar um relatório FRANCO e ACIONÁVEL para ajudar o gestor a evoluir.

Base a análise em DADOS REAIS fornecidos (tarefas concluídas, prazos, financeiro, comunicação, feedback, anexos).

Regras:
- Seja específico e honesto, sem elogios vazios
- Identifique padrões, não episódios isolados
- Ações futuras devem ser concretas e mensuráveis
- Antecipe problemas que podem se repetir em projetos similares
- Responda APENAS chamando a ferramenta save_retrospective`;

const TOOL = {
  type: "function",
  function: {
    name: "save_retrospective",
    description: "Salva a retrospectiva estruturada do projeto",
    parameters: {
      type: "object",
      properties: {
        overall_score: {
          type: "integer",
          description: "Nota geral do projeto 0-100",
        },
        executive_summary: {
          type: "string",
          description: "3-4 frases sobre como o projeto correu",
        },
        client_satisfaction: {
          type: "string",
          enum: ["excellent", "good", "neutral", "poor", "unknown"],
        },
        client_satisfaction_reasoning: { type: "string" },
        team_performance: {
          type: "string",
          enum: ["excellent", "good", "adequate", "poor"],
        },
        team_performance_reasoning: { type: "string" },
        what_went_well: {
          type: "array",
          items: { type: "string" },
          description: "Lista de acertos concretos",
        },
        what_went_wrong: {
          type: "array",
          items: {
            type: "object",
            properties: {
              issue: { type: "string" },
              impact: { type: "string" },
              root_cause: { type: "string" },
            },
            required: ["issue", "impact", "root_cause"],
          },
        },
        lessons_learned: {
          type: "array",
          items: { type: "string" },
          description: "Lições transferíveis para próximos projetos",
        },
        actions_for_next: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action: { type: "string" },
              why: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high"] },
            },
            required: ["action", "why", "priority"],
          },
        },
        efficiency_metrics: {
          type: "object",
          properties: {
            on_time_rate: { type: "integer", description: "% tarefas no prazo" },
            budget_adherence: {
              type: "string",
              description: "under/on/over budget",
            },
            rework_estimated: {
              type: "string",
              description: "low/medium/high",
            },
            scope_creep: { type: "string", description: "none/minor/major" },
          },
        },
        client_feedback_summary: { type: "string" },
        red_flags_for_future_similar_projects: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: [
        "overall_score",
        "executive_summary",
        "client_satisfaction",
        "team_performance",
        "what_went_well",
        "what_went_wrong",
        "lessons_learned",
        "actions_for_next",
        "efficiency_metrics",
      ],
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const {
      project_id,
      reason,
      reason_category,
      user_notes,
      attachment_urls,
      attachment_text,
    } = await req.json();
    if (!project_id || !reason)
      throw new Error("project_id e reason são obrigatórios");

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Fetch complete project context
    const [projRes, tasksRes, revenuesRes, stagesRes, updatesRes, milestonesRes] =
      await Promise.all([
        supabase.from("projects").select("*").eq("id", project_id).single(),
        supabase.from("tasks").select("*").eq("project_id", project_id),
        supabase.from("revenues").select("*").eq("project_id", project_id),
        supabase.from("project_stages").select("*").eq("project_id", project_id),
        supabase
          .from("project_updates")
          .select("*")
          .eq("project_id", project_id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("project_milestones")
          .select("*")
          .eq("project_id", project_id),
      ]);

    if (projRes.error) throw projRes.error;
    const project = projRes.data;

    const prompt = `RELATÓRIO DE RETROSPECTIVA

MOTIVO DO ENCERRAMENTO:
${reason}
${reason_category ? `Categoria: ${reason_category}` : ""}

NOTAS DO GESTOR:
${user_notes || "(nenhuma)"}

PROJETO: ${JSON.stringify({
      name: project.name,
      client: project.client_name,
      status: project.status,
      start: project.created_at,
      due_date: project.due_date,
      contract_value: project.contract_value,
      health_score: project.health_score,
    })}

TAREFAS (${tasksRes.data?.length || 0}): ${JSON.stringify(tasksRes.data || [])}

RECEITAS: ${JSON.stringify(revenuesRes.data || [])}

ETAPAS: ${JSON.stringify(stagesRes.data || [])}

MILESTONES: ${JSON.stringify(milestonesRes.data || [])}

ATUALIZAÇÕES/COMUNICAÇÃO (${updatesRes.data?.length || 0}): ${JSON.stringify(
      updatesRes.data || [],
    )}

${
  attachment_text
    ? `CONTEÚDO DE ANEXOS PROCESSADOS:\n${attachment_text.slice(0, 8000)}`
    : ""
}

Gere a retrospectiva completa chamando save_retrospective.`;

    const result = await chatCompletion({
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      model: "google/gemini-2.5-flash",
      temperature: 0.4,
      tools: [TOOL],
      tool_choice: {
        type: "function",
        function: { name: "save_retrospective" },
      },
    });

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("IA não retornou tool call");
    const aiReport = JSON.parse(toolCall.function.arguments);

    // Persist retrospective
    const { data: retro, error: insErr } = await supabase
      .from("project_retrospectives")
      .insert({
        project_id,
        workspace_id: project.workspace_id,
        reason,
        reason_category,
        user_notes,
        attachment_urls: attachment_urls || [],
        ai_report: aiReport,
        overall_score: aiReport.overall_score,
        client_satisfaction: aiReport.client_satisfaction,
        team_performance: aiReport.team_performance,
        what_went_well: aiReport.what_went_well,
        what_went_wrong: aiReport.what_went_wrong,
        lessons_learned: aiReport.lessons_learned,
        actions_for_next: aiReport.actions_for_next,
        efficiency_metrics: aiReport.efficiency_metrics,
        model_used: result.provider,
      })
      .select()
      .single();

    if (insErr) throw insErr;

    // Mark project as completed
    await supabase
      .from("projects")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", project_id);

    return new Response(
      JSON.stringify({ retrospective: retro, report: aiReport }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("close-project-retrospective error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
