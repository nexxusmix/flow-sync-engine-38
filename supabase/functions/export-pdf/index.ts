/**
 * export-pdf — Unified PDF Generator with SQUAD Swiss design
 * Supports: project, report_360, tasks, finance, portal, project_overview
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SquadPdfBuilder, SQUAD, MARGIN, PAGE_W, CONTENT_W, sanitize, formatCurrency, formatDate, formatDateShort, getPeriodDates, slugify } from "../_shared/pdf-design.ts";

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

// ─── Project PDF ──────────────────────────────────────────
async function buildProjectPdf(supabase: any, projectId: string) {
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (error || !project) throw new Error(`Projeto nao encontrado: ${error?.message || "ID invalido"}`);

  const [{ data: milestones }, { data: stages }, { data: deliverables }] = await Promise.all([
    supabase.from("payment_milestones").select("*").eq("project_id", projectId).order("due_date"),
    supabase.from("project_stages").select("*").eq("project_id", projectId).order("created_at"),
    supabase.from("project_deliverables").select("*").eq("project_id", projectId).order("created_at"),
  ]);

  const b = new SquadPdfBuilder();
  await b.init();

  const contractValue = Number(project.contract_value) || 0;
  const healthScore = project.health_score || 100;
  const stageList = stages || [];
  const delivList = deliverables || [];
  const mileList = milestones || [];
  const completedStages = stageList.filter((s: any) => s.status === "concluido").length;
  const progressPercent = stageList.length > 0 ? Math.round((completedStages / stageList.length) * 100) : 0;
  const paidMilestones = mileList.filter((m: any) => m.status === "paid").reduce((s: number, m: any) => s + Number(m.amount || 0), 0);
  const paymentPercent = contractValue > 0 ? Math.round((paidMilestones / contractValue) * 100) : 0;

  // Cover
  b.coverPage({
    subtitle: "Relatorio do Projeto",
    titleLine1: project.name || "Projeto",
    titleLine2: "Relatorio",
    description: `Cliente: ${project.client_name || "--"} | Gerado em ${formatDateShort()}`,
    date: formatDateShort(),
  });

  // KPIs
  b.newPage();
  b.heroSection("Visao", "Geral.", "Indicadores do Projeto");
  b.kpiRow([
    { label: "Valor do Contrato", value: formatCurrency(contractValue) },
    { label: "Saude", value: `${healthScore}%`, color: healthScore >= 80 ? SQUAD.success : healthScore >= 50 ? SQUAD.warning : SQUAD.error },
    { label: "Progresso", value: `${progressPercent}%`, color: SQUAD.accent },
    { label: "Pagamento", value: `${paymentPercent}%` },
  ]);

  // Stages
  if (stageList.length > 0) {
    b.sectionTitle("Cronograma de Etapas");
    const colW = [180, 100, 110, 109];
    b.tableHeader([
      { text: "Etapa", width: colW[0] },
      { text: "Status", width: colW[1] },
      { text: "Inicio", width: colW[2] },
      { text: "Fim Previsto", width: colW[3] },
    ]);
    for (const s of stageList) {
      const sl = s.status === "concluido" ? "Concluido" : s.status === "em_andamento" ? "Em Andamento" : "Pendente";
      const sc = s.status === "concluido" ? SQUAD.success : s.status === "em_andamento" ? SQUAD.accent : SQUAD.muted;
      b.tableRow([
        { text: s.name || "", width: colW[0], bold: true },
        { text: sl, width: colW[1], color: sc },
        { text: formatDate(s.start_date), width: colW[2], color: SQUAD.muted },
        { text: formatDate(s.end_date), width: colW[3], color: SQUAD.muted },
      ]);
    }
  }

  // Deliverables
  if (delivList.length > 0) {
    b.sectionTitle("Entregas");
    const colW = [190, 80, 100, 129];
    b.tableHeader([
      { text: "Entrega", width: colW[0] },
      { text: "Tipo", width: colW[1] },
      { text: "Status", width: colW[2] },
      { text: "Versao", width: colW[3] },
    ]);
    for (const d of delivList.slice(0, 20)) {
      const sc = d.status === "aprovado" || d.status === "entregue" ? SQUAD.success : d.status === "revisao" ? SQUAD.warning : SQUAD.muted;
      b.tableRow([
        { text: d.title || "", width: colW[0] },
        { text: (d.type || "outro").toUpperCase(), width: colW[1], color: SQUAD.muted },
        { text: d.status || "rascunho", width: colW[2], color: sc },
        { text: `v${d.version || 1}`, width: colW[3] },
      ]);
    }
  }

  // Milestones
  if (mileList.length > 0) {
    b.sectionTitle("Condicoes Financeiras");
    const colW = [170, 120, 120, 89];
    b.tableHeader([
      { text: "Parcela", width: colW[0] },
      { text: "Valor", width: colW[1] },
      { text: "Vencimento", width: colW[2] },
      { text: "Status", width: colW[3] },
    ]);
    for (const m of mileList) {
      const sc = m.status === "paid" ? SQUAD.success : m.status === "overdue" ? SQUAD.error : SQUAD.muted;
      const sl = m.status === "paid" ? "Pago" : m.status === "overdue" ? "Vencido" : "Pendente";
      b.tableRow([
        { text: m.description || "Parcela", width: colW[0] },
        { text: formatCurrency(Number(m.amount) || 0), width: colW[1], bold: true },
        { text: formatDate(m.due_date), width: colW[2], color: SQUAD.muted },
        { text: sl, width: colW[3], color: sc },
      ]);
    }
  }

  return { bytes: await b.save(), slug: slugify(project.name || "projeto") };
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

  // 30-day projection
  b.sectionTitle("Projecao 30 Dias");
  b.pricingCard({
    subtitle: "Saldo Estimado",
    title: proj30 >= balance ? "PREVISAO POSITIVA" : "ATENCAO - SALDO EM QUEDA",
    value: formatCurrency(proj30),
  });

  // Aging
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

  // Recent payments
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

    let result: { bytes: Uint8Array; slug: string };

    switch (type) {
      case "project":
        if (!id) throw new Error("ID do projeto e obrigatorio");
        result = await buildProjectPdf(supabase, id);
        break;
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
      case "portal":
        if (!id && !token) throw new Error("ID ou token do portal e obrigatorio");
        result = await buildProjectPdf(supabase, id || "");
        result.slug = `portal-${result.slug}`;
        break;
      default:
        throw new Error(`Tipo nao suportado: ${type}`);
    }

    // Upload
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
