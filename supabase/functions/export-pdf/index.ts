/**
 * export-pdf — Unified PDF Generator with SQUAD Swiss design
 * Project type uses Gemini AI to generate HTML, then client converts to PDF.
 * Other types still use pdf-lib (SquadPdfBuilder) for now.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SquadPdfBuilder, SQUAD, MARGIN, PAGE_W, CONTENT_W, sanitize, formatCurrency, formatDate, formatDateShort, getPeriodDates, slugify } from "../_shared/pdf-design.ts";
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
`.trim();

// ─── Project HTML via Gemini ─────────────────────────────────
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

  const fmtCur = (v: number) => `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  const fmtDt = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '--';

  const dataPayload = JSON.stringify({
    project_name: project.name || "Projeto",
    client_name: project.client_name || "Cliente",
    contract_value: fmtCur(contractValue),
    health_score: healthScore,
    progress: progressPercent,
    payment: paymentPercent,
    date: new Date().toLocaleDateString('pt-BR'),
    stages: stageList.map((s: any) => ({
      name: s.name, status: s.status,
      start_date: fmtDt(s.start_date), end_date: fmtDt(s.end_date),
    })),
    deliverables: delivList.slice(0, 20).map((d: any) => ({
      title: d.title, type: (d.type || 'outro').toUpperCase(),
      status: d.status || 'rascunho', version: `v${d.version || 1}`,
    })),
    milestones: mileList.map((m: any) => ({
      description: m.description || 'Parcela',
      amount: fmtCur(Number(m.amount) || 0),
      due_date: fmtDt(m.due_date), status: m.status,
    })),
  });

  const systemPrompt = `You are a pixel-perfect HTML report generator for SQUAD FILM.
Return ONLY a complete HTML document starting with <!DOCTYPE html>. No markdown code blocks, no explanations, no text before or after the HTML.

Use this EXACT CSS inside a <style> tag in the <head>:
${SQUAD_REPORT_CSS}

Also add in <head>:
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">

DOCUMENT STRUCTURE:
1. div.header with div.logo "SQ" and span.header-right "SQUAD FILM | 2026"
2. div.hero with p.hero-subtitle "Relatorio do Projeto", h1.hero-title with project name then <br><span class="accent">Report.</span>, div.accent-bar, p.hero-desc with "Cliente: X | Gerado em DD/MM/YYYY"
3. div.kpi-row with 4 div.kpi-card each containing div.kpi-value and div.kpi-label:
   - "Valor do Contrato" (white)
   - "Saude" with class success if >=80, warning if 50-79, error if <50
   - "Progresso" with class accent
   - "Pagamento" (white)
4. If stages exist: div.section with h2.section-title "Cronograma de Etapas" and a table (Etapa, Status, Inicio, Fim Previsto). Use span.badge with badge-success for concluido, badge-accent for em_andamento, badge-muted for pendente.
5. If deliverables exist: div.section with h2.section-title "Entregas" and table (Entrega, Tipo, Status, Versao). Use appropriate badge classes.
6. If milestones exist: div.section with h2.section-title "Condicoes Financeiras" and table (Parcela, Valor, Vencimento, Status). badge-success for paid, badge-error for overdue, badge-muted for pending.
7. div.footer with p "SQUAD FILM | 2026"

Use class "bold" for names/amounts in table cells. Use class "muted" for date cells.
Status labels: concluido->Concluido, em_andamento->Em Andamento, pendente->Pendente, paid->Pago, overdue->Vencido, pending->Pendente, aprovado->Aprovado, entregue->Entregue, revisao->Revisao, rascunho->Rascunho.
If an array is empty, skip that section entirely.`;

  console.log(`[export-pdf] Calling Gemini for project HTML: ${project.name}`);

  const aiResult = await chatCompletion({
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate the HTML report with this data:\n${dataPayload}` },
    ],
    temperature: 0.1,
  });

  let html = aiResult.choices?.[0]?.message?.content || "";
  // Strip markdown code blocks if present
  html = html.replace(/^```html?\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
    throw new Error("IA nao gerou HTML valido");
  }

  return { html, slug: slugify(project.name || "projeto") };
}

// ─── Report 360 PDF ───────────────────────────────────────
async function buildReport360Pdf(supabase: any, period: string) {
  const { start, label } = getPeriodDates(period);
  const { data: projects } = await supabase.from("projects").select("*").gte("created_at", start.toISOString()).order("created_at", { ascending: false });
  const list = projects || [];

  const total = list.length;
  const active = list.filter((p: any) => p.status === "active").length;
  const delayed = list.filter((p: any) => p.status === "delayed" || p.status === "atrasado").length;
  const completed = list.filter((p: any) => p.status === "completed" || p.status === "delivered").length;
  const avgHealth = total > 0 ? Math.round(list.reduce((s: number, p: any) => s + (p.health_score || 100), 0) / total) : 100;
  const totalValue = list.reduce((s: number, p: any) => s + (Number(p.contract_value) || 0), 0);

  const b = new SquadPdfBuilder();
  await b.init();

  b.coverPage({
    subtitle: `Periodo: ${label}`,
    titleLine1: "Relatorio",
    titleLine2: "360",
    description: "Visao consolidada da operacao",
    date: formatDateShort(),
  });

  b.newPage();
  b.heroSection("Indicadores", "Principais.", "Metricas Consolidadas");
  b.kpiRow([
    { label: "Entregues", value: `${completed}`, color: SQUAD.success },
    { label: "Abertos", value: `${active}` },
    { label: "Atrasados", value: `${delayed}`, color: delayed > 0 ? SQUAD.error : SQUAD.white },
    { label: "Saude Media", value: `${avgHealth}%`, color: avgHealth >= 80 ? SQUAD.success : SQUAD.warning },
  ]);

  b.sectionTitle("Resumo do Periodo");
  b.kpiRow([
    { label: "Total Projetos", value: `${total}` },
    { label: "Finalizados", value: `${completed}`, color: SQUAD.success },
    { label: "Em Andamento", value: `${active}`, color: SQUAD.accent },
    { label: "Investimento Total", value: formatCurrency(totalValue) },
  ]);

  if (list.length > 0) {
    b.sectionTitle("Projetos no Periodo");
    const colW = [190, 100, 100, 109];
    b.tableHeader([
      { text: "Projeto", width: colW[0] },
      { text: "Status", width: colW[1] },
      { text: "Saude", width: colW[2] },
      { text: "Deadline", width: colW[3] },
    ]);
    for (const p of list.slice(0, 25)) {
      const sc = p.status === "active" ? SQUAD.success : p.status === "delayed" || p.status === "atrasado" ? SQUAD.error : SQUAD.muted;
      const sl = p.status === "active" ? "Ativo" : p.status === "delayed" || p.status === "atrasado" ? "Atrasado" : p.status === "completed" || p.status === "delivered" ? "Entregue" : p.status || "Briefing";
      const hs = p.health_score || 100;
      b.tableRow([
        { text: p.name || "", width: colW[0], bold: true },
        { text: sl, width: colW[1], color: sc },
        { text: `${hs}%`, width: colW[2], color: hs >= 80 ? SQUAD.success : hs >= 50 ? SQUAD.warning : SQUAD.error },
        { text: formatDate(p.due_date), width: colW[3], color: SQUAD.muted },
      ]);
    }
  }

  return { bytes: await b.save(), slug: `relatorio-360-${period}` };
}

// ─── Tasks PDF ────────────────────────────────────────────
async function buildTasksPdf(supabase: any) {
  const { data: tasks } = await supabase.from("tasks").select("*, project:projects(name)").order("created_at", { ascending: false }).limit(100);
  const list = tasks || [];

  const today = new Date().toISOString().split("T")[0];
  const totalTasks = list.length;
  const doneTasks = list.filter((t: any) => t.status === "done" || t.status === "delivered").length;
  const pendingTasks = list.filter((t: any) => t.status !== "done" && t.status !== "delivered").length;
  const overdueTasks = list.filter((t: any) => t.due_date && t.due_date < today && t.status !== "done" && t.status !== "delivered").length;

  const b = new SquadPdfBuilder();
  await b.init();

  b.coverPage({
    subtitle: "Visao Operacional",
    titleLine1: "Quadro de",
    titleLine2: "Tarefas",
    description: `${totalTasks} tarefas registradas`,
    date: formatDateShort(),
  });

  b.newPage();
  b.heroSection("Indicadores", "de Tarefas.", "Status Geral");
  b.kpiRow([
    { label: "Total", value: `${totalTasks}` },
    { label: "Pendentes", value: `${pendingTasks}`, color: SQUAD.accent },
    { label: "Concluidas", value: `${doneTasks}`, color: SQUAD.success },
    { label: "Vencidas", value: `${overdueTasks}`, color: overdueTasks > 0 ? SQUAD.error : SQUAD.white },
  ]);

  b.sectionTitle("Lista de Tarefas");
  const colW = [190, 120, 80, 109];
  b.tableHeader([
    { text: "Tarefa", width: colW[0] },
    { text: "Projeto", width: colW[1] },
    { text: "Status", width: colW[2] },
    { text: "Prazo", width: colW[3] },
  ]);

  for (const t of list.slice(0, 50)) {
    const statusLabel = t.status === "done" || t.status === "delivered" ? "Concluido"
      : t.status === "in_progress" || t.status === "execution" ? "Execucao"
      : t.status === "review" ? "Revisao" : "Pendente";
    const sc = t.status === "done" || t.status === "delivered" ? SQUAD.success
      : t.status === "in_progress" || t.status === "execution" ? SQUAD.accent : SQUAD.muted;
    const isOverdue = t.due_date && t.due_date < today && t.status !== "done" && t.status !== "delivered";
    b.tableRow([
      { text: t.title || "Tarefa", width: colW[0], bold: true },
      { text: t.project?.name || "", width: colW[1], color: SQUAD.muted },
      { text: statusLabel, width: colW[2], color: sc },
      { text: formatDate(t.due_date), width: colW[3], color: isOverdue ? SQUAD.error : SQUAD.muted },
    ]);
  }

  if (overdueTasks > 0) {
    b.alertBanner("ALERTA DE VENCIMENTO", `${overdueTasks} tarefa(s) vencida(s) requerem atencao imediata`);
  }

  return { bytes: await b.save(), slug: "quadro-de-tarefas" };
}

// ─── Finance PDF ──────────────────────────────────────────
async function buildFinancePdf(supabase: any, period: string) {
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
  const marginPct = received > 0 ? Math.round(((received - paidExp) / received) * 100) : 0;

  const days30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const proj30 = balance
    + revList.filter((r: any) => r.status === "pending" && r.due_date <= days30).reduce((s: number, r: any) => s + Number(r.amount), 0)
    - expList.filter((e: any) => e.status === "pending" && e.due_date <= days30).reduce((s: number, e: any) => s + Number(e.amount), 0);

  const b = new SquadPdfBuilder();
  await b.init();

  b.coverPage({
    subtitle: label,
    titleLine1: "Relatorio",
    titleLine2: "Financeiro",
    description: "Panorama financeiro completo",
    date: formatDateShort(),
  });

  b.newPage();
  b.heroSection("Indicadores", "Financeiros.", "Resumo Executivo");
  b.kpiRow([
    { label: "Saldo em Caixa", value: formatCurrency(balance), color: SQUAD.success },
    { label: "Receita Pendente", value: formatCurrency(pending), color: SQUAD.accent },
    { label: "Despesas Pagas", value: formatCurrency(paidExp), color: SQUAD.error },
    { label: "Margem Liquida", value: `${marginPct}%`, color: SQUAD.warning },
  ]);

  b.sectionTitle("Projecao 30 Dias");
  b.pricingCard({
    subtitle: "Saldo Estimado",
    title: proj30 >= balance ? "PREVISAO POSITIVA" : "ATENCAO - SALDO EM QUEDA",
    value: formatCurrency(proj30),
  });

  b.sectionTitle("Aging de Recebiveis");
  const agingGroups = [
    { range: "A vencer", items: revList.filter((r: any) => (r.status === "pending" || r.status === "overdue") && r.due_date >= today), color: SQUAD.success },
    { range: "1-7 dias vencido", items: revList.filter((r: any) => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d >= 1 && d <= 7; }), color: SQUAD.warning },
    { range: "8-30 dias vencido", items: revList.filter((r: any) => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d >= 8 && d <= 30; }), color: SQUAD.warning },
    { range: "+30 dias vencido", items: revList.filter((r: any) => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d > 30; }), color: SQUAD.error },
  ];

  for (const ag of agingGroups) {
    const val = ag.items.reduce((s: number, r: any) => s + Number(r.amount), 0);
    b.progressBar(sanitize(ag.range), `${ag.items.length} itens - ${formatCurrency(val)}`, val > 0 ? Math.min(100, (val / Math.max(received, 1)) * 100) : 0, ag.color);
  }

  b.sectionTitle("Pagamentos Recentes");
  const recent = revList.filter((r: any) => r.status === "received" && r.received_date)
    .sort((a: any, bb: any) => new Date(bb.received_date).getTime() - new Date(a.received_date).getTime())
    .slice(0, 10);

  if (recent.length > 0) {
    const colW = [220, 120, 159];
    b.tableHeader([
      { text: "Descricao", width: colW[0] },
      { text: "Data", width: colW[1] },
      { text: "Valor", width: colW[2] },
    ]);
    for (const p of recent) {
      b.tableRow([
        { text: (p.description || "").substring(0, 40), width: colW[0] },
        { text: formatDate(p.received_date), width: colW[1], color: SQUAD.muted },
        { text: `+${formatCurrency(Number(p.amount))}`, width: colW[2], color: SQUAD.success, bold: true },
      ]);
    }
  } else {
    b.text("Nenhum pagamento recebido recentemente", { color: SQUAD.muted });
  }

  if (overdueAmt > 0) {
    const overdueCount = revList.filter((r: any) => r.status !== "received" && r.due_date < today).length;
    b.alertBanner("ALERTA DE INADIMPLENCIA", `${overdueCount} receita(s) vencida(s) totalizando ${formatCurrency(overdueAmt)}`);
  }

  return { bytes: await b.save(), slug: `financeiro-${period}` };
}

// ─── Main Handler ─────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const input = (await req.json()) as ExportInput;
    const { type, id, period = "3m", token } = input;

    console.log(`[export-pdf] Starting: type=${type}, id=${id}, period=${period}`);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (type === "portal" && token) {
      const { data: portalLink, error: portalError } = await supabase.from("portal_links").select("*").eq("share_token", token).eq("is_active", true).single();
      if (portalError || !portalLink) throw new Error("Token de portal invalido");
    } else if (authHeader) {
      const t = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(t);
      if (user) userId = user.id;
    }

    // ── HTML-based exports (Gemini AI) ──────────────────────
    if (type === "project" || type === "portal") {
      const projectId = id || "";
      if (!projectId) throw new Error("ID do projeto e obrigatorio");

      const { html, slug } = await buildProjectHtml(supabase, projectId);

      console.log(`[export-pdf] Done (HTML via Gemini): ${slug}`);

      return new Response(JSON.stringify({
        success: true,
        html,
        slug: type === "portal" ? `portal-${slug}` : slug,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── PDF-binary exports (legacy pdf-lib) ─────────────────
    let result: { bytes: Uint8Array; slug: string };

    switch (type) {
      case "report_360":
        result = await buildReport360Pdf(supabase, period);
        break;
      case "finance":
        result = await buildFinancePdf(supabase, period);
        break;
      case "tasks":
        result = await buildTasksPdf(supabase);
        break;
      case "project_overview":
        result = await buildReport360Pdf(supabase, period);
        result.slug = "command-center-projetos";
        break;
      default:
        throw new Error(`Tipo nao suportado: ${type}`);
    }

    // Upload binary PDF to storage
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const fileName = `${result.slug}-${now.getTime()}.pdf`;
    const storagePath = `exports/${type}/${yearMonth}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("exports").upload(storagePath, result.bytes, {
      contentType: "application/pdf", upsert: true,
    });
    if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from("exports").createSignedUrl(storagePath, 1800);
    const url = signedUrlError
      ? supabase.storage.from("exports").getPublicUrl(storagePath).data.publicUrl
      : signedUrlData.signedUrl;

    try {
      await supabase.from("pdf_exports").insert({
        type, entity_id: id || null, entity_name: result.slug,
        storage_path: storagePath, file_name: fileName,
        content_type: "application/pdf", status: "completed",
        created_by: userId, created_by_portal_token: token || null,
        completed_at: new Date().toISOString(),
      });
    } catch { /* ignore tracking errors */ }

    console.log(`[export-pdf] Done: ${storagePath}`);

    return new Response(JSON.stringify({
      success: true, signed_url: url, public_url: url,
      storage_path: storagePath, file_name: fileName,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[export-pdf] Error:", error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
