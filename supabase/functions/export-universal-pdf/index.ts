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

// Improved PDF Generator matching portal design
class PortalPDFGenerator {
  private content: string[] = [];
  private currentY = PAGE.margin;
  private pageNumber = 1;

  constructor() {
    // Start with background
    this.content.push(`<rect fill="${COLORS.background}" x="0" y="0" width="${PAGE.width}" height="${PAGE.height}"/>`);
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  addPortalHeader(projectName: string, clientName: string, status: string, template: string, stage: string, isBlocked: boolean) {
    // Badges row
    let badgeX = PAGE.margin;
    
    // Status badge
    this.content.push(`
      <rect fill="${COLORS.primary}33" x="${badgeX}" y="${this.currentY}" width="60" height="18" rx="0"/>
      <rect fill="none" stroke="${COLORS.primary}55" x="${badgeX}" y="${this.currentY}" width="60" height="18" rx="0"/>
      <text fill="${COLORS.primary}" x="${badgeX + 30}" y="${this.currentY + 12}" 
        font-family="Inter, sans-serif" font-size="7" text-anchor="middle" font-weight="bold" letter-spacing="0.5">
        ${this.escapeXml(status.toUpperCase())}
      </text>
    `);
    badgeX += 70;

    // Template badge
    this.content.push(`
      <rect fill="none" stroke="${COLORS.border}" x="${badgeX}" y="${this.currentY}" width="90" height="18" rx="0"/>
      <text fill="${COLORS.textMuted}" x="${badgeX + 45}" y="${this.currentY + 12}" 
        font-family="Inter, sans-serif" font-size="7" text-anchor="middle" letter-spacing="0.5">
        ${this.escapeXml(template.toUpperCase().replace(/_/g, ' '))}
      </text>
    `);
    badgeX += 100;

    // Stage badge
    this.content.push(`
      <rect fill="none" stroke="${COLORS.border}" x="${badgeX}" y="${this.currentY}" width="80" height="18" rx="0"/>
      <text fill="${COLORS.textMuted}" x="${badgeX + 40}" y="${this.currentY + 12}" 
        font-family="Inter, sans-serif" font-size="7" text-anchor="middle" letter-spacing="0.5">
        ${this.escapeXml(stage.toUpperCase())}
      </text>
    `);

    // Blocked badge
    if (isBlocked) {
      badgeX += 90;
      this.content.push(`
        <rect fill="${COLORS.error}33" x="${badgeX}" y="${this.currentY}" width="70" height="18" rx="0"/>
        <rect fill="none" stroke="${COLORS.error}55" x="${badgeX}" y="${this.currentY}" width="70" height="18" rx="0"/>
        <text fill="${COLORS.error}" x="${badgeX + 35}" y="${this.currentY + 12}" 
          font-family="Inter, sans-serif" font-size="7" text-anchor="middle" font-weight="bold" letter-spacing="0.5">
          BLOQUEADO
        </text>
      `);
    }

    this.currentY += 35;

    // Project title
    this.content.push(`
      <text fill="${COLORS.text}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="Playfair Display, serif" font-size="28" font-weight="400">
        ${this.escapeXml(projectName)}
      </text>
    `);
    this.currentY += 25;

    // Client info
    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="Inter, sans-serif" font-size="10">
        Cliente: <tspan fill="${COLORS.textDim}">${this.escapeXml(clientName.toUpperCase())}</tspan>
      </text>
    `);
    this.currentY += 25;
  }

  addMetricsGrid(metrics: { label: string; value: string; sublabel?: string; color?: string }[]) {
    const metricWidth = PAGE.contentWidth / metrics.length;
    const metricHeight = 55;

    // Grid container with border
    this.content.push(`
      <rect fill="${COLORS.border}" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${metricHeight}" rx="0"/>
    `);

    metrics.forEach((metric, i) => {
      const x = PAGE.margin + (i * metricWidth);
      const innerWidth = metricWidth - 1;
      
      // Cell background
      this.content.push(`
        <rect fill="${COLORS.surface}" x="${x + (i > 0 ? 0.5 : 0)}" y="${this.currentY + 0.5}" 
          width="${innerWidth}" height="${metricHeight - 1}" rx="0"/>
      `);

      // Label
      this.content.push(`
        <text fill="${COLORS.textMuted}" x="${x + 12}" y="${this.currentY + 18}" 
          font-family="Inter, sans-serif" font-size="7" letter-spacing="0.5">
          ${this.escapeXml(metric.label.toUpperCase())}
        </text>
      `);

      // Value
      this.content.push(`
        <text fill="${metric.color || COLORS.text}" x="${x + 12}" y="${this.currentY + 38}" 
          font-family="Inter, sans-serif" font-size="14" font-weight="600">
          ${this.escapeXml(metric.value)}
        </text>
      `);

      // Sublabel
      if (metric.sublabel) {
        this.content.push(`
          <text fill="${COLORS.textMuted}" x="${x + 12}" y="${this.currentY + 50}" 
            font-family="Inter, sans-serif" font-size="8">
            ${this.escapeXml(metric.sublabel)}
          </text>
        `);
      }
    });

    this.currentY += metricHeight + 20;
  }

  addSection(title: string) {
    if (this.currentY > PAGE.height - 100) this.newPage();
    
    // Cyan left border accent
    this.content.push(`
      <rect fill="${COLORS.primary}" x="${PAGE.margin}" y="${this.currentY}" width="2" height="14"/>
      <text fill="${COLORS.primary}" x="${PAGE.margin + 10}" y="${this.currentY + 11}" 
        font-family="Inter, sans-serif" font-size="8" font-weight="bold" letter-spacing="1.5">
        ${this.escapeXml(title.toUpperCase())}
      </text>
    `);
    this.currentY += 25;
  }

  addCard(title: string, items: { label: string; value: string; status?: string }[]) {
    if (this.currentY > PAGE.height - 150) this.newPage();
    
    const cardHeight = 25 + (items.length * 22);
    
    // Card background
    this.content.push(`
      <rect fill="${COLORS.surface}" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${cardHeight}" rx="0"/>
      <rect fill="none" stroke="${COLORS.border}" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth}" height="${cardHeight}" rx="0"/>
    `);

    // Card title
    this.content.push(`
      <text fill="${COLORS.text}" x="${PAGE.margin + 15}" y="${this.currentY + 18}" 
        font-family="Inter, sans-serif" font-size="10" font-weight="500">
        ${this.escapeXml(title)}
      </text>
    `);

    // Items
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
      if (item.status) {
        const statusColor = item.status === 'completed' ? COLORS.success : 
                          item.status === 'in_progress' ? COLORS.primary : COLORS.textMuted;
        this.content.push(`
          <rect fill="${statusColor}33" x="${PAGE.margin + PAGE.contentWidth - 80}" y="${itemY - 10}" 
            width="65" height="14" rx="0"/>
          <text fill="${statusColor}" x="${PAGE.margin + PAGE.contentWidth - 47}" y="${itemY - 1}" 
            font-family="Inter, sans-serif" font-size="7" text-anchor="middle" font-weight="bold">
            ${this.escapeXml(item.status === 'completed' ? 'CONCLUÍDO' : item.status === 'in_progress' ? 'EM ANDAMENTO' : 'PENDENTE')}
          </text>
        `);
      }
      itemY += 22;
    });

    this.currentY += cardHeight + 15;
  }

  addProgressBar(label: string, progress: number, completed: number, total: number) {
    if (this.currentY > PAGE.height - 60) this.newPage();

    const barWidth = 200;
    const barHeight = 6;
    const filledWidth = (progress / 100) * barWidth;

    // Card
    this.content.push(`
      <rect fill="${COLORS.surface}" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth / 3 - 5}" height="50" rx="0"/>
      <rect fill="none" stroke="${COLORS.border}" x="${PAGE.margin}" y="${this.currentY}" 
        width="${PAGE.contentWidth / 3 - 5}" height="50" rx="0"/>
    `);

    // Label
    this.content.push(`
      <text fill="${COLORS.textMuted}" x="${PAGE.margin + 12}" y="${this.currentY + 15}" 
        font-family="Inter, sans-serif" font-size="7" letter-spacing="0.5">
        ${this.escapeXml(label.toUpperCase())}
      </text>
    `);

    // Value
    this.content.push(`
      <text fill="${COLORS.text}" x="${PAGE.margin + 12}" y="${this.currentY + 32}" 
        font-family="Inter, sans-serif" font-size="16" font-weight="300">
        ${progress}%
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.margin + 50}" y="${this.currentY + 32}" 
        font-family="Inter, sans-serif" font-size="8">
        ${completed}/${total} etapas
      </text>
    `);
  }

  addText(text: string, size = 10, color = COLORS.text) {
    if (this.currentY > PAGE.height - 50) this.newPage();
    
    // Word wrap for long text
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

  addSpace(height = 15) {
    this.currentY += height;
  }

  addStagesFlow(stages: { title: string; status: string }[]) {
    if (this.currentY > PAGE.height - 80) this.newPage();

    const stageWidth = PAGE.contentWidth / Math.min(stages.length, 5);
    
    stages.slice(0, 5).forEach((stage, i) => {
      const x = PAGE.margin + (i * stageWidth);
      const statusColor = stage.status === 'completed' ? COLORS.success : 
                         stage.status === 'in_progress' ? COLORS.primary : COLORS.textMuted;

      // Stage box
      this.content.push(`
        <rect fill="${COLORS.surface}" x="${x}" y="${this.currentY}" 
          width="${stageWidth - 2}" height="35" rx="0"/>
        <rect fill="none" stroke="${COLORS.border}" x="${x}" y="${this.currentY}" 
          width="${stageWidth - 2}" height="35" rx="0"/>
      `);

      // Status indicator
      this.content.push(`
        <circle fill="${statusColor}" cx="${x + 12}" cy="${this.currentY + 12}" r="4"/>
      `);

      // Stage name
      this.content.push(`
        <text fill="${statusColor}" x="${x + 22}" y="${this.currentY + 15}" 
          font-family="Inter, sans-serif" font-size="7" font-weight="500" letter-spacing="0.3">
          ${this.escapeXml(stage.title.toUpperCase().substring(0, 12))}
        </text>
        <text fill="${COLORS.textMuted}" x="${x + 10}" y="${this.currentY + 28}" 
          font-family="Inter, sans-serif" font-size="6">
          ${stage.status === 'completed' ? 'Concluída' : stage.status === 'in_progress' ? 'Em andamento' : 'Aguardando'}
        </text>
      `);
    });

    this.currentY += 50;
  }

  private newPage() {
    this.addFooter();
    this.pageNumber++;
    this.content.push(`</svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE.width} ${PAGE.height}">`);
    this.content.push(`<rect fill="${COLORS.background}" x="0" y="0" width="${PAGE.width}" height="${PAGE.height}"/>`);
    this.currentY = PAGE.margin;
  }

  private addFooter() {
    this.content.push(`
      <line x1="${PAGE.margin}" y1="${PAGE.height - 35}" x2="${PAGE.width - PAGE.margin}" y2="${PAGE.height - 35}" 
        stroke="${COLORS.border}" stroke-width="0.5"/>
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${PAGE.height - 20}" 
        font-family="Inter, sans-serif" font-size="7">
        SQUAD /// FILM
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.width - PAGE.margin}" y="${PAGE.height - 20}" 
        font-family="Inter, sans-serif" font-size="7" text-anchor="end">
        Página ${this.pageNumber}
      </text>
    `);
  }

  generate(): string {
    this.addFooter();
    return `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE.width} ${PAGE.height}">
        ${this.content.join("")}
      </svg>`;
  }
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

    const pdf = new PortalPDFGenerator();

    if (type === "project" && id) {
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

      // Header with badges
      pdf.addPortalHeader(
        project.name,
        project.client_name || 'Cliente',
        project.status,
        project.template || 'custom',
        currentStageName,
        project.has_payment_block || false
      );

      // Metrics Grid
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
          sublabel: project.due_date ? "Previsão inicial" : "Em definição"
        },
        { 
          label: "Responsável", 
          value: project.owner_name || "—",
          color: COLORS.primary,
          sublabel: "Squad Film"
        },
      ]);

      // Progress section
      pdf.addSection("VISÃO GERAL");
      pdf.addProgressBar("Progresso", progress, completedStages, totalStages);
      pdf.addSpace(60);

      // Stages flow
      if (allStages.length > 0) {
        pdf.addSection("FLUXO DE PRODUÇÃO");
        pdf.addStagesFlow(allStages.map(s => ({
          title: s.title || STAGE_NAMES[s.stage_key] || s.stage_key,
          status: s.status
        })));
      }

      // Briefing
      if (project.description) {
        pdf.addSection("RESUMO EXECUTIVO");
        pdf.addText(project.description.substring(0, 800), 9, COLORS.textDim);
      }

    } else if (type === "report_360") {
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
      const avgHealth = allProjects.length > 0 
        ? Math.round(allProjects.reduce((sum, p) => sum + (p.health_score || 0), 0) / allProjects.length)
        : 0;

      pdf.addPortalHeader(
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

      pdf.addPortalHeader(
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

      pdf.addPortalHeader(
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

    // Generate SVG content
    const svgContent = pdf.generate();

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
