/**
 * Vercel Serverless Function — Close Project Retrospective (Gemini)
 * Replaces the Supabase edge function. Uses GEMINI_API_KEY (free tier).
 * Fetches project context from Supabase with user's auth token, calls Gemini,
 * persists the retrospective row, marks project as completed.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://gfyeuhfapscxfvjnrssn.supabase.co";
const SUPABASE_ANON =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const SYSTEM = `Você é um consultor sênior fazendo retrospectiva de projeto audiovisual concluído. Seu trabalho é gerar um relatório FRANCO e ACIONÁVEL para ajudar o gestor a evoluir.

Base a análise em DADOS REAIS fornecidos (tarefas concluídas, prazos, financeiro, comunicação, feedback, anexos).

Regras:
- Seja específico e honesto, sem elogios vazios
- Identifique padrões, não episódios isolados
- Ações futuras devem ser concretas e mensuráveis
- Antecipe problemas que podem se repetir em projetos similares
- Responda APENAS com JSON válido no formato solicitado, sem markdown, sem comentários`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    overall_score: { type: "integer" },
    executive_summary: { type: "string" },
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
    what_went_well: { type: "array", items: { type: "string" } },
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
    lessons_learned: { type: "array", items: { type: "string" } },
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
        on_time_rate: { type: "integer" },
        budget_adherence: { type: "string" },
        rework_estimated: { type: "string" },
        scope_creep: { type: "string" },
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
};

async function sbFetch(path: string, auth: string, init: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: auth,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

async function callGemini(prompt: string, apiKey: string): Promise<any> {
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: SYSTEM }] },
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Gemini ${r.status}: ${txt.slice(0, 300)}`);
  }
  const data = await r.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini retornou vazio");
  return JSON.parse(text);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY não configurada no Vercel" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );

  const auth = req.headers.get("Authorization") || `Bearer ${SUPABASE_ANON}`;

  try {
    const {
      project_id,
      reason,
      reason_category,
      user_notes,
      attachment_urls,
      attachment_text,
    } = await req.json();
    if (!project_id)
      throw new Error("project_id obrigatório");

    const finalReason = reason || reason_category || "Projeto encerrado";

    // Fetch project context in parallel
    const [pRes, tRes, rRes, sRes, uRes, mRes] = await Promise.all([
      sbFetch(`projects?id=eq.${project_id}&select=*`, auth),
      sbFetch(`tasks?project_id=eq.${project_id}&select=*`, auth),
      sbFetch(`revenues?project_id=eq.${project_id}&select=*`, auth),
      sbFetch(`project_stages?project_id=eq.${project_id}&select=*`, auth),
      sbFetch(
        `project_updates?project_id=eq.${project_id}&select=*&order=created_at.desc&limit=50`,
        auth,
      ),
      sbFetch(
        `project_milestones?project_id=eq.${project_id}&select=*`,
        auth,
      ),
    ]);
    const projects = pRes.ok ? await pRes.json() : [];
    const project = projects?.[0];
    if (!project) throw new Error("Projeto não encontrado ou sem acesso");
    const tasks = tRes.ok ? await tRes.json() : [];
    const revenues = rRes.ok ? await rRes.json() : [];
    const stages = sRes.ok ? await sRes.json() : [];
    const updates = uRes.ok ? await uRes.json() : [];
    const milestones = mRes.ok ? await mRes.json() : [];

    const prompt = `RELATÓRIO DE RETROSPECTIVA

MOTIVO DO ENCERRAMENTO:
${finalReason}
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

TAREFAS (${tasks.length}): ${JSON.stringify(tasks)}

RECEITAS: ${JSON.stringify(revenues)}

ETAPAS: ${JSON.stringify(stages)}

MILESTONES: ${JSON.stringify(milestones)}

ATUALIZAÇÕES/COMUNICAÇÃO (${updates.length}): ${JSON.stringify(updates)}

${
  attachment_text
    ? `CONTEÚDO DE ANEXOS PROCESSADOS:\n${String(attachment_text).slice(0, 8000)}`
    : ""
}

Gere a retrospectiva completa em JSON seguindo o schema.`;

    const aiReport = await callGemini(prompt, apiKey);

    // Insert retrospective row
    const insertRes = await sbFetch("project_retrospectives", auth, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        project_id,
        workspace_id: project.workspace_id,
        reason: finalReason,
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
        model_used: "gemini-2.5-flash",
      }),
    });
    if (!insertRes.ok) {
      const errText = await insertRes.text();
      throw new Error(`Falha ao salvar retrospectiva: ${errText.slice(0, 300)}`);
    }
    const inserted = await insertRes.json();

    // Mark project completed
    await sbFetch(`projects?id=eq.${project_id}`, auth, {
      method: "PATCH",
      body: JSON.stringify({
        status: "completed",
        completed_at: new Date().toISOString(),
      }),
    });

    return new Response(
      JSON.stringify({
        retrospective: Array.isArray(inserted) ? inserted[0] : inserted,
        report: aiReport,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("close-retrospective error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro desconhecido" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
}

export const config = { runtime: "edge" };
