import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Design System Colors (SQUAD Film)
const COLORS = {
  background: "#000000",
  primary: "#00A3D3",
  text: "#FFFFFF",
  textMuted: "#737373",
  border: "#1a1a1a",
  success: "#22c55e",
  warning: "#eab308",
  error: "#ef4444",
};

// PDF dimensions (A4)
const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 50,
  contentWidth: 495.28,
};

interface ExportInput {
  type: "report_360" | "tasks" | "project" | "project_overview";
  id?: string;
  period?: string;
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
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("pt-BR");
  } catch {
    return "-";
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

// Simple SVG-based PDF generator
class SimplePDFGenerator {
  private content: string[] = [];
  private currentY = PAGE.margin;
  private pageNumber = 1;

  addCover(title: string, subtitle: string) {
    this.content.push(`
      <rect fill="${COLORS.background}" x="0" y="0" width="${PAGE.width}" height="${PAGE.height}"/>
      <text fill="${COLORS.primary}" x="${PAGE.width/2}" y="${PAGE.height/2 - 40}" 
        font-family="Helvetica, sans-serif" font-size="32" font-weight="bold" text-anchor="middle">
        ${this.escapeXml(title)}
      </text>
      <text fill="${COLORS.text}" x="${PAGE.width/2}" y="${PAGE.height/2 + 10}" 
        font-family="Helvetica, sans-serif" font-size="16" text-anchor="middle">
        ${this.escapeXml(subtitle)}
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.width/2}" y="${PAGE.height/2 + 50}" 
        font-family="Helvetica, sans-serif" font-size="12" text-anchor="middle">
        Gerado em ${formatDate(new Date().toISOString())}
      </text>
      <line x1="${PAGE.width/2 - 100}" y1="${PAGE.height/2 - 80}" x2="${PAGE.width/2 + 100}" y2="${PAGE.height/2 - 80}" 
        stroke="${COLORS.primary}" stroke-width="2"/>
    `);
    this.currentY = PAGE.margin;
  }

  addSection(title: string) {
    if (this.currentY > PAGE.height - 100) this.newPage();
    
    this.content.push(`
      <text fill="${COLORS.primary}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="Helvetica, sans-serif" font-size="14" font-weight="bold">
        ${this.escapeXml(title.toUpperCase())}
      </text>
      <line x1="${PAGE.margin}" y1="${this.currentY + 10}" x2="${PAGE.width - PAGE.margin}" y2="${this.currentY + 10}" 
        stroke="${COLORS.border}" stroke-width="1"/>
    `);
    this.currentY += 35;
  }

  addKPIRow(kpis: Array<{ label: string; value: string | number; color?: string }>) {
    if (this.currentY > PAGE.height - 100) this.newPage();
    
    const kpiWidth = PAGE.contentWidth / kpis.length;
    
    kpis.forEach((kpi, i) => {
      const x = PAGE.margin + (i * kpiWidth) + kpiWidth / 2;
      this.content.push(`
        <rect fill="${COLORS.border}" x="${PAGE.margin + (i * kpiWidth) + 5}" y="${this.currentY - 20}" 
          width="${kpiWidth - 10}" height="60" rx="8"/>
        <text fill="${kpi.color || COLORS.text}" x="${x}" y="${this.currentY + 5}" 
          font-family="Helvetica, sans-serif" font-size="20" font-weight="bold" text-anchor="middle">
          ${this.escapeXml(String(kpi.value))}
        </text>
        <text fill="${COLORS.textMuted}" x="${x}" y="${this.currentY + 25}" 
          font-family="Helvetica, sans-serif" font-size="10" text-anchor="middle">
          ${this.escapeXml(kpi.label)}
        </text>
      `);
    });
    
    this.currentY += 70;
  }

  addText(text: string, size = 11, color = COLORS.text) {
    if (this.currentY > PAGE.height - 50) this.newPage();
    
    this.content.push(`
      <text fill="${color}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="Helvetica, sans-serif" font-size="${size}">
        ${this.escapeXml(text)}
      </text>
    `);
    this.currentY += size + 8;
  }

  addListItem(text: string, bullet = "•") {
    if (this.currentY > PAGE.height - 50) this.newPage();
    
    this.content.push(`
      <text fill="${COLORS.primary}" x="${PAGE.margin}" y="${this.currentY}" 
        font-family="Helvetica, sans-serif" font-size="10">
        ${bullet}
      </text>
      <text fill="${COLORS.text}" x="${PAGE.margin + 15}" y="${this.currentY}" 
        font-family="Helvetica, sans-serif" font-size="10">
        ${this.escapeXml(text)}
      </text>
    `);
    this.currentY += 18;
  }

  addTableRow(cols: string[], isHeader = false) {
    if (this.currentY > PAGE.height - 50) this.newPage();
    
    const colWidth = PAGE.contentWidth / cols.length;
    
    if (isHeader) {
      this.content.push(`
        <rect fill="${COLORS.border}" x="${PAGE.margin}" y="${this.currentY - 12}" 
          width="${PAGE.contentWidth}" height="20" rx="4"/>
      `);
    }
    
    cols.forEach((col, i) => {
      this.content.push(`
        <text fill="${isHeader ? COLORS.primary : COLORS.text}" x="${PAGE.margin + (i * colWidth) + 5}" y="${this.currentY}" 
          font-family="Helvetica, sans-serif" font-size="${isHeader ? 9 : 10}" font-weight="${isHeader ? 'bold' : 'normal'}">
          ${this.escapeXml(col.substring(0, 30))}
        </text>
      `);
    });
    
    this.currentY += isHeader ? 25 : 20;
  }

  addSpace(height = 20) {
    this.currentY += height;
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
      <line x1="${PAGE.margin}" y1="${PAGE.height - 40}" x2="${PAGE.width - PAGE.margin}" y2="${PAGE.height - 40}" 
        stroke="${COLORS.border}" stroke-width="0.5"/>
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${PAGE.height - 25}" 
        font-family="Helvetica, sans-serif" font-size="8">
        Gerado por SQUAD Hub
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.width - PAGE.margin}" y="${PAGE.height - 25}" 
        font-family="Helvetica, sans-serif" font-size="8" text-anchor="end">
        Página ${this.pageNumber}
      </text>
    `);
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  generate(): string {
    this.addFooter();
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
      const delayed = allProjects.filter(p => p.due_date && new Date(p.due_date) < new Date() && p.status !== "completed").length;
      const totalValue = allProjects.reduce((sum, p) => sum + (p.contract_value || 0), 0);
      const avgHealth = allProjects.length > 0 
        ? Math.round(allProjects.reduce((sum, p) => sum + (p.health_score || 0), 0) / allProjects.length)
        : 0;

      pdf.addCover("RELATÓRIO 360°", `${start.toLocaleDateString("pt-BR")} — ${end.toLocaleDateString("pt-BR")}`);
      
      pdf.addSection("MÉTRICAS GERAIS");
      pdf.addKPIRow([
        { label: "Entregues", value: delivered, color: COLORS.success },
        { label: "Em Andamento", value: open, color: COLORS.primary },
        { label: "Atrasados", value: delayed, color: COLORS.error },
      ]);
      pdf.addKPIRow([
        { label: "Total de Projetos", value: allProjects.length },
        { label: "Valor Total", value: formatCurrency(totalValue) },
        { label: "Saúde Média", value: `${avgHealth}%` },
      ]);

      pdf.addSpace(20);
      pdf.addSection("PROJETOS NO PERÍODO");
      pdf.addTableRow(["Projeto", "Cliente", "Status", "Entrega"], true);
      
      allProjects.slice(0, 15).forEach(p => {
        const statusLabel = p.status === "completed" ? "Concluído" : p.status === "active" ? "Ativo" : p.status;
        pdf.addTableRow([p.name, p.client_name || "-", statusLabel, formatDate(p.due_date)]);
      });

    } else if (type === "tasks") {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      const allTasks = tasks || [];
      const pending = allTasks.filter(t => t.status !== "done").length;
      const done = allTasks.filter(t => t.status === "done").length;
      const overdue = allTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length;

      pdf.addCover("MINHAS TAREFAS", formatDate(new Date().toISOString()));

      pdf.addSection("RESUMO");
      pdf.addKPIRow([
        { label: "Total", value: allTasks.length },
        { label: "Pendentes", value: pending, color: COLORS.warning },
        { label: "Concluídas", value: done, color: COLORS.success },
        { label: "Vencidas", value: overdue, color: COLORS.error },
      ]);

      const groupedByStatus = {
        today: allTasks.filter(t => t.status === "today"),
        week: allTasks.filter(t => t.status === "week"),
        backlog: allTasks.filter(t => t.status === "backlog"),
        done: allTasks.filter(t => t.status === "done").slice(0, 10),
      };

      if (groupedByStatus.today.length > 0) {
        pdf.addSection("HOJE");
        groupedByStatus.today.forEach(t => pdf.addListItem(t.title));
      }

      if (groupedByStatus.week.length > 0) {
        pdf.addSection("ESTA SEMANA");
        groupedByStatus.week.forEach(t => pdf.addListItem(t.title));
      }

      if (groupedByStatus.backlog.length > 0) {
        pdf.addSection("BACKLOG");
        groupedByStatus.backlog.slice(0, 15).forEach(t => pdf.addListItem(t.title));
      }

    } else if (type === "project" && id) {
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

      pdf.addCover(project.name, project.client_name || "Projeto");

      pdf.addSection("INFORMAÇÕES GERAIS");
      pdf.addText(`Cliente: ${project.client_name || "-"}`);
      pdf.addText(`Template: ${project.template || "-"}`);
      pdf.addText(`Status: ${project.status}`);
      pdf.addText(`Etapa Atual: ${project.stage_current || "-"}`);
      pdf.addText(`Data de Entrega: ${formatDate(project.due_date)}`);
      pdf.addText(`Valor do Contrato: ${formatCurrency(project.contract_value || 0)}`);
      pdf.addText(`Health Score: ${project.health_score || 0}%`);

      if (project.description) {
        pdf.addSpace(10);
        pdf.addSection("BRIEFING");
        pdf.addText(project.description.substring(0, 500) + (project.description.length > 500 ? "..." : ""));
      }

      if (stages && stages.length > 0) {
        pdf.addSpace(10);
        pdf.addSection("ETAPAS");
        pdf.addTableRow(["Etapa", "Status"], true);
        stages.forEach(s => {
          const statusLabel = s.status === "completed" ? "Concluída" : s.status === "in_progress" ? "Em andamento" : "Não iniciada";
          pdf.addTableRow([s.title, statusLabel]);
        });
      }

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

      pdf.addCover("VISÃO GERAL DE PROJETOS", formatDate(new Date().toISOString()));

      pdf.addSection("RESUMO EXECUTIVO");
      pdf.addKPIRow([
        { label: "Total Ativos", value: allProjects.length },
        { label: "Em Produção", value: active, color: COLORS.success },
        { label: "Pausados", value: paused, color: COLORS.warning },
        { label: "Valor Total", value: formatCurrency(totalValue) },
      ]);

      pdf.addSpace(20);
      pdf.addSection("LISTA DE PROJETOS");
      pdf.addTableRow(["Projeto", "Cliente", "Etapa", "Saúde"], true);
      
      allProjects.slice(0, 20).forEach(p => {
        pdf.addTableRow([
          p.name.substring(0, 25),
          (p.client_name || "-").substring(0, 20),
          p.stage_current || "-",
          `${p.health_score || 0}%`
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
