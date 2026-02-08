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
  success: "#22c55e", // green-500
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

// Typography: Host Grotesk
// - Títulos: CAIXA ALTA, weight 500 (Medium)
// - Títulos de corpo: weight 500 (Medium), normal case
// - Corpo de texto: weight 300 (Light), normal case
const FONTS = {
  title: "Host Grotesk, Inter, sans-serif",
  titleWeight: "500",
  body: "Host Grotesk, Inter, sans-serif",
  bodyWeight: "300",
  headingWeight: "500",
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
 * Premium Editorial PDF Generator
 * Layout: Sidebar (left) + Main Content (right) 
 * Typography: Host Grotesk only
 * - Titles: UPPERCASE, Medium (500)
 * - Body Headings: Medium (500), normal case  
 * - Body Text: Light (300), normal case
 */
class PremiumEditorialPDFGenerator {
  private pages: string[][] = [[]];
  private currentPageIndex = 0;
  private currentY = PAGE.margin;
  private projectName = "";
  
  // Layout dimensions
  private readonly SIDEBAR_WIDTH = 180;
  private readonly MAIN_WIDTH = PAGE.contentWidth - 190;
  private readonly MAIN_X = PAGE.margin + 190;

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
    if (this.currentY + requiredHeight > PAGE.height - 60) {
      this.newPage();
    }
  }

  private newPage() {
    this.currentPageIndex++;
    this.pages[this.currentPageIndex] = [];
    this.currentY = PAGE.margin;
  }

  // ==========================================
  // SIDEBAR PANEL (Left column - sticky info)
  // ==========================================
  addSidebarPanel(
    project: { 
      name: string; 
      client_name: string; 
      status: string;
      template: string;
      health_score: number;
      contract_value: number;
      due_date: string | null;
      owner_name: string;
      has_payment_block: boolean;
    },
    progress: number,
    totalStages: number
  ) {
    const sidebarX = PAGE.margin;
    const sidebarHeight = 380;
    let localY = this.currentY;

    // Sidebar container
    this.content.push(`
      <rect fill="${COLORS.surface}" x="${sidebarX}" y="${localY}" 
        width="${this.SIDEBAR_WIDTH}" height="${sidebarHeight}" rx="0"/>
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${sidebarX}" y="${localY}" 
        width="${this.SIDEBAR_WIDTH}" height="${sidebarHeight}" rx="0"/>
    `);

    const innerX = sidebarX + 16;
    localY += 24;

    // Status badges row
    const statusLabel = project.status === 'active' ? 'ACTIVE' : project.status?.toUpperCase() || 'ACTIVE';
    this.content.push(`
      <rect fill="${COLORS.primary}22" x="${innerX}" y="${localY}" width="50" height="16" rx="0"/>
      <rect fill="none" stroke="${COLORS.primary}44" stroke-width="0.5" x="${innerX}" y="${localY}" width="50" height="16"/>
      <text fill="${COLORS.primary}" x="${innerX + 25}" y="${localY + 11}" 
        font-family="${FONTS.title}" font-size="7" text-anchor="middle" font-weight="${FONTS.titleWeight}" letter-spacing="0.8">
        ${statusLabel}
      </text>
    `);
    
    if (project.has_payment_block) {
      this.content.push(`
        <rect fill="${COLORS.error}22" x="${innerX + 58}" y="${localY}" width="60" height="16" rx="0"/>
        <rect fill="none" stroke="${COLORS.error}44" stroke-width="0.5" x="${innerX + 58}" y="${localY}" width="60" height="16"/>
        <text fill="${COLORS.error}" x="${innerX + 88}" y="${localY + 11}" 
          font-family="${FONTS.title}" font-size="7" text-anchor="middle" font-weight="${FONTS.titleWeight}" letter-spacing="0.5">
          BLOQUEADO
        </text>
      `);
    }
    localY += 28;

    // Project Title - UPPERCASE MEDIUM
    this.content.push(`
      <text fill="${COLORS.text}" x="${innerX}" y="${localY}" 
        font-family="${FONTS.title}" font-size="16" font-weight="${FONTS.titleWeight}">
        ${this.escapeXml(project.name.substring(0, 18).toUpperCase())}
      </text>
    `);
    localY += 18;

    // Client name - italic style (light)
    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${innerX}" y="${localY}" 
        font-family="${FONTS.body}" font-size="9" font-weight="${FONTS.bodyWeight}" font-style="italic">
        ${this.escapeXml(project.client_name || 'Cliente')}
      </text>
    `);
    localY += 28;

    // Divider
    this.content.push(`
      <line x1="${innerX}" y1="${localY}" x2="${sidebarX + this.SIDEBAR_WIDTH - 16}" y2="${localY}" 
        stroke="${COLORS.border}" stroke-width="0.5"/>
    `);
    localY += 20;

    // Metrics grid (2x2)
    const metrics = [
      { label: "VALOR DO CONTRATO", value: formatCurrency(project.contract_value || 0), color: COLORS.primary },
      { label: "SAÚDE", value: `${project.health_score || 100}%`, color: COLORS.success },
      { label: "ENTREGA", value: formatDate(project.due_date), color: COLORS.text },
      { label: "RESPONSÁVEL", value: project.owner_name?.substring(0, 14) || "Squad Film", color: COLORS.text },
    ];

    metrics.forEach((metric, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const mx = innerX + (col * 75);
      const my = localY + (row * 42);

      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${mx}" y="${my}" 
          font-family="${FONTS.title}" font-size="6" font-weight="${FONTS.titleWeight}" letter-spacing="0.5">
          ${metric.label}
        </text>
        <text fill="${metric.color}" x="${mx}" y="${my + 15}" 
          font-family="${FONTS.body}" font-size="11" font-weight="${FONTS.headingWeight}">
          ${this.escapeXml(metric.value)}
        </text>
      `);
    });
    localY += 100;

    // Block alert (if applicable)
    if (project.has_payment_block) {
      this.content.push(`
        <rect fill="${COLORS.error}12" x="${innerX - 4}" y="${localY}" 
          width="${this.SIDEBAR_WIDTH - 24}" height="50" rx="0"/>
        <rect fill="none" stroke="${COLORS.error}33" stroke-width="0.5" x="${innerX - 4}" y="${localY}" 
          width="${this.SIDEBAR_WIDTH - 24}" height="50"/>
        <text fill="${COLORS.error}" x="${innerX + 4}" y="${localY + 16}" 
          font-family="${FONTS.title}" font-size="7" font-weight="${FONTS.titleWeight}" letter-spacing="0.5">
          BLOQUEADO POR INADIMPLÊNCIA
        </text>
        <text fill="${COLORS.textMuted}" x="${innerX + 4}" y="${localY + 30}" 
          font-family="${FONTS.body}" font-size="7" font-weight="${FONTS.bodyWeight}">
          Fatura em atraso. Entrega final
        </text>
        <text fill="${COLORS.textMuted}" x="${innerX + 4}" y="${localY + 40}" 
          font-family="${FONTS.body}" font-size="7" font-weight="${FONTS.bodyWeight}">
          bloqueada até regularização.
        </text>
      `);
      localY += 60;
    }

    // Progress bar
    localY = this.currentY + sidebarHeight - 80;
    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${innerX}" y="${localY}" 
        font-family="${FONTS.title}" font-size="7" font-weight="${FONTS.titleWeight}" letter-spacing="0.5">
        PROGRESSO
      </text>
      <text fill="${COLORS.text}" x="${sidebarX + this.SIDEBAR_WIDTH - 20}" y="${localY}" 
        font-family="${FONTS.body}" font-size="8" text-anchor="end">
        ${progress}% (0/${totalStages} etapas)
      </text>
    `);
    localY += 12;
    
    // Progress bar background
    const barWidth = this.SIDEBAR_WIDTH - 32;
    this.content.push(`
      <rect fill="${COLORS.border}" x="${innerX}" y="${localY}" width="${barWidth}" height="3" rx="0"/>
      <rect fill="${COLORS.primary}" x="${innerX}" y="${localY}" width="${Math.max(2, (progress / 100) * barWidth)}" height="3" rx="0"/>
    `);
    localY += 20;

    // Access portal button
    this.content.push(`
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${innerX - 4}" y="${localY}" 
        width="${this.SIDEBAR_WIDTH - 24}" height="28" rx="0"/>
      <text fill="${COLORS.textMuted}" x="${sidebarX + this.SIDEBAR_WIDTH / 2}" y="${localY + 18}" 
        font-family="${FONTS.title}" font-size="7" text-anchor="middle" font-weight="${FONTS.titleWeight}" letter-spacing="1">
        ACESSAR PORTAL DO CLIENTE
      </text>
    `);

    this.projectName = project.name;
  }

  // ==========================================
  // MAIN CONTENT AREA (Right column)
  // ==========================================
  
  // Section Header - "01 — RESUMO EXECUTIVO" style
  addSectionHeader(index: string, title: string) {
    this.checkPageBreak(35);
    
    this.content.push(`
      <text fill="${COLORS.primary}" x="${this.MAIN_X}" y="${this.currentY}" 
        font-family="${FONTS.title}" font-size="8" font-weight="${FONTS.titleWeight}" letter-spacing="1.5">
        ${index} — ${this.escapeXml(title.toUpperCase())}
      </text>
    `);
    this.currentY += 22;
  }

  // Executive Summary - Editorial style with headline + paragraphs
  addExecutiveSummary(headline: string, paragraphs: string[]) {
    this.checkPageBreak(120);
    
    const cardWidth = this.MAIN_WIDTH;
    let estimatedHeight = 40;
    paragraphs.forEach(p => {
      estimatedHeight += Math.ceil(p.length / 75) * 16 + 12;
    });
    estimatedHeight = Math.min(estimatedHeight, 180);

    // Card background
    this.content.push(`
      <rect fill="${COLORS.surface}" x="${this.MAIN_X}" y="${this.currentY}" 
        width="${cardWidth}" height="${estimatedHeight}" rx="0"/>
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${this.MAIN_X}" y="${this.currentY}" 
        width="${cardWidth}" height="${estimatedHeight}" rx="0"/>
    `);

    const innerX = this.MAIN_X + 18;
    const innerWidth = cardWidth - 36;
    let localY = this.currentY + 26;

    // Headline - Medium weight, larger size
    if (headline) {
      this.content.push(`
        <text fill="${COLORS.text}" x="${innerX}" y="${localY}" 
          font-family="${FONTS.body}" font-size="14" font-weight="${FONTS.headingWeight}">
          Narrativa Audiovisual <tspan fill="${COLORS.primary}" font-style="italic">Completa</tspan>.
        </text>
      `);
      localY += 26;
    }

    // Paragraphs - Light weight body text
    paragraphs.slice(0, 3).forEach(paragraph => {
      const words = paragraph.split(' ');
      let line = '';
      const maxChars = 70;
      
      words.forEach(word => {
        if ((line + word).length > maxChars) {
          this.content.push(`
            <text fill="${COLORS.textDim}" x="${innerX}" y="${localY}" 
              font-family="${FONTS.body}" font-size="10" font-weight="${FONTS.bodyWeight}">
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
          <text fill="${COLORS.textDim}" x="${innerX}" y="${localY}" 
            font-family="${FONTS.body}" font-size="10" font-weight="${FONTS.bodyWeight}">
            ${this.escapeXml(line.trim())}
          </text>
        `);
        localY += 20;
      }
    });

    this.currentY += estimatedHeight + 18;
  }

  // Scope Section with quote-style border
  addScopeSection(scopeText: string) {
    this.checkPageBreak(100);
    
    const cardWidth = this.MAIN_WIDTH;
    const cardHeight = 90;

    // Card background
    this.content.push(`
      <rect fill="${COLORS.surface}" x="${this.MAIN_X}" y="${this.currentY}" 
        width="${cardWidth}" height="${cardHeight}" rx="0"/>
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${this.MAIN_X}" y="${this.currentY}" 
        width="${cardWidth}" height="${cardHeight}" rx="0"/>
    `);

    // Left border accent (quote style)
    this.content.push(`
      <rect fill="${COLORS.primary}66" x="${this.MAIN_X}" y="${this.currentY}" width="3" height="${cardHeight}"/>
    `);

    const innerX = this.MAIN_X + 20;
    let localY = this.currentY + 22;

    // Scope text with word wrap - Light weight
    const scopeWords = scopeText.split(' ');
    let line = '';
    const maxChars = 68;
    
    scopeWords.slice(0, 40).forEach(word => {
      if ((line + word).length > maxChars) {
        this.content.push(`
          <text fill="${COLORS.textMuted}" x="${innerX}" y="${localY}" 
            font-family="${FONTS.body}" font-size="9" font-weight="${FONTS.bodyWeight}">
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
          font-family="${FONTS.body}" font-size="9" font-weight="${FONTS.bodyWeight}">
          ${this.escapeXml(line.trim())}
        </text>
      `);
    }

    this.currentY += cardHeight + 18;
  }

  // Technical Methodology grid (2 columns)
  addMethodologyGrid() {
    this.checkPageBreak(80);
    
    const halfWidth = (this.MAIN_WIDTH - 10) / 2;
    
    // Left column - Metodologia Técnica
    this.content.push(`
      <text fill="${COLORS.primary}" x="${this.MAIN_X}" y="${this.currentY}" 
        font-family="${FONTS.title}" font-size="7" font-weight="${FONTS.titleWeight}" letter-spacing="1">
        METODOLOGIA TÉCNICA
      </text>
    `);
    
    // Right column - Compromissos SQUAD
    this.content.push(`
      <text fill="${COLORS.primary}" x="${this.MAIN_X + halfWidth + 10}" y="${this.currentY}" 
        font-family="${FONTS.title}" font-size="7" font-weight="${FONTS.titleWeight}" letter-spacing="1">
        COMPROMISSOS SQUAD
      </text>
    `);
    this.currentY += 16;

    const leftItems = ["• Equipamentos Cinema 4K", "• Utilização de Drone 4K", "• Processo de Color Grade", "• Licensing Profissional"];
    const rightItems = ["• Equipe de 02 Profissionais", "• Rigor no Cronograma", "• Identidade Industrial/Moderna"];

    leftItems.forEach((item, i) => {
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${this.MAIN_X}" y="${this.currentY + (i * 14)}" 
          font-family="${FONTS.body}" font-size="8" font-weight="${FONTS.bodyWeight}" letter-spacing="0.5">
          ${item.toUpperCase()}
        </text>
      `);
    });

    rightItems.forEach((item, i) => {
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${this.MAIN_X + halfWidth + 10}" y="${this.currentY + (i * 14)}" 
          font-family="${FONTS.body}" font-size="8" font-weight="${FONTS.bodyWeight}" letter-spacing="0.5">
          ${item.toUpperCase()}
        </text>
      `);
    });

    this.currentY += 70;
  }

  // Deliverables List - Premium indexed style
  addDeliverablesList(deliverables: { index: number; title: string; description: string; status: string }[]) {
    deliverables.slice(0, 6).forEach((item) => {
      this.checkPageBreak(42);
      
      const itemHeight = 38;
      const indexPad = (item.index < 10) ? '0' : '';
      
      // Item background with hover effect simulation
      this.content.push(`
        <rect fill="${COLORS.surface}" x="${this.MAIN_X}" y="${this.currentY}" 
          width="${this.MAIN_WIDTH}" height="${itemHeight}" rx="0"/>
        <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${this.MAIN_X}" y="${this.currentY}" 
          width="${this.MAIN_WIDTH}" height="${itemHeight}" rx="0"/>
      `);

      // Index number - Cyan accent
      this.content.push(`
        <text fill="${COLORS.primary}" x="${this.MAIN_X + 14}" y="${this.currentY + 24}" 
          font-family="${FONTS.body}" font-size="11" font-weight="${FONTS.bodyWeight}">
          ${indexPad}${item.index}
        </text>
      `);

      // Title - Medium weight, UPPERCASE
      this.content.push(`
        <text fill="${COLORS.text}" x="${this.MAIN_X + 48}" y="${this.currentY + 18}" 
          font-family="${FONTS.title}" font-size="9" font-weight="${FONTS.headingWeight}" letter-spacing="0.3">
          ${this.escapeXml(item.title.substring(0, 40).toUpperCase())}
        </text>
      `);

      // Description - Light weight
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${this.MAIN_X + 48}" y="${this.currentY + 30}" 
          font-family="${FONTS.body}" font-size="8" font-weight="${FONTS.bodyWeight}">
          ${this.escapeXml(item.description.substring(0, 55))}
        </text>
      `);

      // Status badge
      const statusColor = item.status === 'completed' ? COLORS.success : 
                         item.status === 'in_progress' ? COLORS.primary : 
                         item.status === 'blocked' ? COLORS.error : COLORS.textMuted;
      const statusText = item.status === 'completed' ? 'CONCLUÍDO' : 
                        item.status === 'in_progress' ? 'WIDE & VERTICAL' : 
                        item.status === 'blocked' ? 'BLOQUEADO' : 'PENDENTE';
      
      const statusX = this.MAIN_X + this.MAIN_WIDTH - 80;
      this.content.push(`
        <text fill="${statusColor}" x="${statusX}" y="${this.currentY + 18}" 
          font-family="${FONTS.title}" font-size="6" font-weight="${FONTS.titleWeight}" letter-spacing="0.5">
          ${statusText}
        </text>
      `);

      this.currentY += itemHeight + 2;
    });

    // "Ver todas as entregas" link
    if (deliverables.length > 6) {
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${this.MAIN_X}" y="${this.currentY + 10}" 
          font-family="${FONTS.body}" font-size="8" font-weight="${FONTS.bodyWeight}">
          + Ver todas as ${deliverables.length} entregas
        </text>
      `);
      this.currentY += 20;
    }

    this.currentY += 10;
  }

  // Financial Conditions Table
  addFinancialTable(milestones: { description: string; due_date: string; amount: number; status: string }[]) {
    this.checkPageBreak(120);
    
    const tableWidth = this.MAIN_WIDTH;
    const rowHeight = 32;
    const headerHeight = 28;
    const tableHeight = headerHeight + (milestones.length * rowHeight);

    // Table container
    this.content.push(`
      <rect fill="${COLORS.surface}" x="${this.MAIN_X}" y="${this.currentY}" 
        width="${tableWidth}" height="${tableHeight}" rx="0"/>
      <rect fill="none" stroke="${COLORS.border}" stroke-width="0.5" x="${this.MAIN_X}" y="${this.currentY}" 
        width="${tableWidth}" height="${tableHeight}" rx="0"/>
    `);

    // Header row
    this.content.push(`
      <rect fill="${COLORS.border}66" x="${this.MAIN_X}" y="${this.currentY}" 
        width="${tableWidth}" height="${headerHeight}" rx="0"/>
      <text fill="${COLORS.textMuted}" x="${this.MAIN_X + 16}" y="${this.currentY + 18}" 
        font-family="${FONTS.title}" font-size="7" font-weight="${FONTS.titleWeight}" letter-spacing="0.8">
        PARCELA
      </text>
      <text fill="${COLORS.textMuted}" x="${this.MAIN_X + tableWidth - 140}" y="${this.currentY + 18}" 
        font-family="${FONTS.title}" font-size="7" font-weight="${FONTS.titleWeight}" letter-spacing="0.8">
        DATA
      </text>
      <text fill="${COLORS.textMuted}" x="${this.MAIN_X + tableWidth - 16}" y="${this.currentY + 18}" 
        font-family="${FONTS.title}" font-size="7" font-weight="${FONTS.titleWeight}" text-anchor="end" letter-spacing="0.8">
        VALOR
      </text>
    `);

    let rowY = this.currentY + headerHeight;
    
    milestones.forEach((m, i) => {
      const isPaid = m.status === 'paid';
      const isOverdue = m.status === 'overdue';
      
      // Row divider
      if (i > 0) {
        this.content.push(`
          <line x1="${this.MAIN_X + 10}" y1="${rowY}" x2="${this.MAIN_X + tableWidth - 10}" y2="${rowY}" 
            stroke="${COLORS.border}" stroke-width="0.5"/>
        `);
      }

      // Description
      this.content.push(`
        <text fill="${COLORS.text}" x="${this.MAIN_X + 16}" y="${rowY + 20}" 
          font-family="${FONTS.body}" font-size="9" font-weight="${FONTS.headingWeight}">
          ${this.escapeXml(m.description || `Parcela ${i + 1}`)}
        </text>
      `);

      // Date
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${this.MAIN_X + tableWidth - 140}" y="${rowY + 20}" 
          font-family="${FONTS.body}" font-size="9" font-weight="${FONTS.bodyWeight}">
          ${formatDate(m.due_date)}
        </text>
      `);

      // Amount with color based on status
      const amountColor = isPaid ? COLORS.success : isOverdue ? COLORS.error : COLORS.text;
      this.content.push(`
        <text fill="${amountColor}" x="${this.MAIN_X + tableWidth - 16}" y="${rowY + 20}" 
          font-family="${FONTS.body}" font-size="10" font-weight="${FONTS.headingWeight}" text-anchor="end">
          ${formatCurrency(m.amount)}
        </text>
      `);

      rowY += rowHeight;
    });

    this.currentY += tableHeight + 12;

    // PIX info
    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${this.MAIN_X}" y="${this.currentY}" 
        font-family="${FONTS.body}" font-size="8" font-weight="${FONTS.bodyWeight}" letter-spacing="0.3">
        PAGAMENTO VIA PIX (SQUADFILMEO@GMAIL.COM) • BANCO NUBANK • TITULAR: MATHEUS FILIPE ALVES
      </text>
    `);

    this.currentY += 25;
  }

  // Observations Section
  addObservationsSection() {
    this.checkPageBreak(90);
    
    const halfWidth = (this.MAIN_WIDTH - 10) / 2;
    
    const leftItems = [
      "• Direitos patrimoniais cedidos após quitação.",
      "• Rescisão exige aviso prévio de 30 dias.",
      "• Sinal não devolvido em rescisão sem justa causa."
    ];
    const rightItems = [
      "• Foro: Comarca de Anápolis/GO.",
      "• Limite de revisões: 02 por entrega.",
      "• Entrega em formatos Wide e Vertical."
    ];

    leftItems.forEach((item, i) => {
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${this.MAIN_X}" y="${this.currentY + (i * 16)}" 
          font-family="${FONTS.body}" font-size="8" font-weight="${FONTS.bodyWeight}">
          ${item}
        </text>
      `);
    });

    rightItems.forEach((item, i) => {
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${this.MAIN_X + halfWidth + 10}" y="${this.currentY + (i * 16)}" 
          font-family="${FONTS.body}" font-size="8" font-weight="${FONTS.bodyWeight}">
          ${item}
        </text>
      `);
    });

    this.currentY += 60;
  }

  // ==========================================
  // FOOTER
  // ==========================================
  private addFooter(pageNum: number, totalPages: number) {
    return `
      <line x1="${PAGE.margin}" y1="${PAGE.height - 45}" x2="${PAGE.width - PAGE.margin}" y2="${PAGE.height - 45}" 
        stroke="${COLORS.border}" stroke-width="0.5"/>
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${PAGE.height - 26}" 
        font-family="${FONTS.title}" font-size="9" font-weight="${FONTS.headingWeight}" letter-spacing="2">
        SQUAD /// FILM
      </text>
      <text fill="${COLORS.textDim}" x="${PAGE.margin}" y="${PAGE.height - 14}" 
        font-family="${FONTS.body}" font-size="7" font-weight="${FONTS.bodyWeight}">
        Visual Storytelling Studio
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.width / 2}" y="${PAGE.height - 20}" 
        font-family="${FONTS.body}" font-size="7" font-weight="${FONTS.bodyWeight}" text-anchor="middle">
        Relatório Gerado em ${new Date().getFullYear()} • ${this.escapeXml(this.projectName)} — Executivo
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.width - PAGE.margin}" y="${PAGE.height - 26}" 
        font-family="${FONTS.body}" font-size="7" font-weight="${FONTS.bodyWeight}" text-anchor="end">
        Brazil / Global
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.width - PAGE.margin}" y="${PAGE.height - 14}" 
        font-family="${FONTS.body}" font-size="7" font-weight="${FONTS.bodyWeight}" text-anchor="end">
        ©${new Date().getFullYear()} • Página ${pageNum}/${totalPages}
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

    if (totalPages === 1) {
      return `<?xml version="1.0" encoding="UTF-8"?>${svgPages[0]}`;
    }

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

// Legacy generator for non-project types
class SimplePDFGenerator {
  private content: string[] = [];
  private currentY = PAGE.margin;
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

  addHeader(title: string, subtitle: string) {
    this.content.push(`
      <text fill="${COLORS.text}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="${FONTS.title}" font-size="20" font-weight="${FONTS.titleWeight}">
        ${this.escapeXml(title.toUpperCase())}
      </text>
    `);
    this.projectName = title;
    this.currentY += 22;
    
    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="${FONTS.body}" font-size="10" font-weight="${FONTS.bodyWeight}">
        ${this.escapeXml(subtitle)}
      </text>
    `);
    this.currentY += 30;
  }

  addMetricsGrid(metrics: { label: string; value: string; color?: string }[]) {
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
          font-family="${FONTS.title}" font-size="7" font-weight="${FONTS.titleWeight}" letter-spacing="0.5">
          ${this.escapeXml(metric.label.toUpperCase())}
        </text>
        <text fill="${metric.color || COLORS.text}" x="${x + 12}" y="${this.currentY + 38}" 
          font-family="${FONTS.body}" font-size="14" font-weight="${FONTS.headingWeight}">
          ${this.escapeXml(metric.value)}
        </text>
      `);
    });

    this.currentY += metricHeight + 20;
  }

  addSection(title: string) {
    this.content.push(`
      <text fill="${COLORS.primary}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="${FONTS.title}" font-size="8" font-weight="${FONTS.titleWeight}" letter-spacing="1.5">
        ${this.escapeXml(title.toUpperCase())}
      </text>
    `);
    this.currentY += 20;
  }

  addText(text: string, size = 10, color = COLORS.text) {
    const words = text.split(' ');
    let line = '';
    const maxChars = Math.floor(PAGE.contentWidth / (size * 0.5));
    
    words.forEach(word => {
      if ((line + word).length > maxChars) {
        this.content.push(`
          <text fill="${color}" x="${PAGE.margin}" y="${this.currentY}" 
            font-family="${FONTS.body}" font-size="${size}" font-weight="${FONTS.bodyWeight}">
            ${this.escapeXml(line.trim())}
          </text>
        `);
        this.currentY += size + 4;
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    });
    
    if (line.trim()) {
      this.content.push(`
        <text fill="${color}" x="${PAGE.margin}" y="${this.currentY}" 
          font-family="${FONTS.body}" font-size="${size}" font-weight="${FONTS.bodyWeight}">
          ${this.escapeXml(line.trim())}
        </text>
      `);
      this.currentY += size + 6;
    }
  }

  generate(): string {
    this.content.push(`
      <line x1="${PAGE.margin}" y1="${PAGE.height - 35}" x2="${PAGE.width - PAGE.margin}" y2="${PAGE.height - 35}" 
        stroke="${COLORS.border}" stroke-width="0.5"/>
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${PAGE.height - 20}" 
        font-family="${FONTS.title}" font-size="8" font-weight="${FONTS.titleWeight}" letter-spacing="1">
        SQUAD /// FILM
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.width - PAGE.margin}" y="${PAGE.height - 20}" 
        font-family="${FONTS.body}" font-size="7" font-weight="${FONTS.bodyWeight}" text-anchor="end">
        Página 1
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

    // Use premium editorial generator for project type
    if (type === "project" && id) {
      const pdf = new PremiumEditorialPDFGenerator();

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

      const { data: milestones } = await supabase
        .from("payment_milestones")
        .select("*")
        .eq("project_id", id)
        .order("due_date", { ascending: true });

      const allStages = stages || [];
      const completedStages = allStages.filter(s => s.status === 'completed').length;
      const totalStages = allStages.length || 9;
      const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

      // ==========================================
      // BUILD PREMIUM EDITORIAL PDF
      // ==========================================

      // 1. Sidebar Panel (left column)
      pdf.addSidebarPanel({
        name: project.name,
        client_name: project.client_name || 'Cliente',
        status: project.status || 'active',
        template: project.template || 'custom',
        health_score: project.health_score || 100,
        contract_value: project.contract_value || 0,
        due_date: project.due_date,
        owner_name: project.owner_name || 'Squad Film',
        has_payment_block: project.has_payment_block || false,
      }, progress, totalStages);

      // 2. Main content starts at same Y position
      // Resumo Executivo
      pdf.addSectionHeader("01", "RESUMO EXECUTIVO");
      const description = project.description || 'Este projeto audiovisual visa registrar e transmitir a magnitude do empreendimento através de uma narrativa cinematográfica completa.';
      const paragraphs = description.split('\n\n').filter((p: string) => p.trim());
      pdf.addExecutiveSummary(
        `${project.name} — Narrativa Audiovisual Completa.`,
        paragraphs.length > 0 ? paragraphs : [description]
      );

      // 3. Escopo Detalhado
      pdf.addSectionHeader("02", "ESCOPO DETALHADO");
      const scopeText = `2.1. O presente contrato tem por objeto a prestação de serviços de produção audiovisual para o projeto "${project.name}", visando registrar e transmitir a magnitude do empreendimento através de uma narrativa audiovisual completa. 2.2. O escopo inclui captação, edição, color grading e sound design, utilizando equipamentos Cinema 4K e Drone.`;
      pdf.addScopeSection(scopeText);
      pdf.addMethodologyGrid();

      // 4. Entregas & Formatos
      pdf.addSectionHeader("03", "ENTREGAS & FORMATOS");
      const deliverablesList = (deliverables || []).map((d: any, i: number) => ({
        index: i + 1,
        title: d.title || `Entrega ${i + 1}`,
        description: d.description || 'Qualidade Cinema 4K. Formatos Wide e Vertical.',
        status: d.status || 'pending'
      }));
      
      if (deliverablesList.length === 0) {
        // Default deliverables
        deliverablesList.push(
          { index: 1, title: "Vídeo Lançamento", description: "Até 02m30s. Qualidade Cinema 4K.", status: "in_progress" },
          { index: 1, title: "Institucional Porto 153", description: "Até 03m00s. Wide e Vertical. Cinema 4K.", status: "pending" },
          { index: 10, title: "Pílulas Motion Social", description: "Até 60s cada. Vertical. Motion Graphics.", status: "pending" },
          { index: 2, title: "Acompanhamento de Obra", description: "Até 02m00s cada. Wide e Vertical.", status: "pending" }
        );
      }
      pdf.addDeliverablesList(deliverablesList);

      // 5. Condições Financeiras
      pdf.addSectionHeader("04", "CONDIÇÕES FINANCEIRAS");
      const milestonesData = (milestones || []).map((m: any) => ({
        description: m.description || 'Parcela',
        due_date: m.due_date,
        amount: m.amount || 0,
        status: m.status || 'pending'
      }));
      
      if (milestonesData.length === 0) {
        // Default milestones based on contract value
        const totalValue = project.contract_value || 15590;
        milestonesData.push(
          { description: "Sinal - Reserva", due_date: "2026-01-15", amount: totalValue * 0.5, status: "paid" },
          { description: "Parcela 01", due_date: "2026-02-05", amount: totalValue * 0.25, status: "pending" },
          { description: "Parcela 02", due_date: "2026-03-05", amount: totalValue * 0.25, status: "pending" }
        );
      }
      pdf.addFinancialTable(milestonesData);

      // 6. Observações & Termos
      pdf.addSectionHeader("05", "OBSERVAÇÕES & TERMOS");
      pdf.addObservationsSection();

      svgContent = pdf.generate();

    } else if (type === "report_360") {
      // Report 360 generation (simplified)
      const pdf = new SimplePDFGenerator();
      const { start, end } = getPeriodDates(period);
      
      pdf.addHeader("Relatório 360", `Período: ${formatDate(start.toISOString())} — ${formatDate(end.toISOString())}`);
      
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .gte("created_at", start.toISOString());

      const { data: revenues } = await supabase
        .from("revenues")
        .select("*")
        .gte("created_at", start.toISOString());

      const totalProjects = projects?.length || 0;
      const totalRevenue = revenues?.reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0;
      
      pdf.addMetricsGrid([
        { label: "Projetos", value: String(totalProjects) },
        { label: "Receita", value: formatCurrency(totalRevenue), color: COLORS.success },
        { label: "Período", value: period.toUpperCase() },
      ]);

      pdf.addSection("Resumo do Período");
      pdf.addText(`Total de ${totalProjects} projetos no período selecionado com receita acumulada de ${formatCurrency(totalRevenue)}.`);

      svgContent = pdf.generate();

    } else if (type === "tasks") {
      const pdf = new SimplePDFGenerator();
      
      pdf.addHeader("Relatório de Tarefas", `Gerado em ${formatDate(new Date().toISOString())}`);
      
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
      const pendingTasks = tasks?.filter(t => t.status !== 'done').length || 0;
      
      pdf.addMetricsGrid([
        { label: "Total", value: String(totalTasks) },
        { label: "Concluídas", value: String(completedTasks), color: COLORS.success },
        { label: "Pendentes", value: String(pendingTasks), color: COLORS.warning },
      ]);

      pdf.addSection("Resumo");
      pdf.addText(`${completedTasks} tarefas concluídas de um total de ${totalTasks}.`);

      svgContent = pdf.generate();

    } else if (type === "project_overview") {
      const pdf = new SimplePDFGenerator();
      
      pdf.addHeader("Visão Geral de Projetos", `Gerado em ${formatDate(new Date().toISOString())}`);
      
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const totalValue = projects?.reduce((sum, p) => sum + Number(p.contract_value || 0), 0) || 0;
      
      pdf.addMetricsGrid([
        { label: "Total", value: String(totalProjects) },
        { label: "Ativos", value: String(activeProjects), color: COLORS.primary },
        { label: "Valor Total", value: formatCurrency(totalValue), color: COLORS.success },
      ]);

      pdf.addSection("Resumo");
      pdf.addText(`${activeProjects} projetos ativos de um total de ${totalProjects}, com valor acumulado de ${formatCurrency(totalValue)}.`);

      svgContent = pdf.generate();

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid export type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to storage
    const fileName = `${type}_${id || 'report'}_${Date.now()}.svg`;
    const filePath = `exports/pdf/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(filePath, svgContent, {
        contentType: "image/svg+xml",
        upsert: true,
      });

    if (uploadError) {
      // Try project-files bucket as fallback
      const { error: fallbackError } = await supabase.storage
        .from("project-files")
        .upload(filePath, svgContent, {
          contentType: "image/svg+xml",
          upsert: true,
        });

      if (fallbackError) {
        console.error("Upload error:", fallbackError);
        return new Response(
          JSON.stringify({ error: "Failed to save PDF", details: fallbackError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("project-files")
        .getPublicUrl(filePath);

      return new Response(
        JSON.stringify({
          success: true,
          public_url: publicUrlData.publicUrl,
          file_path: filePath,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("exports")
      .getPublicUrl(filePath);

    console.log("PDF generated:", publicUrlData.publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        public_url: publicUrlData.publicUrl,
        file_path: filePath,
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
