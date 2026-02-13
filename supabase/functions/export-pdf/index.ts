/**
 * export-pdf - Edge Function unificada para exportação de PDFs REAIS
 * Usa pdf-lib para gerar PDF binário (não HTML).
 *
 * Tipos: project, report_360, tasks, finance, portal, project_overview
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Colors (rgb 0-1)
const C = {
  bg: rgb(0.02, 0.02, 0.02),
  surface: rgb(0.04, 0.04, 0.04),
  border: rgb(0.1, 0.1, 0.1),
  primary: rgb(0.024, 0.714, 0.831),
  white: rgb(1, 1, 1),
  muted: rgb(0.45, 0.45, 0.45),
  success: rgb(0.133, 0.773, 0.369),
  warning: rgb(0.918, 0.702, 0.031),
  error: rgb(0.937, 0.267, 0.267),
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

interface ExportInput {
  type: "project" | "report_360" | "tasks" | "finance" | "portal" | "project_overview";
  id?: string;
  period?: string;
  token?: string;
  filters?: Record<string, unknown>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);
}

function formatDate(date: string | Date | null): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "-"; }
}

function generateSlug(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 50);
}

function getPeriodDates(period: string) {
  const end = new Date();
  const start = new Date();
  let label = "";
  switch (period) {
    case "1m": start.setMonth(start.getMonth() - 1); label = "1 Mes"; break;
    case "3m": start.setMonth(start.getMonth() - 3); label = "3 Meses"; break;
    case "6m": start.setMonth(start.getMonth() - 6); label = "6 Meses"; break;
    case "1y": start.setFullYear(start.getFullYear() - 1); label = "1 Ano"; break;
    default: start.setMonth(start.getMonth() - 3); label = "3 Meses";
  }
  return { start, end, label };
}

// Sanitize text for pdf-lib (remove chars that can't be encoded in WinAnsiEncoding)
function sanitize(str: string | null | undefined): string {
  if (!str) return "";
  // Replace common unicode that WinAnsiEncoding can't handle
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--")
    .replace(/\u2022/g, "*")
    .replace(/[^\x00-\xFF]/g, ""); // strip anything outside Latin-1
}

// PDF builder helpers
class PdfBuilder {
  doc!: InstanceType<typeof PDFDocument>;
  font!: ReturnType<Awaited<ReturnType<typeof PDFDocument.create>>["embedFont"]>;
  fontBold!: ReturnType<Awaited<ReturnType<typeof PDFDocument.create>>["embedFont"]>;
  page!: ReturnType<InstanceType<typeof PDFDocument>["addPage"]>;
  y = PAGE_H - MARGIN;

  async init() {
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.fontBold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.bg });
    this.y = PAGE_H - MARGIN;
  }

  ensureSpace(needed: number) {
    if (this.y < MARGIN + needed) this.newPage();
  }

  text(str: string, opts: { x?: number; size?: number; color?: any; bold?: boolean; maxWidth?: number } = {}) {
    const { x = MARGIN, size = 10, color = C.white, bold = false, maxWidth = CONTENT_W } = opts;
    const font = bold ? this.fontBold : this.font;
    const clean = sanitize(str);
    if (!clean) return;

    const words = clean.split(" ");
    let line = "";
    const lineHeight = size * 1.4;

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(test, size);
      if (w > maxWidth && line) {
        this.ensureSpace(lineHeight);
        this.page.drawText(line, { x, y: this.y, size, font, color });
        this.y -= lineHeight;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      this.ensureSpace(lineHeight);
      this.page.drawText(line, { x, y: this.y, size, font, color });
      this.y -= lineHeight;
    }
  }

  sectionHeader(title: string) {
    this.ensureSpace(30);
    this.y -= 10;
    this.page.drawRectangle({ x: MARGIN, y: this.y - 2, width: 3, height: 14, color: C.primary });
    this.page.drawText(sanitize(title.toUpperCase()), { x: MARGIN + 10, y: this.y, size: 10, font: this.fontBold, color: C.primary });
    this.y -= 24;
  }

  kpiRow(kpis: { label: string; value: string; color?: any }[]) {
    const count = kpis.length;
    const gap = 4;
    const cardW = (CONTENT_W - gap * (count - 1)) / count;
    const cardH = 56;
    this.ensureSpace(cardH + 10);

    kpis.forEach((kpi, i) => {
      const x = MARGIN + i * (cardW + gap);
      this.page.drawRectangle({ x, y: this.y - cardH, width: cardW, height: cardH, color: C.surface });
      this.page.drawText(sanitize(kpi.label.toUpperCase()), {
        x: x + 8, y: this.y - 16, size: 7, font: this.fontBold, color: C.muted,
      });
      this.page.drawText(sanitize(kpi.value), {
        x: x + 8, y: this.y - 38, size: 18, font: this.fontBold, color: kpi.color || C.white,
      });
    });
    this.y -= cardH + 12;
  }

  tableRow(cols: { text: string; width: number; color?: any; bold?: boolean }[], isHeader = false) {
    const rowH = isHeader ? 20 : 18;
    this.ensureSpace(rowH + 4);
    if (isHeader) {
      this.page.drawRectangle({ x: MARGIN, y: this.y - rowH, width: CONTENT_W, height: rowH, color: C.surface });
    }
    let xOff = MARGIN + 8;
    cols.forEach(col => {
      const font = col.bold || isHeader ? this.fontBold : this.font;
      const size = isHeader ? 7 : 9;
      const color = col.color || (isHeader ? C.muted : C.white);
      const t = sanitize(col.text).substring(0, 60);
      this.page.drawText(t, { x: xOff, y: this.y - (isHeader ? 13 : 12), size, font, color });
      xOff += col.width;
    });
    this.page.drawLine({
      start: { x: MARGIN, y: this.y - rowH },
      end: { x: MARGIN + CONTENT_W, y: this.y - rowH },
      thickness: 0.5,
      color: C.border,
    });
    this.y -= rowH;
  }

  footer(refCode: string) {
    const y = MARGIN - 10;
    this.page.drawLine({ start: { x: MARGIN, y: y + 12 }, end: { x: PAGE_W - MARGIN, y: y + 12 }, thickness: 0.5, color: C.border });
    this.page.drawText("SQUAD Hub", { x: MARGIN, y, size: 7, font: this.font, color: C.muted });
    this.page.drawText(sanitize(`Ref: ${refCode}`), {
      x: PAGE_W - MARGIN - this.font.widthOfTextAtSize(`Ref: ${refCode}`, 7),
      y, size: 7, font: this.font, color: C.primary,
    });
  }

  addFooterToAllPages(refCode: string) {
    const pages = this.doc.getPages();
    for (const p of pages) {
      const y = MARGIN - 10;
      p.drawLine({ start: { x: MARGIN, y: y + 12 }, end: { x: PAGE_W - MARGIN, y: y + 12 }, thickness: 0.5, color: C.border });
      p.drawText("SQUAD Hub", { x: MARGIN, y, size: 7, font: this.font, color: C.muted });
      const refText = sanitize(`Ref: ${refCode}`);
      p.drawText(refText, {
        x: PAGE_W - MARGIN - this.font.widthOfTextAtSize(refText, 7),
        y, size: 7, font: this.font, color: C.primary,
      });
    }
  }

  async save(): Promise<Uint8Array> {
    return await this.doc.save();
  }
}

// ─── Builders ─────────────────────────────────────────────

async function buildProjectPdf(supabase: any, projectId: string): Promise<{ bytes: Uint8Array; slug: string; refCode: string }> {
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (error || !project) throw new Error(`Projeto nao encontrado: ${error?.message || "ID invalido"}`);

  const [{ data: milestones }, { data: stages }, { data: deliverables }] = await Promise.all([
    supabase.from("payment_milestones").select("*").eq("project_id", projectId).order("due_date"),
    supabase.from("project_stages").select("*").eq("project_id", projectId).order("created_at"),
    supabase.from("project_deliverables").select("*").eq("project_id", projectId).order("created_at"),
  ]);

  const b = new PdfBuilder();
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

  // Title
  b.text(project.name || "Projeto", { size: 24, bold: true });
  b.text(`Relatorio do Projeto • ${formatDate(new Date())}`, { size: 10, color: C.muted });
  b.y -= 20;

  // KPIs
  b.kpiRow([
    { label: "Valor do Contrato", value: formatCurrency(contractValue) },
    { label: "Saude", value: `${healthScore}%`, color: healthScore >= 80 ? C.success : healthScore >= 50 ? C.warning : C.error },
    { label: "Progresso", value: `${progressPercent}%`, color: C.primary },
    { label: "Pagamento", value: `${paymentPercent}%` },
  ]);

  // Stages table
  if (stageList.length > 0) {
    b.sectionHeader("Cronograma de Etapas");
    const colW = [180, 100, 120, 115];
    b.tableRow([
      { text: "ETAPA", width: colW[0] },
      { text: "STATUS", width: colW[1] },
      { text: "INICIO", width: colW[2] },
      { text: "FIM PREVISTO", width: colW[3] },
    ], true);
    for (const s of stageList) {
      const statusLabel = s.status === "concluido" ? "Concluido" : s.status === "em_andamento" ? "Em Andamento" : "Pendente";
      const statusColor = s.status === "concluido" ? C.success : s.status === "em_andamento" ? C.primary : C.muted;
      b.tableRow([
        { text: s.name || "", width: colW[0], bold: true },
        { text: statusLabel, width: colW[1], color: statusColor },
        { text: formatDate(s.start_date), width: colW[2], color: C.muted },
        { text: formatDate(s.end_date), width: colW[3], color: C.muted },
      ]);
    }
  }

  // Deliverables
  if (delivList.length > 0) {
    b.sectionHeader("Entregas");
    const colW = [200, 80, 100, 135];
    b.tableRow([
      { text: "ENTREGA", width: colW[0] },
      { text: "TIPO", width: colW[1] },
      { text: "STATUS", width: colW[2] },
      { text: "VERSAO", width: colW[3] },
    ], true);
    for (const d of delivList.slice(0, 15)) {
      const sc = d.status === "aprovado" || d.status === "entregue" ? C.success : d.status === "revisao" ? C.warning : C.muted;
      b.tableRow([
        { text: d.title || "", width: colW[0] },
        { text: (d.type || "outro").toUpperCase(), width: colW[1], color: C.muted },
        { text: d.status || "rascunho", width: colW[2], color: sc },
        { text: `v${d.version || 1}`, width: colW[3] },
      ]);
    }
  }

  // Milestones
  if (mileList.length > 0) {
    b.sectionHeader("Condicoes Financeiras");
    const colW = [180, 120, 120, 95];
    b.tableRow([
      { text: "PARCELA", width: colW[0] },
      { text: "VALOR", width: colW[1] },
      { text: "VENCIMENTO", width: colW[2] },
      { text: "STATUS", width: colW[3] },
    ], true);
    for (const m of mileList) {
      const sc = m.status === "paid" ? C.success : m.status === "overdue" ? C.error : C.muted;
      const sl = m.status === "paid" ? "Pago" : m.status === "overdue" ? "Vencido" : "Pendente";
      b.tableRow([
        { text: m.description || "Parcela", width: colW[0] },
        { text: formatCurrency(Number(m.amount) || 0), width: colW[1], bold: true },
        { text: formatDate(m.due_date), width: colW[2], color: C.muted },
        { text: sl, width: colW[3], color: sc },
      ]);
    }
  }

  const refCode = `PRJ-${new Date().getFullYear()}-${projectId.slice(0, 4).toUpperCase()}`;
  b.addFooterToAllPages(refCode);
  return { bytes: await b.save(), slug: generateSlug(project.name || "projeto"), refCode };
}

async function buildReport360Pdf(supabase: any, period: string): Promise<{ bytes: Uint8Array; slug: string; refCode: string }> {
  const { start, label } = getPeriodDates(period);

  const { data: projects } = await supabase.from("projects").select("*").gte("created_at", start.toISOString()).order("created_at", { ascending: false });
  const list = projects || [];

  const total = list.length;
  const active = list.filter((p: any) => p.status === "active").length;
  const delayed = list.filter((p: any) => p.status === "delayed" || p.status === "atrasado").length;
  const completed = list.filter((p: any) => p.status === "completed" || p.status === "delivered").length;
  const avgHealth = total > 0 ? Math.round(list.reduce((s: number, p: any) => s + (p.health_score || 100), 0) / total) : 100;
  const totalValue = list.reduce((s: number, p: any) => s + (Number(p.contract_value) || 0), 0);

  const b = new PdfBuilder();
  await b.init();

  b.text("RELATORIO 360", { size: 26, bold: true });
  b.text(`${label} • Gerado em ${formatDate(new Date())}`, { size: 10, color: C.muted });
  b.y -= 20;

  b.kpiRow([
    { label: "Entregues", value: `${completed}`, color: C.success },
    { label: "Abertos", value: `${active}` },
    { label: "Atrasados", value: `${delayed}`, color: delayed > 0 ? C.error : C.white },
    { label: "Saude Media", value: `${avgHealth}%`, color: avgHealth >= 80 ? C.success : C.warning },
  ]);

  // Summary card
  b.sectionHeader("Resumo do Periodo");
  b.ensureSpace(50);
  const summaryItems = [
    { label: "Total Projetos", value: `${total}` },
    { label: "Finalizados", value: `${completed}` },
    { label: "Em Andamento", value: `${active}` },
    { label: "Investimento Total", value: formatCurrency(totalValue) },
  ];
  const sw = CONTENT_W / 4;
  summaryItems.forEach((item, i) => {
    const x = MARGIN + i * sw;
    b.page.drawRectangle({ x, y: b.y - 44, width: sw - 2, height: 44, color: C.surface });
    b.page.drawText(sanitize(item.value), { x: x + 8, y: b.y - 20, size: 20, font: b.fontBold, color: C.white });
    b.page.drawText(sanitize(item.label.toUpperCase()), { x: x + 8, y: b.y - 36, size: 7, font: b.font, color: C.muted });
  });
  b.y -= 56;

  // Projects table
  if (list.length > 0) {
    b.sectionHeader("Projetos no Periodo");
    const colW = [200, 100, 100, 115];
    b.tableRow([
      { text: "PROJETO", width: colW[0] },
      { text: "STATUS", width: colW[1] },
      { text: "SAUDE", width: colW[2] },
      { text: "DEADLINE", width: colW[3] },
    ], true);
    for (const p of list.slice(0, 20)) {
      const sc = p.status === "active" ? C.success : p.status === "delayed" || p.status === "atrasado" ? C.error : C.muted;
      const sl = p.status === "active" ? "Ativo" : p.status === "delayed" || p.status === "atrasado" ? "Atrasado" : p.status === "completed" || p.status === "delivered" ? "Entregue" : p.status || "Briefing";
      const hs = p.health_score || 100;
      b.tableRow([
        { text: p.name || "", width: colW[0], bold: true },
        { text: sl, width: colW[1], color: sc },
        { text: `${hs}%`, width: colW[2], color: hs >= 80 ? C.success : hs >= 50 ? C.warning : C.error },
        { text: formatDate(p.due_date), width: colW[3], color: C.muted },
      ]);
    }
  }

  const refCode = `360-R-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  b.addFooterToAllPages(refCode);
  return { bytes: await b.save(), slug: `relatorio-360-${period}`, refCode };
}

async function buildTasksPdf(supabase: any): Promise<{ bytes: Uint8Array; slug: string; refCode: string }> {
  const { data: tasks } = await supabase.from("tasks").select("*, project:projects(name)").order("created_at", { ascending: false }).limit(100);
  const list = tasks || [];

  const today = new Date().toISOString().split("T")[0];
  const totalTasks = list.length;
  const doneTasks = list.filter((t: any) => t.status === "done" || t.status === "delivered").length;
  const pendingTasks = list.filter((t: any) => t.status !== "done" && t.status !== "delivered").length;
  const overdueTasks = list.filter((t: any) => t.due_date && t.due_date < today && t.status !== "done" && t.status !== "delivered").length;

  const b = new PdfBuilder();
  await b.init();

  b.text("WORKFLOW DE TAREFAS", { size: 24, bold: true });
  b.text(`Gerado em ${formatDate(new Date())}`, { size: 10, color: C.muted });
  b.y -= 20;

  b.kpiRow([
    { label: "Total", value: `${totalTasks}` },
    { label: "Pendentes", value: `${pendingTasks}`, color: C.primary },
    { label: "Concluidas", value: `${doneTasks}`, color: C.success },
    { label: "Vencidas", value: `${overdueTasks}`, color: overdueTasks > 0 ? C.error : C.white },
  ]);

  // Status columns summary
  const statusGroups: Record<string, { label: string; items: any[] }> = {
    briefing: { label: "Briefing", items: list.filter((t: any) => t.status === "todo" || t.status === "briefing" || t.status === "backlog") },
    execution: { label: "Em Execucao", items: list.filter((t: any) => t.status === "in_progress" || t.status === "execution" || t.status === "today" || t.status === "week") },
    review: { label: "Revisao", items: list.filter((t: any) => t.status === "review") },
    done: { label: "Concluido", items: list.filter((t: any) => t.status === "done" || t.status === "delivered") },
  };

  b.sectionHeader("Distribuicao por Status");
  b.ensureSpace(50);
  const entries = Object.values(statusGroups);
  const bw = CONTENT_W / entries.length;
  entries.forEach((g, i) => {
    const x = MARGIN + i * bw;
    b.page.drawRectangle({ x, y: b.y - 44, width: bw - 3, height: 44, color: C.surface });
    b.page.drawText(`${g.items.length}`, { x: x + 10, y: b.y - 22, size: 22, font: b.fontBold, color: C.primary });
    b.page.drawText(sanitize(g.label.toUpperCase()), { x: x + 10, y: b.y - 38, size: 7, font: b.font, color: C.muted });
  });
  b.y -= 56;

  // Tasks table
  b.sectionHeader("Lista de Tarefas");
  const colW = [200, 120, 80, 115];
  b.tableRow([
    { text: "TAREFA", width: colW[0] },
    { text: "PROJETO", width: colW[1] },
    { text: "STATUS", width: colW[2] },
    { text: "PRAZO", width: colW[3] },
  ], true);

  for (const t of list.slice(0, 40)) {
    const statusLabel = t.status === "done" || t.status === "delivered" ? "Concluido"
      : t.status === "in_progress" || t.status === "execution" ? "Execucao"
      : t.status === "review" ? "Revisao"
      : "Pendente";
    const sc = t.status === "done" || t.status === "delivered" ? C.success
      : t.status === "in_progress" || t.status === "execution" ? C.primary
      : C.muted;
    const isOverdue = t.due_date && t.due_date < today && t.status !== "done" && t.status !== "delivered";
    b.tableRow([
      { text: t.title || "Tarefa", width: colW[0], bold: true },
      { text: t.project?.name || "", width: colW[1], color: C.muted },
      { text: statusLabel, width: colW[2], color: sc },
      { text: formatDate(t.due_date), width: colW[3], color: isOverdue ? C.error : C.muted },
    ]);
  }

  const refCode = `WF-${new Date().getFullYear()}-WK${Math.ceil(new Date().getDate() / 7)}`;
  b.addFooterToAllPages(refCode);
  return { bytes: await b.save(), slug: "workflow-tarefas", refCode };
}

async function buildFinancePdf(supabase: any, period: string): Promise<{ bytes: Uint8Array; slug: string; refCode: string }> {
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

  // 30-day projection
  const days30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const proj30 = balance
    + revList.filter((r: any) => r.status === "pending" && r.due_date <= days30).reduce((s: number, r: any) => s + Number(r.amount), 0)
    - expList.filter((e: any) => e.status === "pending" && e.due_date <= days30).reduce((s: number, e: any) => s + Number(e.amount), 0);

  const b = new PdfBuilder();
  await b.init();

  b.text("RELATORIO FINANCEIRO", { size: 24, bold: true });
  b.text(`${label} • Gerado em ${formatDate(new Date())}`, { size: 10, color: C.muted });
  b.y -= 20;

  b.kpiRow([
    { label: "Saldo em Caixa", value: formatCurrency(balance), color: C.success },
    { label: "Receita Pendente", value: formatCurrency(pending), color: C.primary },
    { label: "Despesas Pagas", value: formatCurrency(paidExp), color: C.error },
    { label: "Margem Liquida", value: `${marginPct}%`, color: C.warning },
  ]);

  // 30-day projection
  b.sectionHeader("Projecao 30 Dias");
  b.ensureSpace(50);
  b.page.drawRectangle({ x: MARGIN, y: b.y - 44, width: CONTENT_W, height: 44, color: C.surface });
  b.page.drawText("Saldo Estimado em 30 dias", { x: MARGIN + 12, y: b.y - 16, size: 9, font: b.font, color: C.muted });
  b.page.drawText(sanitize(formatCurrency(proj30)), { x: MARGIN + 12, y: b.y - 36, size: 18, font: b.fontBold, color: C.primary });
  const projLabel = proj30 >= balance ? "PREVISAO POSITIVA" : "ATENCAO";
  const projColor = proj30 >= balance ? C.success : C.error;
  b.page.drawText(sanitize(projLabel), { x: PAGE_W - MARGIN - 120, y: b.y - 28, size: 10, font: b.fontBold, color: projColor });
  b.y -= 56;

  // Aging
  b.sectionHeader("Aging de Recebiveis");
  const agingGroups = [
    { range: "A vencer", items: revList.filter((r: any) => (r.status === "pending" || r.status === "overdue") && r.due_date >= today), color: C.success },
    { range: "1-7 dias vencido", items: revList.filter((r: any) => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d >= 1 && d <= 7; }), color: C.warning },
    { range: "8-30 dias vencido", items: revList.filter((r: any) => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d >= 8 && d <= 30; }), color: rgb(0.976, 0.451, 0.086) },
    { range: "+30 dias vencido", items: revList.filter((r: any) => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d > 30; }), color: C.error },
  ];

  for (const ag of agingGroups) {
    b.ensureSpace(22);
    const val = ag.items.reduce((s: number, r: any) => s + Number(r.amount), 0);
    b.page.drawRectangle({ x: MARGIN, y: b.y - 20, width: CONTENT_W, height: 20, color: C.surface });
    b.page.drawText(sanitize(ag.range), { x: MARGIN + 10, y: b.y - 14, size: 9, font: b.fontBold, color: ag.color });
    b.page.drawText(`${ag.items.length} itens`, { x: MARGIN + 200, y: b.y - 14, size: 8, font: b.font, color: C.muted });
    const valText = sanitize(formatCurrency(val));
    b.page.drawText(valText, {
      x: PAGE_W - MARGIN - 10 - b.font.widthOfTextAtSize(valText, 9),
      y: b.y - 14, size: 9, font: b.fontBold, color: C.white,
    });
    b.y -= 24;
  }

  // Recent payments
  b.sectionHeader("Pagamentos Recentes");
  const recent = revList.filter((r: any) => r.status === "received" && r.received_date)
    .sort((a: any, b: any) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime())
    .slice(0, 8);

  if (recent.length > 0) {
    const colW = [220, 120, 175];
    b.tableRow([
      { text: "DESCRICAO", width: colW[0] },
      { text: "DATA", width: colW[1] },
      { text: "VALOR", width: colW[2] },
    ], true);
    for (const p of recent) {
      b.tableRow([
        { text: (p.description || "").substring(0, 40), width: colW[0] },
        { text: formatDate(p.received_date), width: colW[1], color: C.muted },
        { text: `+${formatCurrency(Number(p.amount))}`, width: colW[2], color: C.success, bold: true },
      ]);
    }
  } else {
    b.text("Nenhum pagamento recebido recentemente", { color: C.muted });
  }

  // Overdue alert
  if (overdueAmt > 0) {
    b.y -= 10;
    b.ensureSpace(36);
    b.page.drawRectangle({ x: MARGIN, y: b.y - 36, width: CONTENT_W, height: 36, color: rgb(0.937, 0.267, 0.267, 0.1) });
    b.page.drawText("ALERTA DE INADIMPLENCIA", { x: MARGIN + 12, y: b.y - 16, size: 10, font: b.fontBold, color: C.error });
    const overdueCount = revList.filter((r: any) => r.status !== "received" && r.due_date < today).length;
    b.page.drawText(sanitize(`${overdueCount} receita(s) vencida(s) totalizando ${formatCurrency(overdueAmt)}`), {
      x: MARGIN + 12, y: b.y - 30, size: 8, font: b.font, color: C.muted,
    });
    b.y -= 46;
  }

  const refCode = `FIN-${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
  b.addFooterToAllPages(refCode);
  return { bytes: await b.save(), slug: `financeiro-${period}`, refCode };
}

// ─── Main handler ─────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const input = (await req.json()) as ExportInput;
    const { type, id, period = "3m", token } = input;

    console.log(`[export-pdf] Starting: type=${type}, id=${id}, period=${period}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth (optional tracking)
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

    let result: { bytes: Uint8Array; slug: string; refCode: string };

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
        result.refCode = `PM-DASH-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        break;
      case "portal":
        if (!id && !token) throw new Error("ID ou token do portal e obrigatorio");
        result = await buildProjectPdf(supabase, id || "");
        result.slug = `portal-${result.slug}`;
        result.refCode = `PRT-${new Date().getFullYear()}-${(id || "").slice(0, 4).toUpperCase()}`;
        break;
      default:
        throw new Error(`Tipo nao suportado: ${type}`);
    }

    // Upload as real PDF
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const fileName = `${result.slug}-${now.getTime()}.pdf`;
    const storagePath = `exports/${type}/${yearMonth}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("exports").upload(storagePath, result.bytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);

    // Signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from("exports").createSignedUrl(storagePath, 1800);

    const url = signedUrlError
      ? supabase.storage.from("exports").getPublicUrl(storagePath).data.publicUrl
      : signedUrlData.signedUrl;

    // Track export (best-effort)
    try {
      await supabase.from("pdf_exports").insert({
        type,
        entity_id: id || null,
        entity_name: result.slug,
        storage_path: storagePath,
        file_name: fileName,
        content_type: "application/pdf",
        status: "completed",
        created_by: userId,
        created_by_portal_token: token || null,
        completed_at: new Date().toISOString(),
      });
    } catch { /* ignore tracking errors */ }

    console.log(`[export-pdf] Done: ${storagePath}`);

    return new Response(
      JSON.stringify({
        success: true,
        signed_url: url,
        public_url: url,
        storage_path: storagePath,
        file_name: fileName,
        expires_at: signedUrlError ? undefined : new Date(Date.now() + 1800000).toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[export-pdf] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
