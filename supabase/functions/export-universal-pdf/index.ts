import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Design System Colors (SQUAD Film - Dark Theme)
const COLORS = {
  background: "#050505",
  surface: "#0a0a0a",
  border: "#1a1a1a",
  primary: "#06b6d4", // cyan-500
  text: "#FFFFFF",
  textMuted: "#6b7280", // gray-500
  textDim: "#9ca3af", // gray-400
  success: "#10b981", // emerald-500
  warning: "#f59e0b", // amber-500
  error: "#ef4444", // red-500
};

// PDF dimensions (A4)
const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 40,
  contentWidth: 515.28,
};

interface ExportInput {
  type: "report_360" | "tasks" | "project" | "project_overview" | "portal";
  id?: string;
  period?: string;
  token?: string;
  filters?: Record<string, unknown>;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getPeriodDates(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case "1m": start.setMonth(start.getMonth() - 1); break;
    case "3m": start.setMonth(start.getMonth() - 3); break;
    case "6m": start.setMonth(start.getMonth() - 6); break;
    case "1y": start.setFullYear(start.getFullYear() - 1); break;
    default: start.setMonth(start.getMonth() - 3);
  }
  
  return { start, end };
}

// Stage name mapping
const STAGE_NAMES: Record<string, string> = {
  briefing: 'Briefing',
  roteiro: 'Roteiro',
  pre_producao: 'Pré-Produção',
  captacao: 'Captação',
  edicao: 'Edição',
  revisao: 'Revisão',
  aprovacao: 'Aprovação',
  entrega: 'Entrega',
  pos_venda: 'Pós-Venda',
};

/**
 * Premium Portal PDF Generator
 * Matches the exact visual layout of the client portal
 */
class PremiumPortalPDFGenerator {
  private pages: string[][] = [[]];
  private currentPageIndex = 0;
  private currentY = PAGE.margin;
  private projectName = "";

  private escapeXml(str: string): string {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private get content() {
    return this.pages[this.currentPageIndex];
  }

  private checkPageBreak(requiredHeight: number) {
    if (this.currentY + requiredHeight > PAGE.height - 50) {
      this.newPage();
    }
  }

  private newPage() {
    this.currentPageIndex++;
    this.pages[this.currentPageIndex] = [];
    this.currentY = PAGE.margin;
  }

  // ==========================================
  // HEADER SECTION - Badges Row
  // ==========================================
  addHeaderBadges(status: string, template: string, stage: string, isBlocked: boolean) {
    let badgeX = PAGE.margin;
    
    // Status badge (active/paused)
    const statusLabel = status === 'active' ? 'ATIVO' : status === 'paused' ? 'PAUSADO' : status.toUpperCase();
    this.content.push(`
      <rect fill="${COLORS.primary}22" x="${badgeX}" y="${this.currentY}" width="55" height="18" rx="0"/>
      <rect fill="none" stroke="${COLORS.primary}44" stroke-width="0.5" x="${badgeX}" y="${this.currentY}" width="55" height="18" rx="0"/>
      <text fill="${COLORS.primary}" x="${badgeX + 27}" y="${this.currentY + 12}" 
        font-family="Inter, sans-serif" font-size="7" text-anchor="middle" font-weight="600" letter-spacing="0.8">
        ${statusLabel}
      </text>
    `);
    badgeX += 62;

    // Template badge
    const templateLabel = template ? template.replace(/_/g, ' ').toUpperCase() : 'PROJETO';
    this.content.push(`
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${badgeX}" y="${this.currentY}" width="100" height="18" rx="0"/>
      <text fill="${COLORS.textMuted}" x="${badgeX + 50}" y="${this.currentY + 12}" 
        font-family="Inter, sans-serif" font-size="7" text-anchor="middle" letter-spacing="0.5">
        ${this.escapeXml(templateLabel.substring(0, 18))}
      </text>
    `);
    badgeX += 107;

    // Stage badge
    const stageLabel = stage ? stage.toUpperCase() : 'EM ANDAMENTO';
    this.content.push(`
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${badgeX}" y="${this.currentY}" width="85" height="18" rx="0"/>
      <text fill="${COLORS.textMuted}" x="${badgeX + 42}" y="${this.currentY + 12}" 
        font-family="Inter, sans-serif" font-size="7" text-anchor="middle" letter-spacing="0.5">
        ${this.escapeXml(stageLabel.substring(0, 15))}
      </text>
    `);
    badgeX += 92;

    // Blocked badge
    if (isBlocked) {
      this.content.push(`
        <rect fill="${COLORS.error}22" x="${badgeX}" y="${this.currentY}" width="72" height="18" rx="0"/>
        <rect fill="none" stroke="${COLORS.error}44" stroke-width="0.5" x="${badgeX}" y="${this.currentY}" width="72" height="18" rx="0"/>
        <text fill="${COLORS.error}" x="${badgeX + 36}" y="${this.currentY + 12}" 
          font-family="Inter, sans-serif" font-size="7" text-anchor="middle" font-weight="600" letter-spacing="0.8">
          BLOQUEADO
        </text>
      `);
    }

    this.currentY += 32;
  }

  // ==========================================
  // PROJECT TITLE & CLIENT
  // ==========================================
  addProjectTitle(projectName: string, clientName: string) {
    this.projectName = projectName;
    
    // Project Title - Playfair Display style
    this.content.push(`
      <text fill="${COLORS.text}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="Playfair Display, Georgia, serif" font-size="28" font-weight="400">
        ${this.escapeXml(projectName)}
      </text>
    `);
    this.currentY += 24;

    // Client & ID
    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="Inter, sans-serif" font-size="10">
        Cliente: <tspan fill="${COLORS.textDim}" font-weight="500">${this.escapeXml(clientName.toUpperCase())}</tspan>
      </text>
    `);
    this.currentY += 25;
  }

  // ==========================================
  // BLOCK ALERT BANNER
  // ==========================================
  addBlockAlert() {
    const alertHeight = 48;
    
    this.content.push(`
      <rect fill="${COLORS.error}15" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${alertHeight}" rx="0"/>
      <rect fill="none" stroke="${COLORS.error}33" stroke-width="0.5" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${alertHeight}" rx="0"/>
    `);

    // Alert icon (triangle)
    const iconX = PAGE.margin + 15;
    const iconY = this.currentY + 16;
    this.content.push(`
      <path fill="${COLORS.error}" d="M${iconX},${iconY + 12} L${iconX + 6},${iconY} L${iconX + 12},${iconY + 12} Z"/>
      <text fill="${COLORS.error}" x="${iconX + 6}" y="${iconY + 10}" 
        font-family="Inter, sans-serif" font-size="8" text-anchor="middle" font-weight="bold">!</text>
    `);

    // Alert text
    this.content.push(`
      <text fill="${COLORS.error}" x="${PAGE.margin + 35}" y="${this.currentY + 18}" 
        font-family="Inter, sans-serif" font-size="10" font-weight="600">
        Projeto Bloqueado por Inadimplência
      </text>
      <text fill="${COLORS.error}cc" x="${PAGE.margin + 35}" y="${this.currentY + 33}" 
        font-family="Inter, sans-serif" font-size="8">
        Existe uma fatura em atraso. A entrega final e acesso a novos materiais estão suspensos.
      </text>
    `);

    this.currentY += alertHeight + 18;
  }

  // ==========================================
  // METRICS GRID (4 columns)
  // ==========================================
  addMetricsGrid(metrics: { label: string; value: string; sublabel?: string; color?: string }[]) {
    this.checkPageBreak(70);
    
    const metricWidth = PAGE.contentWidth / metrics.length;
    const metricHeight = 60;

    metrics.forEach((metric, i) => {
      const x = PAGE.margin + (i * metricWidth);
      const innerWidth = metricWidth - 1;
      
      // Card background
      this.content.push(`
        <rect fill="${COLORS.surface}" x="${x}" y="${this.currentY}" 
          width="${innerWidth}" height="${metricHeight}" rx="0"/>
        <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${x}" y="${this.currentY}" 
          width="${innerWidth}" height="${metricHeight}" rx="0"/>
      `);

      // Label
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${x + 12}" y="${this.currentY + 18}" 
          font-family="Inter, sans-serif" font-size="7" letter-spacing="0.8" font-weight="500">
          ${this.escapeXml(metric.label.toUpperCase())}
        </text>
      `);

      // Value
      this.content.push(`
        <text fill="${metric.color || COLORS.text}" x="${x + 12}" y="${this.currentY + 40}" 
          font-family="Inter, sans-serif" font-size="16" font-weight="600">
          ${this.escapeXml(metric.value)}
        </text>
      `);

      // Sublabel
      if (metric.sublabel) {
        this.content.push(`
          <text fill="${COLORS.textMuted}" x="${x + 12}" y="${this.currentY + 54}" 
            font-family="Inter, sans-serif" font-size="8">
            ${this.escapeXml(metric.sublabel)}
          </text>
        `);
      }
    });

    this.currentY += metricHeight + 22;
  }

  // ==========================================
  // SECTION HEADER (01 — TITLE style)
  // ==========================================
  addSectionHeader(index: string, title: string) {
    this.checkPageBreak(40);
    
    this.content.push(`
      <text fill="${COLORS.primary}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="Inter, sans-serif" font-size="8" font-weight="700" letter-spacing="1.2">
        ${index} — ${this.escapeXml(title.toUpperCase())}
      </text>
    `);
    this.currentY += 20;
  }

  // ==========================================
  // EXECUTIVE SUMMARY (Editorial style)
  // ==========================================
  addExecutiveSummary(headline: string, paragraphs: string[]) {
    this.checkPageBreak(100);
    
    // Section card background
    const estimatedHeight = 50 + (paragraphs.length * 50);
    this.content.push(`
      <rect fill="${COLORS.surface}" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${estimatedHeight}" rx="0"/>
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${estimatedHeight}" rx="0"/>
    `);

    const innerX = PAGE.margin + 20;
    const innerWidth = PAGE.contentWidth - 40;
    let localY = this.currentY + 28;

    // Headline - Playfair Display italic
    if (headline) {
      this.content.push(`
        <text fill="${COLORS.text}" x="${innerX}" y="${localY}" 
          font-family="Playfair Display, Georgia, serif" font-size="18" font-style="italic">
          ${this.escapeXml(headline.substring(0, 60))}
        </text>
      `);
      localY += 28;
    }

    // Paragraphs
    paragraphs.forEach(paragraph => {
      const words = paragraph.split(' ');
      let line = '';
      const maxChars = 85;
      
      words.forEach(word => {
        if ((line + word).length > maxChars) {
          this.content.push(`
            <text fill="${COLORS.textDim}" x="${innerX}" y="${localY}" 
              font-family="Inter, sans-serif" font-size="10" font-weight="300">
              ${this.escapeXml(line.trim())}
            </text>
          `);
          localY += 16;
          line = word + ' ';
        } else {
          line += word + ' ';
        }
      });
      
      if (line.trim()) {
        this.content.push(`
          <text fill="${COLORS.textDim}" x="${innerX}" y="${localY}" 
            font-family="Inter, sans-serif" font-size="10" font-weight="300">
            ${this.escapeXml(line.trim())}
          </text>
        `);
        localY += 22;
      }
    });

    this.currentY += estimatedHeight + 18;
  }

  // ==========================================
  // SCOPE DETAIL SECTION
  // ==========================================
  addScopeSection(scopeText: string, deliveryFormats: string) {
    this.checkPageBreak(140);
    
    const cardHeight = 100;
    
    // Card background
    this.content.push(`
      <rect fill="${COLORS.surface}" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${cardHeight}" rx="0"/>
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${cardHeight}" rx="0"/>
    `);

    // Quote border accent
    this.content.push(`
      <rect fill="${COLORS.primary}" x="${PAGE.margin}" y="${this.currentY}" width="3" height="${cardHeight}"/>
    `);

    const innerX = PAGE.margin + 20;
    let localY = this.currentY + 22;

    // Scope text with word wrap
    const scopeWords = scopeText.split(' ');
    let line = '';
    const maxChars = 80;
    
    scopeWords.slice(0, 50).forEach(word => {
      if ((line + word).length > maxChars) {
        this.content.push(`
          <text fill="${COLORS.textMuted}" x="${innerX}" y="${localY}" 
            font-family="Inter, sans-serif" font-size="9" font-style="italic">
            ${this.escapeXml(line.trim())}
          </text>
        `);
        localY += 14;
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    });
    
    if (line.trim()) {
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${innerX}" y="${localY}" 
          font-family="Inter, sans-serif" font-size="9" font-style="italic">
          ${this.escapeXml(line.trim())}
        </text>
      `);
    }

    // Delivery formats
    localY = this.currentY + cardHeight - 20;
    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${innerX}" y="${localY}" 
        font-family="Inter, sans-serif" font-size="8">
        Formatos de Entrega: <tspan fill="${COLORS.text}">${this.escapeXml(deliveryFormats)}</tspan>
      </text>
    `);

    this.currentY += cardHeight + 18;
  }

  // ==========================================
  // DELIVERABLES LIST (Premium indexed style)
  // ==========================================
  addDeliverablesList(deliverables: { index: number; title: string; description: string; status: string }[]) {
    deliverables.forEach((item, i) => {
      this.checkPageBreak(50);
      
      const itemHeight = 40;
      const indexPad = (item.index < 10) ? '0' : '';
      
      // Item background
      this.content.push(`
        <rect fill="${COLORS.surface}" x="${PAGE.margin}" y="${this.currentY}" 
          width="${PAGE.contentWidth}" height="${itemHeight}" rx="0"/>
        <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${PAGE.margin}" y="${this.currentY}" 
          width="${PAGE.contentWidth}" height="${itemHeight}" rx="0"/>
      `);

      // Index number
      this.content.push(`
        <text fill="${COLORS.primary}" x="${PAGE.margin + 15}" y="${this.currentY + 25}" 
          font-family="Inter, sans-serif" font-size="12" font-weight="300">
          ${indexPad}${item.index}
        </text>
      `);

      // Title
      this.content.push(`
        <text fill="${COLORS.text}" x="${PAGE.margin + 50}" y="${this.currentY + 18}" 
          font-family="Inter, sans-serif" font-size="10" font-weight="500">
          ${this.escapeXml(item.title.substring(0, 50))}
        </text>
      `);

      // Description
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${PAGE.margin + 50}" y="${this.currentY + 32}" 
          font-family="Inter, sans-serif" font-size="8">
          ${this.escapeXml(item.description.substring(0, 70))}
        </text>
      `);

      // Status badge
      const statusColor = item.status === 'completed' ? COLORS.success : 
                         item.status === 'in_progress' ? COLORS.primary : 
                         item.status === 'blocked' ? COLORS.error : COLORS.textMuted;
      const statusText = item.status === 'completed' ? 'CONCLUÍDO' : 
                        item.status === 'in_progress' ? 'EM ANDAMENTO' : 
                        item.status === 'blocked' ? 'BLOQUEADO' : 'NÃO INICIADO';
      
      const statusX = PAGE.margin + PAGE.contentWidth - 90;
      this.content.push(`
        <rect fill="${statusColor}22" x="${statusX}" y="${this.currentY + 12}" width="75" height="16" rx="0"/>
        <text fill="${statusColor}" x="${statusX + 37}" y="${this.currentY + 23}" 
          font-family="Inter, sans-serif" font-size="6" text-anchor="middle" font-weight="600" letter-spacing="0.5">
          ${statusText}
        </text>
      `);

      this.currentY += itemHeight + 4;
    });
  }

  // ==========================================
  // STAGES FLOW (Visual timeline)
  // ==========================================
  addStagesFlow(stages: { title: string; status: string }[]) {
    this.checkPageBreak(55);
    
    const maxStages = 5;
    const stageWidth = PAGE.contentWidth / Math.min(stages.length, maxStages);
    
    stages.slice(0, maxStages).forEach((stage, i) => {
      const x = PAGE.margin + (i * stageWidth);
      const statusColor = stage.status === 'completed' ? COLORS.success : 
                         stage.status === 'in_progress' ? COLORS.primary : COLORS.textMuted;

      // Stage box
      this.content.push(`
        <rect fill="${COLORS.surface}" x="${x}" y="${this.currentY}" 
          width="${stageWidth - 3}" height="38" rx="0"/>
        <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${x}" y="${this.currentY}" 
          width="${stageWidth - 3}" height="38" rx="0"/>
      `);

      // Status circle
      this.content.push(`
        <circle fill="${statusColor}" cx="${x + 12}" cy="${this.currentY + 14}" r="4"/>
      `);

      // Stage name
      this.content.push(`
        <text fill="${statusColor}" x="${x + 22}" y="${this.currentY + 17}" 
          font-family="Inter, sans-serif" font-size="7" font-weight="600" letter-spacing="0.3">
          ${this.escapeXml(stage.title.substring(0, 12).toUpperCase())}
        </text>
        <text fill="${COLORS.textMuted}" x="${x + 10}" y="${this.currentY + 30}" 
          font-family="Inter, sans-serif" font-size="6">
          ${stage.status === 'completed' ? 'Concluída' : stage.status === 'in_progress' ? 'Em andamento' : 'Aguardando'}
        </text>
      `);
    });

    this.currentY += 50;
  }

  // ==========================================
  // FINANCIAL CONDITIONS (Aside panel style)
  // ==========================================
  addFinancialConditions(pixKey: string, holder: string, bank: string) {
    this.checkPageBreak(90);
    
    const cardHeight = 75;
    
    // Card
    this.content.push(`
      <rect fill="${COLORS.surface}" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${cardHeight}" rx="0"/>
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${cardHeight}" rx="0"/>
    `);

    const innerX = PAGE.margin + 15;
    let localY = this.currentY + 22;

    // PIX Key
    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${innerX}" y="${localY}" 
        font-family="Inter, sans-serif" font-size="7" letter-spacing="0.5" font-weight="500">
        CHAVE PIX (E-MAIL)
      </text>
      <text fill="${COLORS.primary}" x="${innerX + 120}" y="${localY}" 
        font-family="Inter, sans-serif" font-size="9">
        ${this.escapeXml(pixKey || 'squadfilmeo@gmail.com')}
      </text>
    `);
    localY += 22;

    // Holder / Bank
    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${innerX}" y="${localY}" 
        font-family="Inter, sans-serif" font-size="7" letter-spacing="0.5" font-weight="500">
        TITULAR / BANCO
      </text>
      <text fill="${COLORS.text}" x="${innerX + 120}" y="${localY}" 
        font-family="Inter, sans-serif" font-size="9">
        ${this.escapeXml(holder || 'Matheus Filipe Alves')} • ${this.escapeXml(bank || 'Nubank')}
      </text>
    `);

    this.currentY += cardHeight + 18;
  }

  // ==========================================
  // CONFIGURATION SECTION
  // ==========================================
  addConfigSection(revisionLimit: number) {
    this.checkPageBreak(50);
    
    const cardHeight = 40;
    
    this.content.push(`
      <rect fill="${COLORS.surface}" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${cardHeight}" rx="0"/>
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${cardHeight}" rx="0"/>
    `);

    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${PAGE.margin + 15}" y="${this.currentY + 16}" 
        font-family="Inter, sans-serif" font-size="7" letter-spacing="0.5" font-weight="500">
        LIMITE DE REVISÕES
      </text>
      <text fill="${COLORS.text}" x="${PAGE.margin + 15}" y="${this.currentY + 32}" 
        font-family="Inter, sans-serif" font-size="12">
        ${revisionLimit} <tspan fill="${COLORS.textMuted}" font-size="9">por material</tspan>
      </text>
    `);

    this.currentY += cardHeight + 18;
  }

  // ==========================================
  // FOOTER
  // ==========================================
  private addFooter(pageNum: number, totalPages: number) {
    return `
      <line x1="${PAGE.margin}" y1="${PAGE.height - 40}" x2="${PAGE.width - PAGE.margin}" y2="${PAGE.height - 40}" 
        stroke="${COLORS.border}" stroke-width="0.5"/>
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${PAGE.height - 22}" 
        font-family="Inter, sans-serif" font-size="8" font-weight="500" letter-spacing="1">
        SQUAD /// FILM
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.width / 2}" y="${PAGE.height - 22}" 
        font-family="Inter, sans-serif" font-size="7" text-anchor="middle">
        ${this.escapeXml(this.projectName)}
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.width - PAGE.margin}" y="${PAGE.height - 22}" 
        font-family="Inter, sans-serif" font-size="7" text-anchor="end">
        Página ${pageNum} / ${totalPages}
      </text>
    `;
  }

  // ==========================================
  // GENERATE FINAL SVG
  // ==========================================
  generate(): string {
    const totalPages = this.pages.length;
    
    const svgPages = this.pages.map((pageContent, index) => {
      const pageNum = index + 1;
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE.width} ${PAGE.height}">
          <rect fill="${COLORS.background}" x="0" y="0" width="${PAGE.width}" height="${PAGE.height}"/>
          ${pageContent.join("")}
          ${this.addFooter(pageNum, totalPages)}
        </svg>
      `;
    });

    // For multi-page, wrap in a container
    if (totalPages === 1) {
      return `<?xml version="1.0" encoding="UTF-8"?>${svgPages[0]}`;
    }

    // Multi-page SVG container
    return `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE.width} ${PAGE.height * totalPages}">
        ${svgPages.map((svg, i) => `
          <g transform="translate(0, ${i * PAGE.height})">
            ${svg.replace(/<\/?svg[^>]*>/g, '')}
          </g>
        `).join('')}
      </svg>
    `;
  }
}

// Legacy generator for non-project types (keeping for compatibility)
class SimplePDFGenerator {
  private content: string[] = [];
  private currentY = PAGE.margin;
  private pageNumber = 1;
  private projectName = "";

  constructor() {
    this.content.push(`<rect fill="${COLORS.background}" x="0" y="0" width="${PAGE.width}" height="${PAGE.height}"/>`);
  }

  private escapeXml(str: string): string {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  addHeader(title: string, subtitle: string, type: string, template: string, stage: string, isBlocked: boolean) {
    // Simplified header for non-project types
    this.content.push(`
      <text fill="${COLORS.text}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="Playfair Display, Georgia, serif" font-size="24" font-weight="400">
        ${this.escapeXml(title)}
      </text>
    `);
    this.projectName = title;
    this.currentY += 22;
    
    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="Inter, sans-serif" font-size="10">
        ${this.escapeXml(subtitle)}
      </text>
    `);
    this.currentY += 30;
  }

  addMetricsGrid(metrics: { label: string; value: string; sublabel?: string; color?: string }[]) {
    const metricWidth = PAGE.contentWidth / metrics.length;
    const metricHeight = 55;

    metrics.forEach((metric, i) => {
      const x = PAGE.margin + (i * metricWidth);
      
      this.content.push(`
        <rect fill="${COLORS.surface}" x="${x}" y="${this.currentY}" 
          width="${metricWidth - 1}" height="${metricHeight}" rx="0"/>
        <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${x}" y="${this.currentY}" 
          width="${metricWidth - 1}" height="${metricHeight}" rx="0"/>
        <text fill="${COLORS.textMuted}" x="${x + 12}" y="${this.currentY + 18}" 
          font-family="Inter, sans-serif" font-size="7" letter-spacing="0.5">
          ${this.escapeXml(metric.label.toUpperCase())}
        </text>
        <text fill="${metric.color || COLORS.text}" x="${x + 12}" y="${this.currentY + 38}" 
          font-family="Inter, sans-serif" font-size="14" font-weight="600">
          ${this.escapeXml(metric.value)}
        </text>
      `);
    });

    this.currentY += metricHeight + 20;
  }

  addSection(title: string) {
    this.content.push(`
      <text fill="${COLORS.primary}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="Inter, sans-serif" font-size="8" font-weight="bold" letter-spacing="1.5">
        ${this.escapeXml(title.toUpperCase())}
      </text>
    `);
    this.currentY += 20;
  }

  addText(text: string, size = 10, color = COLORS.text) {
    const maxWidth = PAGE.contentWidth - 20;
    const words = text.split(' ');
    let line = '';
    
    words.forEach(word => {
      const testLine = line + word + ' ';
      if (testLine.length * (size * 0.5) > maxWidth) {
        this.content.push(`
          <text fill="${color}" x="${PAGE.margin}" y="${this.currentY}" 
            font-family="Inter, sans-serif" font-size="${size}">
            ${this.escapeXml(line.trim())}
          </text>
        `);
        this.currentY += size + 4;
        line = word + ' ';
      } else {
        line = testLine;
      }
    });
    
    if (line.trim()) {
      this.content.push(`
        <text fill="${color}" x="${PAGE.margin}" y="${this.currentY}" 
          font-family="Inter, sans-serif" font-size="${size}">
          ${this.escapeXml(line.trim())}
        </text>
      `);
      this.currentY += size + 6;
    }
  }

  addCard(title: string, items: { label: string; value: string; status?: string }[]) {
    const cardHeight = 25 + (items.length * 22);
    
    this.content.push(`
      <rect fill="${COLORS.surface}" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${cardHeight}" rx="0"/>
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${cardHeight}" rx="0"/>
      <text fill="${COLORS.text}" x="${PAGE.margin + 15}" y="${this.currentY + 18}" 
        font-family="Inter, sans-serif" font-size="10" font-weight="500">
        ${this.escapeXml(title)}
      </text>
    `);

    let itemY = this.currentY + 35;
    items.forEach(item => {
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${PAGE.margin + 15}" y="${itemY}" 
          font-family="Inter, sans-serif" font-size="9">
          ${this.escapeXml(item.label)}
        </text>
        <text fill="${COLORS.text}" x="${PAGE.margin + 150}" y="${itemY}" 
          font-family="Inter, sans-serif" font-size="9">
          ${this.escapeXml(item.value)}
        </text>
      `);
      itemY += 22;
    });

    this.currentY += cardHeight + 15;
  }

  generate(): string {
    // Footer
    this.content.push(`
      <line x1="${PAGE.margin}" y1="${PAGE.height - 35}" x2="${PAGE.width - PAGE.margin}" y2="${PAGE.height - 35}" 
        stroke="${COLORS.border}" stroke-width="0.5"/>
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${PAGE.height - 20}" 
        font-family="Inter, sans-serif" font-size="7">
        SQUAD /// FILM
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.width / 2}" y="${PAGE.height - 20}" 
        font-family="Inter, sans-serif" font-size="7" text-anchor="middle">
        ${this.escapeXml(this.projectName)}
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.width - PAGE.margin}" y="${PAGE.height - 20}" 
        font-family="Inter, sans-serif" font-size="7" text-anchor="end">
        Página ${this.pageNumber}
      </text>
    `);

    return `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE.width} ${PAGE.height}">
        ${this.content.join("")}
      </svg>`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input = (await req.json()) as ExportInput;
    const { type, id, period = "3m" } = input;

    console.log(`Generating PDF: type=${type}, id=${id}, period=${period}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let svgContent: string;

    // Use premium generator for project type
    if (type === "project" && id) {
      const pdf = new PremiumPortalPDFGenerator();

      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (!project) {
        return new Response(
          JSON.stringify({ error: "Project not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: stages } = await supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", id)
        .order("order_index", { ascending: true });

      const { data: deliverables } = await supabase
        .from("portal_deliverables")
        .select("*")
        .eq("portal_link_id", id);

      const allStages = stages || [];
      const completedStages = allStages.filter(s => s.status === 'completed').length;
      const totalStages = allStages.length || 9;
      const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
      const currentStageName = project.stage_current 
        ? STAGE_NAMES[project.stage_current] || project.stage_current 
        : 'Pré-produção';

      // ==========================================
      // BUILD PREMIUM PROJECT PDF
      // ==========================================

      // 1. Header badges
      pdf.addHeaderBadges(
        project.status,
        project.template || 'custom',
        currentStageName,
        project.has_payment_block || false
      );

      // 2. Project title & client
      pdf.addProjectTitle(
        project.name,
        project.client_name || 'Cliente não definido'
      );

      // 3. Block alert (if applicable)
      if (project.has_payment_block) {
        pdf.addBlockAlert();
      }

      // 4. Metrics Grid
      pdf.addMetricsGrid([
        { 
          label: "Valor do Contrato", 
          value: formatCurrency(project.contract_value || 0),
          sublabel: "Investimento Total"
        },
        { 
          label: "Saúde do Projeto", 
          value: `${project.health_score || 100}%`,
          color: (project.health_score || 100) >= 80 ? COLORS.success : COLORS.warning,
          sublabel: (project.health_score || 100) >= 80 ? "Excelente" : "Atenção"
        },
        { 
          label: "Previsão Entrega", 
          value: formatDate(project.due_date),
          sublabel: project.due_date ? "Data prevista" : "Em definição"
        },
        { 
          label: "Responsável", 
          value: project.owner_name || "Squad Film",
          color: COLORS.primary,
          sublabel: "Squad Film Direct"
        },
      ]);

      // 5. Production flow (stages)
      if (allStages.length > 0) {
        pdf.addSectionHeader("00", "FLUXO DE PRODUÇÃO");
        pdf.addStagesFlow(allStages.map(s => ({
          title: s.title || STAGE_NAMES[s.stage_key] || s.stage_key,
          status: s.status
        })));
      }

      // 6. Executive Summary
      pdf.addSectionHeader("01", "RESUMO EXECUTIVO");
      const description = project.description || '';
      const paragraphs = description.split('\n\n').filter((p: string) => p.trim());
      const headline = paragraphs[0]?.length < 80 
        ? paragraphs[0] 
        : `${project.name} — Narrativa Audiovisual Completa.`;
      
      pdf.addExecutiveSummary(
        headline,
        paragraphs.slice(headline === paragraphs[0] ? 1 : 0).slice(0, 3)
      );

      // 7. Scope Detail
      pdf.addSectionHeader("02", "ESCOPO DETALHADO");
      const scopeText = `O presente contrato tem por objeto a prestação de serviços de produção audiovisual para o projeto "${project.name}", visando registrar e transmitir a magnitude do empreendimento através de uma narrativa audiovisual completa.`;
      pdf.addScopeSection(scopeText, "Wide (Horizontal) e Vertical, conforme necessidade de cada plataforma.");

      // 8. Deliverables
      if (deliverables && deliverables.length > 0) {
        pdf.addSectionHeader("03", "ENTREGAS & MATERIAIS");
        pdf.addDeliverablesList(deliverables.slice(0, 10).map((d: any, i: number) => ({
          index: i + 1,
          title: d.title || 'Entrega',
          description: d.description || 'Material em produção',
          status: d.status || 'not_started'
        })));
      } else {
        // Default deliverables if none exist
        pdf.addSectionHeader("03", "ENTREGAS & MATERIAIS");
        pdf.addDeliverablesList([
          { index: 1, title: 'Vídeo Lançamento (Até 02m30s)', description: 'Qualidade Cinema 4K • Wide & Vertical', status: 'not_started' },
          { index: 2, title: 'Institucional', description: 'Até 03m00s • Formato Narrativo', status: 'not_started' },
          { index: 3, title: 'Vídeo Manifesto', description: 'Até 01m30s • Storytelling Emocional', status: 'not_started' },
        ]);
      }

      // 9. Financial Conditions
      pdf.addSectionHeader("04", "CONDIÇÕES FINANCEIRAS");
      pdf.addFinancialConditions(
        'squadfilmeo@gmail.com',
        'Matheus Filipe Alves',
        'Nubank'
      );

      // 10. Configuration
      pdf.addSectionHeader("05", "CONFIGURAÇÕES");
      pdf.addConfigSection(2);

      svgContent = pdf.generate();

    } else {
      // Use simple generator for other types
      const pdf = new SimplePDFGenerator();

      if (type === "report_360") {
        const { start, end } = getPeriodDates(period);
        
        const { data: projects } = await supabase
          .from("projects")
          .select("*")
          .gte("created_at", start.toISOString())
          .order("created_at", { ascending: false });

        const allProjects = projects || [];
        const delivered = allProjects.filter(p => p.status === "completed").length;
        const open = allProjects.filter(p => p.status === "active").length;
        const totalValue = allProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);

        pdf.addHeader(
          "RELATÓRIO 360°",
          `${start.toLocaleDateString("pt-BR")} — ${end.toLocaleDateString("pt-BR")}`,
          "report",
          "analytics",
          "overview",
          false
        );

        pdf.addMetricsGrid([
          { label: "Total de Projetos", value: String(allProjects.length) },
          { label: "Entregues", value: String(delivered), color: COLORS.success },
          { label: "Em Produção", value: String(open), color: COLORS.primary },
          { label: "Valor Total", value: formatCurrency(totalValue) },
        ]);

        pdf.addSection("PROJETOS NO PERÍODO");
        allProjects.slice(0, 12).forEach(p => {
          pdf.addCard(p.name, [
            { label: "Cliente", value: p.client_name || "-" },
            { label: "Etapa", value: STAGE_NAMES[p.stage_current] || p.stage_current || "-" },
            { label: "Saúde", value: `${p.health_score || 0}%` },
          ]);
        });

      } else if (type === "tasks") {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });

        const allTasks = tasks || [];
        const pending = allTasks.filter(t => t.status !== "done").length;
        const done = allTasks.filter(t => t.status === "done").length;

        pdf.addHeader(
          "MINHAS TAREFAS",
          formatDate(new Date().toISOString()),
          "tasks",
          "productivity",
          "overview",
          false
        );

        pdf.addMetricsGrid([
          { label: "Total", value: String(allTasks.length) },
          { label: "Pendentes", value: String(pending), color: COLORS.warning },
          { label: "Concluídas", value: String(done), color: COLORS.success },
        ]);

        pdf.addSection("TAREFAS PENDENTES");
        allTasks.filter(t => t.status !== "done").slice(0, 15).forEach(t => {
          pdf.addText(`• ${t.title}`, 9, COLORS.text);
        });

      } else if (type === "project_overview") {
        const { data: projects } = await supabase
          .from("projects")
          .select("*")
          .in("status", ["active", "paused"])
          .order("created_at", { ascending: false });

        const allProjects = projects || [];
        const active = allProjects.filter(p => p.status === "active").length;
        const paused = allProjects.filter(p => p.status === "paused").length;
        const totalValue = allProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);

        pdf.addHeader(
          "VISÃO GERAL",
          "Projetos Ativos",
          "overview",
          "projects",
          "dashboard",
          false
        );

        pdf.addMetricsGrid([
          { label: "Total Ativos", value: String(allProjects.length) },
          { label: "Em Produção", value: String(active), color: COLORS.success },
          { label: "Pausados", value: String(paused), color: COLORS.warning },
          { label: "Valor Total", value: formatCurrency(totalValue) },
        ]);

        pdf.addSection("LISTA DE PROJETOS");
        allProjects.slice(0, 15).forEach(p => {
          pdf.addCard(p.name, [
            { label: "Cliente", value: p.client_name || "-" },
            { label: "Etapa", value: STAGE_NAMES[p.stage_current] || p.stage_current || "-", status: p.status },
          ]);
        });

      } else {
        return new Response(
          JSON.stringify({ error: "Invalid export type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      svgContent = pdf.generate();
    }

    // Save to storage
    const fileName = `${type}_${id || "all"}_${Date.now()}.svg`;
    const filePath = `exports/pdf/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, svgContent, {
        contentType: "image/svg+xml",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to save PDF", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(filePath);

    console.log("PDF generated successfully:", publicUrlData.publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        type,
        public_url: publicUrlData.publicUrl,
        file_path: filePath,
        file_name: fileName,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("export-universal-pdf error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
