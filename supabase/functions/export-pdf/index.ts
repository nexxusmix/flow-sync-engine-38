/**
 * export-pdf — Premium PDF Generator for HUB Platform
 * 
 * Dark premium design with cover page, numbered sections,
 * module-based accent colors, page numbering, and HUB branding.
 * Uses pdf-lib for real binary PDF generation.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Design Tokens ────────────────────────────────────────
const BG      = rgb(0.043, 0.059, 0.078);   // #0B0F14
const SURFACE = rgb(0.067, 0.078, 0.098);   // #111419
const BORDER  = rgb(0.118, 0.133, 0.157);   // #1E2228
const WHITE   = rgb(1, 1, 1);
const OFF_WHITE = rgb(0.88, 0.89, 0.91);
const MUTED   = rgb(0.45, 0.47, 0.50);
const DIM     = rgb(0.30, 0.32, 0.35);
const SUCCESS = rgb(0.133, 0.773, 0.369);
const WARNING = rgb(0.918, 0.702, 0.031);
const ERROR   = rgb(0.937, 0.267, 0.267);

// Module accent colors
const MODULE_COLORS: Record<string, ReturnType<typeof rgb>> = {
  produtora: rgb(0.024, 0.714, 0.831),   // Cyan tech
  marketing: rgb(0.976, 0.651, 0.086),   // Amber
  finance:   rgb(0.180, 0.757, 0.482),   // Green
  crm:       rgb(0.557, 0.337, 0.918),   // Purple
  default:   rgb(0.024, 0.714, 0.831),   // Cyan fallback
};

type ModuleKey = keyof typeof MODULE_COLORS;

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

interface ExportInput {
  type: "project" | "report_360" | "tasks" | "finance" | "portal" | "project_overview";
  id?: string;
  period?: string;
  token?: string;
  filters?: Record<string, unknown>;
}

// ─── Helpers ──────────────────────────────────────────────
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(value);
}

function formatDate(date: string | Date | null): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "—"; }
}

function formatDateShort(): string {
  const n = new Date();
  return `${String(n.getDate()).padStart(2, "0")}-${String(n.getMonth() + 1).padStart(2, "0")}-${n.getFullYear()}`;
}

function generateRefCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "HB";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function sanitize(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--")
    .replace(/\u2022/g, "*")
    .replace(/[^\x00-\xFF]/g, "");
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 50);
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

// ─── Premium PdfBuilder ───────────────────────────────────
class PdfBuilder {
  doc!: InstanceType<typeof PDFDocument>;
  font!: any;
  fontBold!: any;
  page!: any;
  y = PAGE_H - MARGIN;
  accent = MODULE_COLORS.default;
  sectionCounter = 0;
  moduleName = "HUB";
  pageCount = 0;

  async init(module: ModuleKey = "default") {
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.fontBold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.accent = MODULE_COLORS[module] || MODULE_COLORS.default;
    this.moduleName = module === "marketing" ? "HUB SOCIAL" :
                      module === "finance" ? "HUB FINANCEIRO" :
                      module === "crm" ? "HUB CRM" : "HUB PRODUTORA";
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pageCount++;
    // Dark background
    this.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG });
    // Subtle top accent line
    this.page.drawRectangle({ x: 0, y: PAGE_H - 2, width: PAGE_W, height: 2, color: this.accent });
    this.y = PAGE_H - MARGIN;
  }

  // ── Cover Page ──────────────────────────────────────────
  coverPage(opts: { title: string; subtitle?: string; clientName?: string; date: string; refCode: string }) {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pageCount++;
    const p = this.page;

    // Background
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG });

    // Top accent bar
    p.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: this.accent });

    // Subtle glow rectangle (accent tinted area at top)
    p.drawRectangle({
      x: 0, y: PAGE_H - 200, width: PAGE_W, height: 200,
      color: rgb(
        Math.min(1, (this.accent as any).red * 0.08),
        Math.min(1, (this.accent as any).green * 0.08),
        Math.min(1, (this.accent as any).blue * 0.08)
      ),
    });

    // Module name (small caps)
    p.drawText(sanitize(this.moduleName), {
      x: MARGIN, y: PAGE_H - 60, size: 10, font: this.fontBold,
      color: this.accent,
    });

    // Title (large)
    const titleLines = this.wrapText(sanitize(opts.title), 28, CONTENT_W);
    let ty = PAGE_H - 120;
    for (const line of titleLines) {
      p.drawText(line, { x: MARGIN, y: ty, size: 28, font: this.fontBold, color: WHITE });
      ty -= 36;
    }

    // Subtitle
    if (opts.subtitle) {
      ty -= 8;
      p.drawText(sanitize(opts.subtitle), { x: MARGIN, y: ty, size: 12, font: this.font, color: MUTED });
      ty -= 20;
    }

    // Accent divider line
    p.drawRectangle({ x: MARGIN, y: ty - 10, width: 60, height: 2, color: this.accent });
    ty -= 40;

    // Metadata block
    const metaItems: Array<{ label: string; value: string }> = [];
    if (opts.clientName) metaItems.push({ label: "CLIENTE", value: opts.clientName });
    metaItems.push({ label: "DATA DE EMISSAO", value: opts.date });
    metaItems.push({ label: "CODIGO", value: opts.refCode });
    metaItems.push({ label: "PLATAFORMA", value: this.moduleName });

    for (const m of metaItems) {
      p.drawText(sanitize(m.label), { x: MARGIN, y: ty, size: 7, font: this.fontBold, color: DIM });
      p.drawText(sanitize(m.value), { x: MARGIN + 130, y: ty, size: 9, font: this.font, color: OFF_WHITE });
      ty -= 18;
    }

    // Bottom branding
    p.drawRectangle({ x: MARGIN, y: 50, width: CONTENT_W, height: 0.5, color: BORDER });
    p.drawText("HUB v2.4", { x: MARGIN, y: 32, size: 8, font: this.fontBold, color: MUTED });
    p.drawText("powered by SQUAD", {
      x: PAGE_W - MARGIN - this.font.widthOfTextAtSize("powered by SQUAD", 7),
      y: 32, size: 7, font: this.font, color: DIM,
    });
  }

  // ── Content helpers ─────────────────────────────────────
  ensureSpace(needed: number) {
    if (this.y < MARGIN + 40 + needed) this.newPage();
  }

  wrapText(text: string, fontSize: number, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (this.font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  text(str: string, opts: { x?: number; size?: number; color?: any; bold?: boolean; maxWidth?: number } = {}) {
    const { x = MARGIN, size = 10, color = OFF_WHITE, bold = false, maxWidth = CONTENT_W } = opts;
    const font = bold ? this.fontBold : this.font;
    const clean = sanitize(str);
    if (!clean) return;

    const lines = this.wrapText(clean, size, maxWidth);
    const lineHeight = size * 1.5;
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.page.drawText(line, { x, y: this.y, size, font, color });
      this.y -= lineHeight;
    }
  }

  // Numbered section header: "01 — TITULO"
  sectionHeader(title: string) {
    this.sectionCounter++;
    const num = String(this.sectionCounter).padStart(2, "0");
    const label = `${num} — ${title.toUpperCase()}`;

    this.ensureSpace(40);
    this.y -= 16;

    // Accent bar
    this.page.drawRectangle({ x: MARGIN, y: this.y - 1, width: 3, height: 16, color: this.accent });

    // Section number + title
    this.page.drawText(sanitize(label), {
      x: MARGIN + 12, y: this.y, size: 10, font: this.fontBold, color: this.accent,
    });
    this.y -= 8;

    // Subtle line
    this.page.drawRectangle({ x: MARGIN, y: this.y - 4, width: CONTENT_W, height: 0.5, color: BORDER });
    this.y -= 16;
  }

  // KPI row with elevated cards
  kpiRow(kpis: { label: string; value: string; color?: any }[]) {
    const count = kpis.length;
    const gap = 6;
    const cardW = (CONTENT_W - gap * (count - 1)) / count;
    const cardH = 64;
    this.ensureSpace(cardH + 16);

    kpis.forEach((kpi, i) => {
      const x = MARGIN + i * (cardW + gap);

      // Card background
      this.page.drawRectangle({ x, y: this.y - cardH, width: cardW, height: cardH, color: SURFACE });
      // Top accent line on card
      this.page.drawRectangle({ x, y: this.y, width: cardW, height: 1.5, color: kpi.color || this.accent });

      // Label
      this.page.drawText(sanitize(kpi.label.toUpperCase()), {
        x: x + 12, y: this.y - 18, size: 7, font: this.fontBold, color: DIM,
      });
      // Value
      this.page.drawText(sanitize(kpi.value), {
        x: x + 12, y: this.y - 44, size: 20, font: this.fontBold, color: kpi.color || WHITE,
      });
    });
    this.y -= cardH + 16;
  }

  // Table with header and rows
  tableRow(cols: { text: string; width: number; color?: any; bold?: boolean }[], isHeader = false) {
    const rowH = isHeader ? 22 : 20;
    this.ensureSpace(rowH + 4);

    if (isHeader) {
      this.page.drawRectangle({ x: MARGIN, y: this.y - rowH, width: CONTENT_W, height: rowH, color: SURFACE });
    }

    let xOff = MARGIN + 10;
    cols.forEach(col => {
      const font = col.bold || isHeader ? this.fontBold : this.font;
      const size = isHeader ? 7 : 9;
      const color = col.color || (isHeader ? DIM : OFF_WHITE);
      const t = sanitize(col.text).substring(0, 55);
      this.page.drawText(t, { x: xOff, y: this.y - (isHeader ? 14 : 14), size, font, color });
      xOff += col.width;
    });

    this.page.drawLine({
      start: { x: MARGIN, y: this.y - rowH },
      end: { x: MARGIN + CONTENT_W, y: this.y - rowH },
      thickness: 0.5, color: BORDER,
    });
    this.y -= rowH;
  }

  // Summary stat block (4-column)
  summaryBlock(items: { label: string; value: string; color?: any }[]) {
    const count = items.length;
    const w = CONTENT_W / count;
    const h = 52;
    this.ensureSpace(h + 10);

    items.forEach((item, i) => {
      const x = MARGIN + i * w;
      this.page.drawRectangle({ x, y: this.y - h, width: w - 3, height: h, color: SURFACE });
      this.page.drawText(sanitize(item.value), {
        x: x + 10, y: this.y - 24, size: 22, font: this.fontBold, color: item.color || WHITE,
      });
      this.page.drawText(sanitize(item.label.toUpperCase()), {
        x: x + 10, y: this.y - 42, size: 7, font: this.font, color: DIM,
      });
    });
    this.y -= h + 12;
  }

  // Alert banner
  alertBanner(title: string, message: string, color: any = ERROR) {
    this.ensureSpace(44);
    this.y -= 6;
    this.page.drawRectangle({ x: MARGIN, y: this.y - 40, width: CONTENT_W, height: 40, color: SURFACE });
    this.page.drawRectangle({ x: MARGIN, y: this.y - 40, width: 3, height: 40, color });
    this.page.drawText(sanitize(title), { x: MARGIN + 14, y: this.y - 16, size: 10, font: this.fontBold, color });
    this.page.drawText(sanitize(message), { x: MARGIN + 14, y: this.y - 32, size: 8, font: this.font, color: MUTED });
    this.y -= 50;
  }

  // Add footer to all pages with page numbers
  addFooters(refCode: string) {
    const pages = this.doc.getPages();
    const total = pages.length;
    // Skip cover page (index 0)
    pages.forEach((p, idx) => {
      const y = 28;
      p.drawLine({ start: { x: MARGIN, y: y + 14 }, end: { x: PAGE_W - MARGIN, y: y + 14 }, thickness: 0.5, color: BORDER });

      p.drawText("HUB v2.4", { x: MARGIN, y, size: 7, font: this.fontBold, color: MUTED });

      const dateStr = formatDateShort();
      p.drawText(sanitize(dateStr), { x: MARGIN + 60, y, size: 7, font: this.font, color: DIM });

      const refStr = sanitize(refCode);
      const pageStr = idx === 0 ? "" : `Pagina ${idx} de ${total - 1}`;

      if (pageStr) {
        const pw = this.font.widthOfTextAtSize(pageStr, 7);
        p.drawText(pageStr, { x: PAGE_W / 2 - pw / 2, y, size: 7, font: this.font, color: DIM });
      }

      const rw = this.font.widthOfTextAtSize(refStr, 7);
      p.drawText(refStr, { x: PAGE_W - MARGIN - rw, y, size: 7, font: this.fontBold, color: this.accent });
    });
  }

  async save(): Promise<Uint8Array> {
    return await this.doc.save();
  }
}

// ─── PDF Builders ─────────────────────────────────────────

async function buildProjectPdf(supabase: any, projectId: string): Promise<{ bytes: Uint8Array; slug: string; refCode: string }> {
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (error || !project) throw new Error(`Projeto nao encontrado: ${error?.message || "ID invalido"}`);

  const [{ data: milestones }, { data: stages }, { data: deliverables }] = await Promise.all([
    supabase.from("payment_milestones").select("*").eq("project_id", projectId).order("due_date"),
    supabase.from("project_stages").select("*").eq("project_id", projectId).order("created_at"),
    supabase.from("project_deliverables").select("*").eq("project_id", projectId).order("created_at"),
  ]);

  const refCode = generateRefCode();
  const b = new PdfBuilder();
  await b.init("produtora");

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
    title: project.name || "Relatorio do Projeto",
    subtitle: `Relatorio completo de acompanhamento do projeto`,
    clientName: project.client_name || undefined,
    date: formatDateShort(),
    refCode,
  });

  // Content pages
  b.newPage();
  b.sectionHeader("Visao Geral");
  b.kpiRow([
    { label: "Valor do Contrato", value: formatCurrency(contractValue) },
    { label: "Saude", value: `${healthScore}%`, color: healthScore >= 80 ? SUCCESS : healthScore >= 50 ? WARNING : ERROR },
    { label: "Progresso", value: `${progressPercent}%`, color: b.accent },
    { label: "Pagamento", value: `${paymentPercent}%` },
  ]);

  // Stages
  if (stageList.length > 0) {
    b.sectionHeader("Cronograma de Etapas");
    const colW = [180, 100, 110, 109];
    b.tableRow([
      { text: "ETAPA", width: colW[0] },
      { text: "STATUS", width: colW[1] },
      { text: "INICIO", width: colW[2] },
      { text: "FIM PREVISTO", width: colW[3] },
    ], true);
    for (const s of stageList) {
      const sl = s.status === "concluido" ? "Concluido" : s.status === "em_andamento" ? "Em Andamento" : "Pendente";
      const sc = s.status === "concluido" ? SUCCESS : s.status === "em_andamento" ? b.accent : MUTED;
      b.tableRow([
        { text: s.name || "", width: colW[0], bold: true },
        { text: sl, width: colW[1], color: sc },
        { text: formatDate(s.start_date), width: colW[2], color: MUTED },
        { text: formatDate(s.end_date), width: colW[3], color: MUTED },
      ]);
    }
  }

  // Deliverables
  if (delivList.length > 0) {
    b.sectionHeader("Entregas");
    const colW = [190, 80, 100, 129];
    b.tableRow([
      { text: "ENTREGA", width: colW[0] },
      { text: "TIPO", width: colW[1] },
      { text: "STATUS", width: colW[2] },
      { text: "VERSAO", width: colW[3] },
    ], true);
    for (const d of delivList.slice(0, 20)) {
      const sc = d.status === "aprovado" || d.status === "entregue" ? SUCCESS : d.status === "revisao" ? WARNING : MUTED;
      b.tableRow([
        { text: d.title || "", width: colW[0] },
        { text: (d.type || "outro").toUpperCase(), width: colW[1], color: MUTED },
        { text: d.status || "rascunho", width: colW[2], color: sc },
        { text: `v${d.version || 1}`, width: colW[3] },
      ]);
    }
  }

  // Milestones
  if (mileList.length > 0) {
    b.sectionHeader("Condicoes Financeiras");
    const colW = [170, 120, 120, 89];
    b.tableRow([
      { text: "PARCELA", width: colW[0] },
      { text: "VALOR", width: colW[1] },
      { text: "VENCIMENTO", width: colW[2] },
      { text: "STATUS", width: colW[3] },
    ], true);
    for (const m of mileList) {
      const sc = m.status === "paid" ? SUCCESS : m.status === "overdue" ? ERROR : MUTED;
      const sl = m.status === "paid" ? "Pago" : m.status === "overdue" ? "Vencido" : "Pendente";
      b.tableRow([
        { text: m.description || "Parcela", width: colW[0] },
        { text: formatCurrency(Number(m.amount) || 0), width: colW[1], bold: true },
        { text: formatDate(m.due_date), width: colW[2], color: MUTED },
        { text: sl, width: colW[3], color: sc },
      ]);
    }
  }

  b.addFooters(refCode);
  return { bytes: await b.save(), slug: slugify(project.name || "projeto"), refCode };
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

  const refCode = generateRefCode();
  const b = new PdfBuilder();
  await b.init("produtora");

  b.coverPage({
    title: "Relatorio 360",
    subtitle: `Periodo: ${label} — Visao consolidada da operacao`,
    date: formatDateShort(),
    refCode,
  });

  b.newPage();
  b.sectionHeader("Indicadores Principais");
  b.kpiRow([
    { label: "Entregues", value: `${completed}`, color: SUCCESS },
    { label: "Abertos", value: `${active}` },
    { label: "Atrasados", value: `${delayed}`, color: delayed > 0 ? ERROR : WHITE },
    { label: "Saude Media", value: `${avgHealth}%`, color: avgHealth >= 80 ? SUCCESS : WARNING },
  ]);

  b.sectionHeader("Resumo do Periodo");
  b.summaryBlock([
    { label: "Total Projetos", value: `${total}` },
    { label: "Finalizados", value: `${completed}`, color: SUCCESS },
    { label: "Em Andamento", value: `${active}`, color: b.accent },
    { label: "Investimento Total", value: formatCurrency(totalValue) },
  ]);

  if (list.length > 0) {
    b.sectionHeader("Projetos no Periodo");
    const colW = [190, 100, 100, 109];
    b.tableRow([
      { text: "PROJETO", width: colW[0] },
      { text: "STATUS", width: colW[1] },
      { text: "SAUDE", width: colW[2] },
      { text: "DEADLINE", width: colW[3] },
    ], true);
    for (const p of list.slice(0, 25)) {
      const sc = p.status === "active" ? SUCCESS : p.status === "delayed" || p.status === "atrasado" ? ERROR : MUTED;
      const sl = p.status === "active" ? "Ativo" : p.status === "delayed" || p.status === "atrasado" ? "Atrasado" : p.status === "completed" || p.status === "delivered" ? "Entregue" : p.status || "Briefing";
      const hs = p.health_score || 100;
      b.tableRow([
        { text: p.name || "", width: colW[0], bold: true },
        { text: sl, width: colW[1], color: sc },
        { text: `${hs}%`, width: colW[2], color: hs >= 80 ? SUCCESS : hs >= 50 ? WARNING : ERROR },
        { text: formatDate(p.due_date), width: colW[3], color: MUTED },
      ]);
    }
  }

  b.addFooters(refCode);
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

  const refCode = generateRefCode();
  const b = new PdfBuilder();
  await b.init("produtora");

  b.coverPage({
    title: "Quadro de Tarefas",
    subtitle: `${totalTasks} tarefas registradas — Visao operacional`,
    date: formatDateShort(),
    refCode,
  });

  b.newPage();
  b.sectionHeader("Indicadores de Tarefas");
  b.kpiRow([
    { label: "Total", value: `${totalTasks}` },
    { label: "Pendentes", value: `${pendingTasks}`, color: b.accent },
    { label: "Concluidas", value: `${doneTasks}`, color: SUCCESS },
    { label: "Vencidas", value: `${overdueTasks}`, color: overdueTasks > 0 ? ERROR : WHITE },
  ]);

  // Status distribution
  const statusGroups = {
    briefing: { label: "Briefing", items: list.filter((t: any) => t.status === "todo" || t.status === "briefing" || t.status === "backlog") },
    execution: { label: "Em Execucao", items: list.filter((t: any) => t.status === "in_progress" || t.status === "execution" || t.status === "today" || t.status === "week") },
    review: { label: "Revisao", items: list.filter((t: any) => t.status === "review") },
    done: { label: "Concluido", items: list.filter((t: any) => t.status === "done" || t.status === "delivered") },
  };

  b.sectionHeader("Distribuicao por Status");
  b.summaryBlock(Object.values(statusGroups).map(g => ({
    label: g.label, value: `${g.items.length}`, color: b.accent,
  })));

  // Tasks table
  b.sectionHeader("Lista de Tarefas");
  const colW = [190, 120, 80, 109];
  b.tableRow([
    { text: "TAREFA", width: colW[0] },
    { text: "PROJETO", width: colW[1] },
    { text: "STATUS", width: colW[2] },
    { text: "PRAZO", width: colW[3] },
  ], true);

  for (const t of list.slice(0, 50)) {
    const statusLabel = t.status === "done" || t.status === "delivered" ? "Concluido"
      : t.status === "in_progress" || t.status === "execution" ? "Execucao"
      : t.status === "review" ? "Revisao" : "Pendente";
    const sc = t.status === "done" || t.status === "delivered" ? SUCCESS
      : t.status === "in_progress" || t.status === "execution" ? b.accent : MUTED;
    const isOverdue = t.due_date && t.due_date < today && t.status !== "done" && t.status !== "delivered";
    b.tableRow([
      { text: t.title || "Tarefa", width: colW[0], bold: true },
      { text: t.project?.name || "", width: colW[1], color: MUTED },
      { text: statusLabel, width: colW[2], color: sc },
      { text: formatDate(t.due_date), width: colW[3], color: isOverdue ? ERROR : MUTED },
    ]);
  }

  if (overdueTasks > 0) {
    b.alertBanner("ALERTA DE VENCIMENTO", `${overdueTasks} tarefa(s) vencida(s) requerem atencao imediata`);
  }

  b.addFooters(refCode);
  return { bytes: await b.save(), slug: "quadro-de-tarefas", refCode };
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

  const days30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const proj30 = balance
    + revList.filter((r: any) => r.status === "pending" && r.due_date <= days30).reduce((s: number, r: any) => s + Number(r.amount), 0)
    - expList.filter((e: any) => e.status === "pending" && e.due_date <= days30).reduce((s: number, e: any) => s + Number(e.amount), 0);

  const refCode = generateRefCode();
  const b = new PdfBuilder();
  await b.init("finance");

  b.coverPage({
    title: "Relatorio Financeiro",
    subtitle: `${label} — Panorama financeiro completo`,
    date: formatDateShort(),
    refCode,
  });

  b.newPage();
  b.sectionHeader("Indicadores Financeiros");
  b.kpiRow([
    { label: "Saldo em Caixa", value: formatCurrency(balance), color: SUCCESS },
    { label: "Receita Pendente", value: formatCurrency(pending), color: b.accent },
    { label: "Despesas Pagas", value: formatCurrency(paidExp), color: ERROR },
    { label: "Margem Liquida", value: `${marginPct}%`, color: WARNING },
  ]);

  // 30-day projection
  b.sectionHeader("Projecao 30 Dias");
  b.ensureSpace(56);
  b.page.drawRectangle({ x: MARGIN, y: b.y - 50, width: CONTENT_W, height: 50, color: SURFACE });
  b.page.drawRectangle({ x: MARGIN, y: b.y - 50, width: 3, height: 50, color: b.accent });
  b.page.drawText("Saldo Estimado em 30 dias", { x: MARGIN + 14, y: b.y - 18, size: 9, font: b.font, color: MUTED });
  b.page.drawText(sanitize(formatCurrency(proj30)), { x: MARGIN + 14, y: b.y - 40, size: 20, font: b.fontBold, color: b.accent });
  const projLabel = proj30 >= balance ? "PREVISAO POSITIVA" : "ATENCAO";
  const projColor = proj30 >= balance ? SUCCESS : ERROR;
  b.page.drawText(sanitize(projLabel), {
    x: PAGE_W - MARGIN - 14 - b.font.widthOfTextAtSize(projLabel, 10),
    y: b.y - 32, size: 10, font: b.fontBold, color: projColor,
  });
  b.y -= 62;

  // Aging
  b.sectionHeader("Aging de Recebiveis");
  const agingGroups = [
    { range: "A vencer", items: revList.filter((r: any) => (r.status === "pending" || r.status === "overdue") && r.due_date >= today), color: SUCCESS },
    { range: "1-7 dias vencido", items: revList.filter((r: any) => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d >= 1 && d <= 7; }), color: WARNING },
    { range: "8-30 dias vencido", items: revList.filter((r: any) => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d >= 8 && d <= 30; }), color: rgb(0.976, 0.451, 0.086) },
    { range: "+30 dias vencido", items: revList.filter((r: any) => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d > 30; }), color: ERROR },
  ];

  for (const ag of agingGroups) {
    b.ensureSpace(24);
    const val = ag.items.reduce((s: number, r: any) => s + Number(r.amount), 0);
    b.page.drawRectangle({ x: MARGIN, y: b.y - 22, width: CONTENT_W, height: 22, color: SURFACE });
    b.page.drawText(sanitize(ag.range), { x: MARGIN + 12, y: b.y - 15, size: 9, font: b.fontBold, color: ag.color });
    b.page.drawText(`${ag.items.length} itens`, { x: MARGIN + 200, y: b.y - 15, size: 8, font: b.font, color: MUTED });
    const valText = sanitize(formatCurrency(val));
    b.page.drawText(valText, {
      x: PAGE_W - MARGIN - 12 - b.font.widthOfTextAtSize(valText, 9),
      y: b.y - 15, size: 9, font: b.fontBold, color: WHITE,
    });
    b.y -= 26;
  }

  // Recent payments
  b.sectionHeader("Pagamentos Recentes");
  const recent = revList.filter((r: any) => r.status === "received" && r.received_date)
    .sort((a: any, b: any) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime())
    .slice(0, 10);

  if (recent.length > 0) {
    const colW = [220, 120, 159];
    b.tableRow([
      { text: "DESCRICAO", width: colW[0] },
      { text: "DATA", width: colW[1] },
      { text: "VALOR", width: colW[2] },
    ], true);
    for (const p of recent) {
      b.tableRow([
        { text: (p.description || "").substring(0, 40), width: colW[0] },
        { text: formatDate(p.received_date), width: colW[1], color: MUTED },
        { text: `+${formatCurrency(Number(p.amount))}`, width: colW[2], color: SUCCESS, bold: true },
      ]);
    }
  } else {
    b.text("Nenhum pagamento recebido recentemente", { color: MUTED });
  }

  if (overdueAmt > 0) {
    const overdueCount = revList.filter((r: any) => r.status !== "received" && r.due_date < today).length;
    b.alertBanner("ALERTA DE INADIMPLENCIA", `${overdueCount} receita(s) vencida(s) totalizando ${formatCurrency(overdueAmt)}`);
  }

  b.addFooters(refCode);
  return { bytes: await b.save(), slug: `financeiro-${period}`, refCode };
}

// ─── Main Handler ─────────────────────────────────────────

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
      contentType: "application/pdf",
      upsert: true,
    });
    if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from("exports").createSignedUrl(storagePath, 1800);
    const url = signedUrlError
      ? supabase.storage.from("exports").getPublicUrl(storagePath).data.publicUrl
      : signedUrlData.signedUrl;

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
