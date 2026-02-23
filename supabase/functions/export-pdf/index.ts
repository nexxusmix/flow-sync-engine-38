/**
 * export-pdf — Unified PDF Generator with SQUAD Swiss design
 * ALL types now use Gemini AI to generate HTML, then client converts to PDF via iframe print.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitize, formatCurrency, formatDate, formatDateShort, getPeriodDates, slugify } from "../_shared/pdf-design.ts";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExportInput {
  type: "project" | "report_360" | "tasks" | "finance" | "portal" | "project_overview";
  id?: string;
  period?: string;
  token?: string;
  filters?: Record<string, unknown>;
}

// ─── SQUAD Swiss CSS Design System ───────────────────────────
const SQUAD_REPORT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
@media print { @page { size: A4; margin: 20mm 15mm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
body { font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #000000; color: #D9DEE3; -webkit-font-smoothing: antialiased; min-height: 100vh; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 24px 40px; border-bottom: 1px solid #1A1A1A; }
.logo { width: 40px; height: 40px; border: 1px solid #009CCA; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #009CCA; }
.header-right { font-size: 11px; color: #4A4A4A; letter-spacing: 2px; text-transform: uppercase; }
.hero { padding: 60px 40px 40px; }
.hero-subtitle { font-size: 11px; font-weight: 500; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; }
.hero-title { font-size: 42px; font-weight: 700; color: #FFFFFF; line-height: 1.1; margin-bottom: 24px; }
.hero-title .accent { color: #009CCA; }
.accent-bar { width: 60px; height: 2px; background: #009CCA; margin-bottom: 16px; }
.hero-desc { font-size: 14px; color: #8C8C8C; max-width: 600px; }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 0 40px 40px; }
.kpi-card { background: #0A0A0A; border: 1px solid #1A1A1A; border-radius: 12px; padding: 20px; text-align: center; }
.kpi-value { font-size: 28px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px; }
.kpi-value.success { color: #22C55E; }
.kpi-value.accent { color: #009CCA; }
.kpi-value.warning { color: #EAB308; }
.kpi-value.error { color: #EF4444; }
.kpi-label { font-size: 11px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; }
.section { padding: 0 40px 32px; }
.section-title { font-size: 13px; font-weight: 600; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #1A1A1A; }
table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
thead th { font-size: 10px; font-weight: 600; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; padding: 12px 16px; text-align: left; background: #0A0A0A; border-bottom: 1px solid #1A1A1A; }
tbody td { font-size: 12px; padding: 12px 16px; border-bottom: 1px solid #0A0A0A; color: #D9DEE3; }
.badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-success { background: rgba(34, 197, 94, 0.15); color: #22C55E; }
.badge-accent { background: rgba(0, 156, 202, 0.15); color: #009CCA; }
.badge-muted { background: rgba(140, 140, 140, 0.15); color: #8C8C8C; }
.badge-error { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
.badge-warning { background: rgba(234, 179, 8, 0.15); color: #EAB308; }
.bold { font-weight: 600; color: #FFFFFF; }
.muted { color: #8C8C8C; }
.footer { padding: 40px; text-align: center; border-top: 1px solid #1A1A1A; margin-top: 40px; }
.footer p { font-size: 11px; color: #4A4A4A; letter-spacing: 3px; text-transform: uppercase; }
.alert-banner { background: #0A0A0A; border-left: 3px solid #EF4444; padding: 16px 20px; margin: 0 40px 24px; }
.alert-banner .alert-title { font-size: 12px; font-weight: 700; color: #EF4444; margin-bottom: 4px; }
.alert-banner .alert-msg { font-size: 11px; color: #8C8C8C; }
.progress-row { padding: 0 40px 12px; }
.progress-label { font-size: 12px; color: #D9DEE3; margin-bottom: 4px; }
.progress-value { font-size: 12px; font-weight: 600; float: right; }
.progress-track { background: #1A1A1A; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
.progress-fill { height: 100%; border-radius: 3px; }
.pricing-card { background: #0A0A0A; border: 1px solid #1A1A1A; border-left: 3px solid #009CCA; border-radius: 8px; padding: 24px; margin: 0 40px 24px; }
.pricing-subtitle { font-size: 10px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.pricing-title { font-size: 16px; font-weight: 700; color: #FFFFFF; margin-bottom: 12px; }
.pricing-value { font-size: 28px; font-weight: 700; color: #009CCA; }
`.trim();

const BASE_SYSTEM = `You are a pixel-perfect HTML report generator for SQUAD FILM.
Return ONLY a complete HTML document starting with <!DOCTYPE html>. No markdown code blocks, no explanations, no text before or after the HTML.

Use this EXACT CSS inside a <style> tag in the <head>:
${SQUAD_REPORT_CSS}

Also add in <head>:
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">

BASE STRUCTURE (always include):
1. div.header with div.logo "SQ" and span.header-right "SQUAD FILM | 2026"
2. div.hero with appropriate subtitle, title, accent-bar, description
3. KPI rows as needed
4. Data sections as specified
5. div.footer with p "SQUAD FILM | 2026"`;

async function callGemini(systemExtra: string, dataPayload: string): Promise<string> {
  const aiResult = await chatCompletion({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: `${BASE_SYSTEM}\n\n${systemExtra}` },
      { role: "user", content: `Generate the HTML report with this data:\n${dataPayload}` },
    ],
    temperature: 0.1,
  });
  let html = aiResult.choices?.[0]?.message?.content || "";
  html = html.replace(/^```html?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) throw new Error("IA nao gerou HTML valido");
  return html;
}

const fmtCur = (v: number) => `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const fmtDt = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '--';

// ─── Project HTML ─────────────────────────────────────────
async function buildProjectHtml(supabase: any, projectId: string): Promise<{ html: string; slug: string }> {
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (error || !project) throw new Error(`Projeto nao encontrado: ${error?.message || "ID invalido"}`);

  const [{ data: milestones }, { data: stages }, { data: deliverables }] = await Promise.all([
    supabase.from("payment_milestones").select("*").eq("project_id", projectId).order("due_date"),
    supabase.from("project_stages").select("*").eq("project_id", projectId).order("created_at"),
    supabase.from("project_deliverables").select("*").eq("project_id", projectId).order("created_at"),
  ]);

  const stageList = stages || [];
  const delivList = deliverables || [];
  const mileList = milestones || [];
  const contractValue = Number(project.contract_value) || 0;
  const healthScore = project.health_score || 100;
  const completedStages = stageList.filter((s: any) => s.status === "concluido").length;
  const progressPercent = stageList.length > 0 ? Math.round((completedStages / stageList.length) * 100) : 0;
  const paidAmount = mileList.filter((m: any) => m.status === "paid").reduce((s: number, m: any) => s + Number(m.amount || 0), 0);
  const paymentPercent = contractValue > 0 ? Math.round((paidAmount / contractValue) * 100) : 0;

  const dataPayload = JSON.stringify({
    project_name: project.name || "Projeto", client_name: project.client_name || "Cliente",
    contract_value: fmtCur(contractValue), health_score: healthScore, progress: progressPercent, payment: paymentPercent,
    date: new Date().toLocaleDateString('pt-BR'),
    stages: stageList.map((s: any) => ({ name: s.name, status: s.status, start_date: fmtDt(s.start_date), end_date: fmtDt(s.end_date) })),
    deliverables: delivList.slice(0, 20).map((d: any) => ({ title: d.title, type: (d.type || 'outro').toUpperCase(), status: d.status || 'rascunho', version: `v${d.version || 1}` })),
    milestones: mileList.map((m: any) => ({ description: m.description || 'Parcela', amount: fmtCur(Number(m.amount) || 0), due_date: fmtDt(m.due_date), status: m.status })),
  });

  const html = await callGemini(`
SPECIFIC STRUCTURE:
- hero-subtitle: "Relatorio do Projeto"
- hero-title: project_name then <br><span class="accent">Report.</span>
- hero-desc: "Cliente: X | Gerado em DD/MM/YYYY"
- KPI row: Valor do Contrato (white), Saude (success>=80, warning 50-79, error<50), Progresso (accent), Pagamento (white)
- If stages: section "Cronograma de Etapas" table (Etapa, Status, Inicio, Fim). badge-success=concluido, badge-accent=em_andamento, badge-muted=pendente
- If deliverables: section "Entregas" table (Entrega, Tipo, Status, Versao)
- If milestones: section "Condicoes Financeiras" table (Parcela, Valor, Vencimento, Status). badge-success=paid, badge-error=overdue, badge-muted=pending
Status labels: concluido->Concluido, em_andamento->Em Andamento, pendente->Pendente, paid->Pago, overdue->Vencido, pending->Pendente.
If an array is empty, skip that section.`, dataPayload);

  return { html, slug: slugify(project.name || "projeto") };
}

// ─── Report 360 HTML ──────────────────────────────────────
async function buildReport360Html(supabase: any, period: string): Promise<{ html: string; slug: string }> {
  const { start, label } = getPeriodDates(period);
  const { data: projects } = await supabase.from("projects").select("*").gte("created_at", start.toISOString()).order("created_at", { ascending: false });
  const list = projects || [];

  const total = list.length;
  const active = list.filter((p: any) => p.status === "active").length;
  const delayed = list.filter((p: any) => p.status === "delayed" || p.status === "atrasado").length;
  const completed = list.filter((p: any) => p.status === "completed" || p.status === "delivered" || p.status === "concluido").length;
  const avgHealth = total > 0 ? Math.round(list.reduce((s: number, p: any) => s + (p.health_score || 100), 0) / total) : 100;
  const totalValue = list.reduce((s: number, p: any) => s + (Number(p.contract_value) || 0), 0);

  const dataPayload = JSON.stringify({
    period_label: label, date: new Date().toLocaleDateString('pt-BR'),
    kpis: { total, active, completed, delayed, avg_health: avgHealth, total_value: fmtCur(totalValue) },
    projects: list.slice(0, 25).map((p: any) => ({
      name: p.name || 'Projeto', status: p.status || 'active', health: p.health_score || 100,
      due_date: fmtDt(p.due_date), value: fmtCur(Number(p.contract_value) || 0),
    })),
  });

  const html = await callGemini(`
SPECIFIC STRUCTURE:
- hero-subtitle: period_label
- hero-title: "Relatorio<br><span class='accent'>360.</span>"
- hero-desc: "Visao consolidada da operacao | Gerado em DD/MM/YYYY"
- KPI row 1: Entregues (success), Abertos (white), Atrasados (error if >0), Saude Media (success>=80, warning<80)
- KPI row 2: Total Projetos, Finalizados (success), Em Andamento (accent), Investimento Total (white)
- If projects: section "Projetos no Periodo" table (Projeto, Status, Saude, Deadline). Bold names. Badge for status. Health colored. Muted dates.
Status: active->Ativo, delayed/atrasado->Atrasado, completed/delivered/concluido->Entregue.
If empty skip section.`, dataPayload);

  return { html, slug: `relatorio-360-${period}` };
}

// ─── Tasks HTML ───────────────────────────────────────────
async function buildTasksHtml(supabase: any): Promise<{ html: string; slug: string }> {
  const { data: tasks } = await supabase.from("tasks").select("*, project:projects(name)").order("created_at", { ascending: false }).limit(100);
  const list = tasks || [];
  const today = new Date().toISOString().split("T")[0];
  const totalTasks = list.length;
  const doneTasks = list.filter((t: any) => t.status === "done" || t.status === "delivered").length;
  const pendingTasks = list.filter((t: any) => t.status !== "done" && t.status !== "delivered").length;
  const overdueTasks = list.filter((t: any) => t.due_date && t.due_date < today && t.status !== "done" && t.status !== "delivered").length;

  const dataPayload = JSON.stringify({
    date: new Date().toLocaleDateString('pt-BR'),
    kpis: { total: totalTasks, pending: pendingTasks, done: doneTasks, overdue: overdueTasks },
    tasks: list.slice(0, 50).map((t: any) => ({
      title: t.title || 'Tarefa', project: t.project?.name || '--',
      status: t.status, due_date: fmtDt(t.due_date),
      is_overdue: !!(t.due_date && t.due_date < today && t.status !== "done" && t.status !== "delivered"),
    })),
  });

  const html = await callGemini(`
SPECIFIC STRUCTURE:
- hero-subtitle: "Visao Operacional"
- hero-title: "Quadro de<br><span class='accent'>Tarefas.</span>"
- hero-desc: "X tarefas registradas | Gerado em DD/MM/YYYY"
- KPI row: Total (white), Pendentes (accent), Concluidas (success), Vencidas (error if >0 else white)
- Section "Lista de Tarefas" table (Tarefa, Projeto, Status, Prazo). Bold task titles. Muted project names.
- Status labels: done/delivered->Concluido (badge-success), in_progress/execution->Execucao (badge-accent), review->Revisao (badge-warning), else->Pendente (badge-muted)
- If is_overdue, date in error color
- If overdue > 0, add alert-banner with class alert-banner: div.alert-title "ALERTA DE VENCIMENTO" + div.alert-msg "X tarefa(s) vencida(s)"`, dataPayload);

  return { html, slug: "quadro-de-tarefas" };
}

// ─── Finance HTML ─────────────────────────────────────────
async function buildFinanceHtml(supabase: any, period: string): Promise<{ html: string; slug: string }> {
  const { label } = getPeriodDates(period);
  const [{ data: revenues }, { data: expenses }] = await Promise.all([
    supabase.from("revenues").select("*").order("due_date"),
    supabase.from("expenses").select("*").order("due_date"),
  ]);

  const revList = revenues || [];
  const expList = expenses || [];
  const today = new Date().toISOString().split("T")[0];

  const received = revList.filter((r: any) => r.status === "received").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const paidExp = expList.filter((e: any) => e.status === "paid").reduce((s: number, e: any) => s + Number(e.amount), 0);
  const balance = received - paidExp;
  const pending = revList.filter((r: any) => r.status !== "received").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const overdueAmt = revList.filter((r: any) => r.status !== "received" && r.due_date < today).reduce((s: number, r: any) => s + Number(r.amount), 0);
  const overdueCount = revList.filter((r: any) => r.status !== "received" && r.due_date < today).length;
  const marginPct = received > 0 ? Math.round(((received - paidExp) / received) * 100) : 0;

  const days30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const proj30 = balance
    + revList.filter((r: any) => r.status === "pending" && r.due_date <= days30).reduce((s: number, r: any) => s + Number(r.amount), 0)
    - expList.filter((e: any) => e.status === "pending" && e.due_date <= days30).reduce((s: number, e: any) => s + Number(e.amount), 0);

  // Aging
  const agingData = [
    { range: "A vencer", count: revList.filter((r: any) => (r.status === "pending" || r.status === "overdue") && r.due_date >= today).length, amount: fmtCur(revList.filter((r: any) => (r.status === "pending" || r.status === "overdue") && r.due_date >= today).reduce((s: number, r: any) => s + Number(r.amount), 0)), pct: 0, color: "#22C55E" },
    { range: "1-7 dias vencido", count: revList.filter((r: any) => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d >= 1 && d <= 7; }).length, amount: "0", pct: 0, color: "#EAB308" },
    { range: "8-30 dias vencido", count: 0, amount: "0", pct: 0, color: "#EAB308" },
    { range: "+30 dias vencido", count: 0, amount: "0", pct: 0, color: "#EF4444" },
  ];

  // Recent payments
  const recent = revList.filter((r: any) => r.status === "received" && r.received_date)
    .sort((a: any, bb: any) => new Date(bb.received_date).getTime() - new Date(a.received_date).getTime())
    .slice(0, 10)
    .map((p: any) => ({ description: (p.description || "").substring(0, 40), date: fmtDt(p.received_date), amount: fmtCur(Number(p.amount)) }));

  const dataPayload = JSON.stringify({
    period_label: label, date: new Date().toLocaleDateString('pt-BR'),
    kpis: { balance: fmtCur(balance), pending: fmtCur(pending), paid_expenses: fmtCur(paidExp), margin: `${marginPct}%` },
    projection: { value: fmtCur(proj30), is_positive: proj30 >= balance },
    aging: agingData, recent_payments: recent,
    overdue: { count: overdueCount, amount: fmtCur(overdueAmt) },
  });

  const html = await callGemini(`
SPECIFIC STRUCTURE:
- hero-subtitle: period_label
- hero-title: "Relatorio<br><span class='accent'>Financeiro.</span>"
- hero-desc: "Panorama financeiro completo | Gerado em DD/MM/YYYY"
- KPI row: Saldo em Caixa (success), Receita Pendente (accent), Despesas Pagas (error), Margem Liquida (warning)
- Pricing card for "Projecao 30 Dias": subtitle "Saldo Estimado", title based on is_positive, value colored accent
- Section "Aging de Recebiveis": for each aging item, render progress bars with label, count + amount, and colored fill
- Section "Pagamentos Recentes": table (Descricao, Data, Valor). Amounts in green bold with "+" prefix. Dates muted.
- If overdue count > 0: alert-banner "ALERTA DE INADIMPLENCIA" with count and amount message
Use progress-row, progress-track, progress-fill divs for aging bars.`, dataPayload);

  return { html, slug: `financeiro-${period}` };
}

// ─── Project Overview HTML ────────────────────────────────
async function buildProjectOverviewHtml(supabase: any, period: string): Promise<{ html: string; slug: string }> {
  const { start, label } = getPeriodDates(period);
  const [{ data: projects }, { data: revenues }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(50),
    supabase.from("revenues").select("*").order("due_date"),
  ]);

  const list = projects || [];
  const revList = revenues || [];
  const today = new Date().toISOString().split("T")[0];
  const total = list.length;
  const active = list.filter((p: any) => p.status === "active").length;
  const delayed = list.filter((p: any) => p.status === "delayed" || p.status === "atrasado").length;
  const completed = list.filter((p: any) => p.status === "completed" || p.status === "delivered" || p.status === "concluido").length;
  const avgHealth = total > 0 ? Math.round(list.reduce((s: number, p: any) => s + (p.health_score || 100), 0) / total) : 100;
  const totalValue = list.reduce((s: number, p: any) => s + (Number(p.contract_value) || 0), 0);
  const received = revList.filter((r: any) => r.status === "received").reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  const pendingRev = revList.filter((r: any) => r.status !== "received").reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  const overdueRev = revList.filter((r: any) => r.status !== "received" && r.due_date < today).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

  const dataPayload = JSON.stringify({
    period_label: label, date: new Date().toLocaleDateString('pt-BR'),
    kpis: { total, active, completed, delayed, avg_health: avgHealth, total_pipeline: fmtCur(totalValue), received: fmtCur(received), pending: fmtCur(pendingRev), overdue: fmtCur(overdueRev) },
    projects: list.slice(0, 30).map((p: any) => ({
      name: p.name || 'Projeto', client: p.client_name || '--', status: p.status || 'active',
      health: p.health_score || 100, value: fmtCur(Number(p.contract_value) || 0),
      stage: p.stage_current || 'briefing', due_date: fmtDt(p.due_date),
    })),
  });

  const html = await callGemini(`
SPECIFIC STRUCTURE:
- hero-subtitle: "Command Center"
- hero-title: "SQUAD<br><span class='accent'>Projetos.</span>"
- hero-desc: "Visao Geral da Operacao | Gerado em DD/MM/YYYY"
- KPI row 1: Projetos Ativos (accent), Concluidos (success), Saude Media (success>=80, warning 50-79, error<50), Em Risco (error if >0)
- KPI row 2: Pipeline Total (white), Recebido (success), A Receber (accent), Vencido (error if >0)
- Section "Projetos" table (Projeto, Cliente, Etapa, Saude, Valor, Prazo). Bold names. Muted clients. Badge for stage. Health colored. Bold values. Muted dates.
Stage labels: briefing->Briefing, roteiro->Roteiro, pre_producao->Pre-Producao, captacao->Captacao, edicao->Edicao, revisao->Revisao, aprovacao->Aprovacao, entrega->Entrega, pos_venda->Pos-Venda.
Status: active->Ativo, delayed->Atrasado, completed/concluido->Entregue.`, dataPayload);

  return { html, slug: "command-center-projetos" };
}

// ─── Main Handler ─────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const input = (await req.json()) as ExportInput;
    const { type, id, period = "3m", token } = input;

    console.log(`[export-pdf] Starting: type=${type}, id=${id}, period=${period}`);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Auth
    if (type === "portal" && token) {
      const { data: portalLink, error: portalError } = await supabase.from("portal_links").select("*").eq("share_token", token).eq("is_active", true).single();
      if (portalError || !portalLink) throw new Error("Token de portal invalido");
    }

    // ALL types now return HTML
    let html: string;
    let slug: string;

    switch (type) {
      case "project":
      case "portal": {
        const projectId = id || "";
        if (!projectId) throw new Error("ID do projeto e obrigatorio");
        const result = await buildProjectHtml(supabase, projectId);
        html = result.html;
        slug = type === "portal" ? `portal-${result.slug}` : result.slug;
        break;
      }
      case "project_overview": {
        const result = await buildProjectOverviewHtml(supabase, period);
        html = result.html; slug = result.slug;
        break;
      }
      case "report_360": {
        const result = await buildReport360Html(supabase, period);
        html = result.html; slug = result.slug;
        break;
      }
      case "tasks": {
        const result = await buildTasksHtml(supabase);
        html = result.html; slug = result.slug;
        break;
      }
      case "finance": {
        const result = await buildFinanceHtml(supabase, period);
        html = result.html; slug = result.slug;
        break;
      }
      default:
        throw new Error(`Tipo nao suportado: ${type}`);
    }

    console.log(`[export-pdf] Done (HTML via Gemini): ${slug}`);

    return new Response(JSON.stringify({ success: true, html, slug }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[export-pdf] Error:", error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
