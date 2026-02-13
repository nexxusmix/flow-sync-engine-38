/**
 * export-pdf - Edge Function unificada para exportação de PDFs
 * 
 * Suporta:
 * - project: Relatório de projeto individual
 * - report_360: Relatório 360 executivo
 * - tasks: Quadro de tarefas
 * - finance: Relatório financeiro
 * - portal: Portal do cliente (acesso via token)
 * - project_overview: Visão geral de projetos
 * 
 * Retorna signed URL válida por 30 minutos
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Design System Colors
const COLORS = {
  background: "#050505",
  surface: "#0a0a0a",
  surfaceAlt: "#0D0D0D",
  border: "#1a1a1a",
  primary: "#06b6d4",
  text: "#FFFFFF",
  textMuted: "#737373",
  textDim: "#9ca3af",
  success: "#22c55e",
  warning: "#eab308",
  error: "#ef4444",
};

interface ExportInput {
  type: "project" | "report_360" | "tasks" | "finance" | "portal" | "project_overview";
  id?: string;
  period?: string;
  token?: string;
  filters?: Record<string, unknown>;
}

interface ExportResult {
  success: boolean;
  signed_url?: string;
  public_url?: string;
  storage_path?: string;
  file_name?: string;
  expires_at?: string;
  error?: string;
}

// Utility functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string | Date | null): string {
  if (!date) return "—";
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPeriodDates(period: string): { start: Date; end: Date; label: string } {
  const end = new Date();
  const start = new Date();
  let label = "";
  
  switch (period) {
    case "1m": start.setMonth(start.getMonth() - 1); label = "1 Mês"; break;
    case "3m": start.setMonth(start.getMonth() - 3); label = "3 Meses"; break;
    case "6m": start.setMonth(start.getMonth() - 6); label = "6 Meses"; break;
    case "1y": start.setFullYear(start.getFullYear() - 1); label = "1 Ano"; break;
    default: start.setMonth(start.getMonth() - 3); label = "3 Meses";
  }
  
  return { start, end, label };
}

// PDF Base Template with premium styling
function generatePDFHtml(params: {
  title: string;
  subtitle?: string;
  dateRange?: string;
  refCode: string;
  content: string;
  footerLeft?: string;
  footerRight?: string;
}): string {
  const { title, subtitle, dateRange, refCode, content, footerLeft, footerRight } = params;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    @page { size: A4; margin: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .page-break { page-break-before: always; }
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: ${COLORS.background};
      color: ${COLORS.text};
      font-size: 11px;
      line-height: 1.5;
    }
    
    .pdf-container {
      max-width: 1100px;
      margin: 0 auto;
      background: ${COLORS.background};
      min-height: 100vh;
      padding: 40px;
      position: relative;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid ${COLORS.border};
    }
    
    .header-left h1 {
      font-size: 28px;
      font-weight: 300;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .header-left .date-range {
      font-size: 13px;
      color: ${COLORS.textMuted};
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .period-badge {
      padding: 8px 16px;
      font-size: 11px;
      font-weight: 500;
      background: ${COLORS.text};
      color: ${COLORS.background};
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1px;
      margin-bottom: 40px;
      background: ${COLORS.border};
    }
    
    .kpi-grid-4 { grid-template-columns: repeat(4, 1fr); }
    .kpi-grid-6 { grid-template-columns: repeat(6, 1fr); }
    
    .kpi-card {
      background: ${COLORS.surface};
      padding: 20px;
    }
    
    .kpi-label {
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: ${COLORS.textMuted};
      margin-bottom: 8px;
    }
    
    .kpi-value {
      font-size: 28px;
      font-weight: 300;
      letter-spacing: -1px;
    }
    
    .kpi-value.success { color: ${COLORS.success}; }
    .kpi-value.primary { color: ${COLORS.primary}; }
    .kpi-value.error { color: ${COLORS.error}; }
    .kpi-value.warning { color: ${COLORS.warning}; }
    
    /* Section Headers */
    .section-header {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: ${COLORS.primary};
      border-left: 3px solid ${COLORS.primary};
      padding-left: 12px;
      margin: 32px 0 20px 0;
    }
    
    /* Cards */
    .card {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      padding: 24px;
      margin-bottom: 16px;
    }
    
    .card-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    
    /* Tables */
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${COLORS.textMuted};
      background: ${COLORS.surface};
      border-bottom: 1px solid ${COLORS.border};
    }
    
    .table td {
      padding: 12px 16px;
      font-size: 11px;
      border-bottom: 1px solid ${COLORS.border};
      color: ${COLORS.text};
    }
    
    .table tr:hover td {
      background: ${COLORS.surfaceAlt};
    }
    
    /* Status Badges */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 4px;
    }
    
    .badge-success { background: ${COLORS.success}20; color: ${COLORS.success}; border: 1px solid ${COLORS.success}40; }
    .badge-warning { background: ${COLORS.warning}20; color: ${COLORS.warning}; border: 1px solid ${COLORS.warning}40; }
    .badge-error { background: ${COLORS.error}20; color: ${COLORS.error}; border: 1px solid ${COLORS.error}40; }
    .badge-primary { background: ${COLORS.primary}20; color: ${COLORS.primary}; border: 1px solid ${COLORS.primary}40; }
    .badge-muted { background: ${COLORS.textMuted}20; color: ${COLORS.textMuted}; border: 1px solid ${COLORS.textMuted}40; }
    
    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: ${COLORS.border};
      margin-bottom: 24px;
    }
    
    .summary-item {
      background: ${COLORS.surface};
      padding: 20px;
      text-align: center;
    }
    
    .summary-value {
      font-size: 32px;
      font-weight: 300;
      margin-bottom: 4px;
    }
    
    .summary-label {
      font-size: 10px;
      color: ${COLORS.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    /* Timeline */
    .timeline {
      position: relative;
      padding-left: 24px;
    }
    
    .timeline::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 8px;
      bottom: 8px;
      width: 1px;
      background: ${COLORS.border};
    }
    
    .timeline-item {
      position: relative;
      margin-bottom: 16px;
    }
    
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 6px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: ${COLORS.primary};
      border: 2px solid ${COLORS.background};
    }
    
    .timeline-date {
      font-size: 9px;
      color: ${COLORS.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    
    .timeline-title {
      font-size: 12px;
      font-weight: 500;
    }
    
    /* Footer */
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 16px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid ${COLORS.border};
      background: ${COLORS.background};
      font-size: 10px;
    }
    
    .footer-left {
      color: ${COLORS.textMuted};
    }
    
    .footer-right {
      text-align: right;
    }
    
    .footer-right .restricted {
      color: ${COLORS.textMuted};
      margin-bottom: 2px;
    }
    
    .footer-right .ref-code {
      color: ${COLORS.primary};
      font-weight: 500;
    }
    
    /* Chart placeholders */
    .chart-area {
      background: ${COLORS.surfaceAlt};
      border: 1px solid ${COLORS.border};
      height: 200px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 20px;
      gap: 8px;
    }
    
    .chart-bar {
      width: 24px;
      background: linear-gradient(to top, ${COLORS.primary}, ${COLORS.primary}80);
      border-radius: 4px 4px 0 0;
    }
    
    .donut-chart {
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: conic-gradient(
        ${COLORS.primary} 0deg 270deg,
        ${COLORS.border} 270deg 360deg
      );
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }
    
    .donut-inner {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: ${COLORS.surface};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .donut-value {
      font-size: 28px;
      font-weight: 300;
      color: ${COLORS.text};
    }
    
    .donut-label {
      font-size: 9px;
      color: ${COLORS.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    /* Print button for mobile */
    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 12px 20px;
      background: ${COLORS.primary};
      color: #fff;
      font-size: 14px;
      font-weight: 500;
    }
    .print-bar button {
      padding: 8px 24px;
      background: #fff;
      color: ${COLORS.background};
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    @media print {
      .print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="print-bar" id="printBar">
    <span>Relatório pronto</span>
    <button onclick="window.print()">📄 Salvar como PDF</button>
  </div>
  <div class="pdf-container" style="padding-top: 60px;">
    <header class="header">
      <div class="header-left">
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="subtitle" style="color: ${COLORS.textMuted}; font-size: 13px;">${escapeHtml(subtitle)}</p>` : ''}
        ${dateRange ? `<p class="date-range">${escapeHtml(dateRange)}</p>` : ''}
      </div>
      <div class="header-right">
        ${params.period ? `<span class="period-badge">${escapeHtml(params.period)}</span>` : ''}
      </div>
    </header>
    
    ${content}
    
    <footer class="footer">
      <div class="footer-left">
        ${footerLeft || 'POWERED BY <strong>SQUAD///FILM</strong>'}
      </div>
      <div class="footer-right">
        <div class="restricted">${footerRight || 'DOCUMENTO RESTRITO E CONFIDENCIAL'}</div>
        <div class="ref-code">Ref: ${escapeHtml(refCode)}</div>
      </div>
    </footer>
  </div>
  <script>
    // Auto-trigger print on desktop after content loads
    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      window.onload = function() {
        setTimeout(function() { window.print(); }, 600);
      };
    }
  </script>
</body>
</html>`;
}

// Generate Project PDF content
async function generateProjectContent(
  supabase: ReturnType<typeof createClient>,
  projectId: string
): Promise<{ html: string; title: string; slug: string }> {
  // NOTE: Avoid nested selects (requires FK relationships in PostgREST schema cache)
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`Projeto não encontrado: ${projectError?.message || "ID inválido"}`);
  }

  const [{ data: milestonesData, error: milestonesError }, { data: stagesData, error: stagesError }, { data: deliverablesData, error: deliverablesError }] =
    await Promise.all([
      supabase
        .from("payment_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true }),
      supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
      supabase
        .from("project_deliverables")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
    ]);

  if (milestonesError) console.warn("[export-pdf] Could not load payment_milestones:", milestonesError);
  if (stagesError) console.warn("[export-pdf] Could not load project_stages:", stagesError);
  if (deliverablesError) console.warn("[export-pdf] Could not load project_deliverables:", deliverablesError);

  const contractValue = Number(project.contract_value) || 0;
  const healthScore = project.health_score || 100;
  const stages = stagesData || [];
  const deliverables = deliverablesData || [];
  const milestones = milestonesData || [];

  const completedStages = stages.filter((s: any) => s.status === 'concluido').length;
  const progressPercent = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0;

  const paidMilestones = milestones.filter((m: any) => m.status === 'paid').reduce((sum: number, m: any) => sum + Number(m.amount || 0), 0);
  const paymentPercent = contractValue > 0 ? Math.round((paidMilestones / contractValue) * 100) : 0;

  const content = `
    <div class="kpi-grid kpi-grid-4">
      <div class="kpi-card">
        <div class="kpi-label">Valor do Contrato</div>
        <div class="kpi-value">${formatCurrency(contractValue)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Saúde do Projeto</div>
        <div class="kpi-value ${healthScore >= 80 ? 'success' : healthScore >= 50 ? 'warning' : 'error'}">${healthScore}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Progresso</div>
        <div class="kpi-value primary">${progressPercent}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Pagamento</div>
        <div class="kpi-value">${paymentPercent}%</div>
      </div>
    </div>

    <div class="section-header">CRONOGRAMA DE ETAPAS</div>
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Etapa</th>
            <th>Status</th>
            <th>Início</th>
            <th>Fim Previsto</th>
          </tr>
        </thead>
        <tbody>
          ${stages.map((s: any) => `
            <tr>
              <td><strong>${escapeHtml(s.name)}</strong></td>
              <td>
                <span class="badge ${s.status === 'concluido' ? 'badge-success' : s.status === 'em_andamento' ? 'badge-primary' : 'badge-muted'}">
                  ${s.status === 'concluido' ? 'Concluído' : s.status === 'em_andamento' ? 'Em Andamento' : 'Pendente'}
                </span>
              </td>
              <td>${formatDate(s.start_date)}</td>
              <td>${formatDate(s.end_date)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${deliverables.length > 0 ? `
      <div class="section-header">ENTREGAS</div>
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Entrega</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Versão</th>
            </tr>
          </thead>
          <tbody>
            ${deliverables.slice(0, 10).map((d: any) => `
              <tr>
                <td>${escapeHtml(d.title)}</td>
                <td style="text-transform: uppercase; color: ${COLORS.textMuted}; font-size: 10px;">${escapeHtml(d.type || 'outro')}</td>
                <td>
                  <span class="badge ${d.status === 'aprovado' || d.status === 'entregue' ? 'badge-success' : d.status === 'revisao' ? 'badge-warning' : 'badge-muted'}">
                    ${escapeHtml(d.status || 'rascunho')}
                  </span>
                </td>
                <td>v${d.version || 1}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    ${milestones.length > 0 ? `
      <div class="section-header">CONDIÇÕES FINANCEIRAS</div>
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Parcela</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${milestones.map((m: any) => `
              <tr>
                <td>${escapeHtml(m.description || 'Parcela')}</td>
                <td><strong>${formatCurrency(Number(m.amount) || 0)}</strong></td>
                <td>${formatDate(m.due_date)}</td>
                <td>
                  <span class="badge ${m.status === 'paid' ? 'badge-success' : m.status === 'overdue' ? 'badge-error' : 'badge-muted'}">
                    ${m.status === 'paid' ? 'Pago' : m.status === 'overdue' ? 'Vencido' : 'Pendente'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
  `;

  return {
    html: content,
    title: project.name || 'Projeto',
    slug: generateSlug(project.name || 'projeto'),
  };
}

// Generate Report 360 content
async function generateReport360Content(supabase: ReturnType<typeof createClient>, period: string): Promise<{ html: string; title: string; slug: string }> {
  const { start, end, label } = getPeriodDates(period);

  // NOTE: Avoid nested selects here too; missing FK relationships can crash the whole export.
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: false });

  if (projectsError) {
    console.warn("[export-pdf] Could not load projects for report_360:", projectsError);
  }

  const projectList = projects || [];

  // Calculate metrics
  const totalProjects = projectList.length;
  const activeProjects = projectList.filter(p => p.status === 'active').length;
  const delayedProjects = projectList.filter(p => p.status === 'delayed' || p.status === 'atrasado').length;
  const completedProjects = projectList.filter(p => p.status === 'completed' || p.status === 'delivered').length;
  
  const avgHealth = projectList.length > 0 
    ? Math.round(projectList.reduce((sum, p) => sum + (p.health_score || 100), 0) / projectList.length)
    : 100;

  const totalValue = projectList.reduce((sum, p) => sum + (Number(p.contract_value) || 0), 0);

  // On-time percentage calculation
  const projectsWithDeadline = projectList.filter(p => p.due_date);
  const onTimeCount = projectsWithDeadline.filter(p => {
    if (p.status === 'completed' || p.status === 'delivered') return true;
    return new Date(p.due_date) >= new Date();
  }).length;
  const onTimePercent = projectsWithDeadline.length > 0 
    ? Math.round((onTimeCount / projectsWithDeadline.length) * 100)
    : 100;

  const content = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Entregues</div>
        <div class="kpi-value success">${completedProjects}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Abertos</div>
        <div class="kpi-value">${activeProjects}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Atrasados</div>
        <div class="kpi-value ${delayedProjects > 0 ? 'error' : ''}">${delayedProjects}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">No Prazo</div>
        <div class="kpi-value ${onTimePercent >= 80 ? 'success' : onTimePercent >= 50 ? 'warning' : 'error'}">${onTimePercent}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Saúde Média</div>
        <div class="kpi-value ${avgHealth >= 80 ? 'success' : avgHealth >= 50 ? 'warning' : 'error'}">${avgHealth}%</div>
      </div>
    </div>

    <div class="card-grid">
      <div class="card">
        <div class="section-header" style="margin-top: 0;">Evolução por Mês</div>
        <div class="chart-area">
          ${Array(6).fill(0).map((_, i) => `<div class="chart-bar" style="height: ${20 + Math.random() * 150}px;"></div>`).join('')}
        </div>
        <div style="display: flex; gap: 24px; margin-top: 16px; font-size: 10px; color: ${COLORS.textMuted};">
          <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: ${COLORS.success}; border-radius: 50%;"></span> ENTREGUES</span>
          <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: ${COLORS.primary}; border-radius: 50%;"></span> ABERTOS</span>
          <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: ${COLORS.error}; border-radius: 50%;"></span> ATRASADOS</span>
        </div>
      </div>
      
      <div class="card">
        <div class="section-header" style="margin-top: 0;">Distribuição por Status</div>
        <div class="donut-chart">
          <div class="donut-inner">
            <div class="donut-value">${activeProjects}</div>
            <div class="donut-label">ATIVOS</div>
          </div>
        </div>
        <div style="margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
            <span style="color: ${COLORS.textMuted};">Em Andamento</span>
            <span style="color: ${COLORS.primary};">(${activeProjects})</span>
          </div>
        </div>
      </div>
    </div>

    <div class="section-header">RESUMO DO PERÍODO</div>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="summary-value">${totalProjects}</div>
        <div class="summary-label">Total Projetos</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${completedProjects}</div>
        <div class="summary-label">Finalizados</div>
      </div>
      <div class="summary-item">
        <div class="summary-value primary">${activeProjects}</div>
        <div class="summary-label">Em Andamento</div>
      </div>
      <div class="summary-item">
        <div class="summary-value ${delayedProjects > 0 ? 'error' : ''}">${delayedProjects}</div>
        <div class="summary-label">Com Atraso</div>
      </div>
    </div>

    ${projectList.length > 0 ? `
      <div class="section-header">ENTREGAS (GRADE DE DETALHES)</div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
        ${projectList.slice(0, 4).map((p: any) => {
          const stage = p.stages?.[0];
          return `
            <div class="card" style="padding: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <span style="font-size: 9px; color: ${COLORS.primary}; text-transform: uppercase; letter-spacing: 0.05em;">
                  ${escapeHtml(p.template || 'projeto')}
                </span>
                <span class="badge ${p.status === 'active' ? 'badge-success' : p.status === 'delayed' ? 'badge-error' : 'badge-muted'}">
                  ${p.status === 'active' ? 'ABERTO' : p.status === 'delayed' ? 'ATRASADO' : 'BRIEFING'}
                </span>
              </div>
              <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${escapeHtml(p.name)}</div>
              <div style="font-size: 10px; color: ${COLORS.textMuted};">${formatDate(p.due_date)} • ${escapeHtml(p.template || 'Projeto')}</div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}

    <div class="card-grid" style="margin-top: 24px;">
      <div>
        <div class="section-header" style="margin-top: 0;">Timeline Forecast</div>
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-date">Jan 2026</div>
            <div class="timeline-title">Início das captações de obra</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-date">Fev 2026</div>
            <div class="timeline-title">Primeira revisão institucional</div>
          </div>
        </div>
      </div>
      
      <div>
        <div class="section-header" style="margin-top: 0; color: ${COLORS.success};">Condições Financeiras</div>
        <div class="card" style="background: ${COLORS.surfaceAlt};">
          <div style="font-size: 10px; color: ${COLORS.textMuted}; margin-bottom: 4px;">INVESTIMENTO TOTAL</div>
          <div style="font-size: 24px; font-weight: 300; margin-bottom: 16px;">${formatCurrency(totalValue)}</div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: ${COLORS.textMuted};">SINAL</span>
              <span style="color: ${COLORS.success};">PAGO</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: ${COLORS.textMuted};">P1 (FEV)</span>
              <span style="color: ${COLORS.warning};">EM ABERTO</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: ${COLORS.textMuted};">P2 (MAR)</span>
              <span>PENDENTE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    html: content,
    title: 'RELATÓRIO 360°',
    slug: `relatorio-360-${period}`,
  };
}

// Generate Finance PDF content
async function generateFinanceContent(supabase: ReturnType<typeof createClient>, period: string): Promise<{ html: string; title: string; slug: string }> {
  const { start, end, label } = getPeriodDates(period);

  const [{ data: revenues }, { data: expenses }, { data: contracts }] = await Promise.all([
    supabase.from('revenues').select('*').order('due_date', { ascending: true }),
    supabase.from('expenses').select('*').order('due_date', { ascending: true }),
    supabase.from('contracts').select('*, payment_milestones(*)'),
  ]);

  const revenueList = revenues || [];
  const expenseList = expenses || [];
  const today = new Date().toISOString().split('T')[0];

  const receivedRevenue = revenueList.filter(r => r.status === 'received').reduce((sum, r) => sum + Number(r.amount), 0);
  const paidExpenses = expenseList.filter(e => e.status === 'paid').reduce((sum, e) => sum + Number(e.amount), 0);
  const currentBalance = receivedRevenue - paidExpenses;
  const pendingRevenue = revenueList.filter(r => r.status !== 'received').reduce((sum, r) => sum + Number(r.amount), 0);
  const overdueAmount = revenueList.filter(r => r.status !== 'received' && r.due_date < today).reduce((sum, r) => sum + Number(r.amount), 0);

  const marginPercent = receivedRevenue > 0 ? Math.round(((receivedRevenue - paidExpenses) / receivedRevenue) * 100) : 0;

  const content = `
    <div class="kpi-grid kpi-grid-4">
      <div class="kpi-card">
        <div class="kpi-label">Fluxo de Caixa (Proj.)</div>
        <div class="kpi-value primary">${formatCurrency(currentBalance)}</div>
        <div style="font-size: 10px; color: ${COLORS.success}; margin-top: 4px;">↑ +12% vs. mês anterior</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Receita Confirmada</div>
        <div class="kpi-value">${formatCurrency(receivedRevenue)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">A Receber</div>
        <div class="kpi-value">${formatCurrency(pendingRevenue)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Inadimplência</div>
        <div class="kpi-value ${overdueAmount > 0 ? 'error' : ''}">${formatCurrency(overdueAmount)}</div>
      </div>
    </div>

    <div class="card-grid">
      <div class="card">
        <div class="section-header" style="margin-top: 0;">Forecast Cash Flow (30/60/90)</div>
        <div style="text-align: right; margin-bottom: 8px;">
          <span class="badge badge-success">${formatCurrency(currentBalance + pendingRevenue)} Target</span>
        </div>
        <div class="chart-area" style="height: 180px;">
          ${Array(12).fill(0).map((_, i) => `<div class="chart-bar" style="height: ${30 + i * 12}px;"></div>`).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 10px; color: ${COLORS.textMuted};">
          <span>HOJE</span>
          <span>+30 DIAS</span>
          <span>+60 DIAS</span>
          <span>+90 DIAS</span>
        </div>
      </div>
      
      <div class="card">
        <div class="section-header" style="margin-top: 0;">Margem de Lucro / Tipo</div>
        <div class="donut-chart" style="background: conic-gradient(${COLORS.primary} 0deg ${marginPercent * 3.6}deg, ${COLORS.border} ${marginPercent * 3.6}deg 360deg);">
          <div class="donut-inner">
            <div class="donut-value">${marginPercent}%</div>
            <div class="donut-label">MARGEM MÉDIA</div>
          </div>
        </div>
        <div style="margin-top: 16px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
            <span style="color: ${COLORS.textMuted};">Publicidade</span>
            <span style="color: ${COLORS.primary};">45%</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0;">
            <span style="color: ${COLORS.textMuted};">Cinema/Doc</span>
            <span>18%</span>
          </div>
        </div>
      </div>
    </div>

    ${overdueAmount > 0 ? `
      <div class="section-header" style="color: ${COLORS.error};">Inadimplência (Overdue)</div>
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Projeto</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            ${revenueList.filter(r => r.status !== 'received' && r.due_date < today).slice(0, 5).map(r => `
              <tr>
                <td>${escapeHtml(r.client_name || 'Cliente')}</td>
                <td>${escapeHtml(r.description || 'Projeto')}</td>
                <td style="color: ${COLORS.error};">${formatDate(r.due_date)}</td>
                <td><strong>${formatCurrency(Number(r.amount))}</strong></td>
                <td><span class="badge badge-error">NOTIFICAR</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <div class="section-header">Resumo Financeiro</div>
    <div class="card" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <div>
        <div style="font-size: 10px; color: ${COLORS.textMuted}; margin-bottom: 4px;">FATURAMENTO YTD</div>
        <div style="font-size: 24px; font-weight: 300;">${formatCurrency(receivedRevenue)}</div>
        <div style="font-size: 10px; color: ${COLORS.textMuted}; margin-top: 2px;">META: 85% Atingida</div>
      </div>
      <div>
        <div style="font-size: 10px; color: ${COLORS.textMuted}; margin-bottom: 4px;">CUSTOS OPERACIONAIS</div>
        <div style="font-size: 24px; font-weight: 300;">${formatCurrency(paidExpenses)}</div>
        <div style="font-size: 10px; color: ${COLORS.success}; margin-top: 2px;">Dentro do prazo</div>
      </div>
    </div>
  `;

  return {
    html: content,
    title: 'RELATÓRIO FINANCEIRO',
    slug: `financeiro-${period}`,
  };
}

// Generate Tasks PDF content
async function generateTasksContent(supabase: ReturnType<typeof createClient>): Promise<{ html: string; title: string; slug: string }> {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, project:projects(name)')
    .order('created_at', { ascending: false })
    .limit(50);

  const taskList = tasks || [];

  const columns = {
    briefing: taskList.filter(t => t.status === 'todo' || t.status === 'briefing'),
    planning: taskList.filter(t => t.status === 'planning'),
    execution: taskList.filter(t => t.status === 'in_progress' || t.status === 'execution'),
    review: taskList.filter(t => t.status === 'review'),
    delivered: taskList.filter(t => t.status === 'done' || t.status === 'delivered'),
  };

  const content = `
    <div class="kpi-grid kpi-grid-4">
      <div class="kpi-card">
        <div class="kpi-label">Entregas da Semana</div>
        <div class="kpi-value">03</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Em Execução</div>
        <div class="kpi-value primary">05</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Próximos Deadlines</div>
        <div class="kpi-value error">48h</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Capacidade</div>
        <div class="kpi-value success">85%</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 32px;">
      ${Object.entries(columns).map(([key, items]) => {
        const labels: Record<string, string> = {
          briefing: '01. BRIEFING',
          planning: '02. PLANNING',
          execution: '03. EXECUTION',
          review: '04. REVIEW',
          delivered: '05. DELIVERED',
        };
        const isHighlight = key === 'execution';
        
        return `
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: ${isHighlight ? COLORS.primary + '20' : COLORS.surface}; border: 1px solid ${isHighlight ? COLORS.primary : COLORS.border}; margin-bottom: 8px;">
              <span style="font-size: 9px; font-weight: 600; color: ${isHighlight ? COLORS.primary : COLORS.textMuted}; letter-spacing: 0.05em;">${labels[key]}</span>
              <span style="font-size: 10px; color: ${COLORS.textMuted};">${items.length}</span>
            </div>
            ${items.slice(0, 3).map(t => `
              <div class="card" style="padding: 12px; margin-bottom: 8px;">
                <div style="font-size: 9px; color: ${COLORS.textMuted}; margin-bottom: 4px;">#${t.id?.slice(0, 8)}</div>
                <div style="font-size: 11px; font-weight: 500; margin-bottom: 4px;">${escapeHtml(t.title || 'Tarefa')}</div>
                <div style="font-size: 9px; color: ${COLORS.textMuted};">${escapeHtml(t.project?.name || '')}</div>
              </div>
            `).join('')}
            ${items.length === 0 ? `
              <div style="padding: 20px; text-align: center; color: ${COLORS.textMuted}; font-size: 10px; border: 1px dashed ${COLORS.border};">
                COLUNA VAZIA
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>

    <div class="card-grid">
      <div class="card">
        <div class="section-header" style="margin-top: 0;">Desempenho Semanal</div>
        <div style="text-align: right; margin-bottom: 8px; font-size: 10px; color: ${COLORS.textMuted};">MÉDIA: 1.2 ENTREGAS/DIA</div>
        <div class="chart-area" style="height: 120px;">
          ${['SEG', 'TER', 'QUA', 'QUI', 'SEX'].map((_, i) => `<div class="chart-bar" style="height: ${40 + Math.random() * 60}px;"></div>`).join('')}
        </div>
      </div>
      
      <div class="card">
        <div class="section-header" style="margin-top: 0; color: ${COLORS.error};">Urgências & Alertas</div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${COLORS.error};"></span>
              <span style="font-weight: 500; font-size: 11px;">Deadline Crítico</span>
            </div>
            <div style="font-size: 10px; color: ${COLORS.textMuted}; padding-left: 14px;">Plano de captura precisa ser aprovado até às 17:00 de hoje.</div>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${COLORS.primary};"></span>
              <span style="font-weight: 500; font-size: 11px;">Revisão Pendente</span>
            </div>
            <div style="font-size: 10px; color: ${COLORS.textMuted}; padding-left: 14px;">Aguardando feedback do cliente sobre o rascunho institucional.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return {
    html: content,
    title: 'WORKFLOW DE PROJETOS',
    slug: 'workflow-tarefas',
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const input = (await req.json()) as ExportInput;
    const { type, id, period = "3m", token } = input;

    console.log(`[export-pdf] Starting export: type=${type}, id=${id}, period=${period}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate authentication
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    
    if (type === 'portal' && token) {
      // Portal access - validate token
      const { data: portalLink, error: portalError } = await supabase
        .from('portal_links')
        .select('*, project:projects(*)')
        .eq('share_token', token)
        .eq('is_active', true)
        .single();

      if (portalError || !portalLink) {
        throw new Error('Token de portal inválido ou expirado');
      }
    } else if (authHeader) {
      // Internal user access
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.log('[export-pdf] Auth warning:', authError?.message || 'No user');
      } else {
        userId = user.id;
      }
    }

    // Generate content based on type
    let htmlContent: string;
    let title: string;
    let slug: string;
    let dateRange: string | undefined;
    let refCode: string;

    const { start, end, label } = getPeriodDates(period);
    dateRange = `${formatDate(start)} — ${formatDate(end)}`;

    switch (type) {
      case 'project':
        if (!id) throw new Error('ID do projeto é obrigatório');
        const projectResult = await generateProjectContent(supabase, id);
        htmlContent = projectResult.html;
        title = projectResult.title;
        slug = projectResult.slug;
        refCode = `PRJ-${new Date().getFullYear()}-${id.slice(0, 4).toUpperCase()}`;
        break;

      case 'report_360':
        const report360Result = await generateReport360Content(supabase, period);
        htmlContent = report360Result.html;
        title = report360Result.title;
        slug = report360Result.slug;
        refCode = `360-R-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
        break;

      case 'finance':
        const financeResult = await generateFinanceContent(supabase, period);
        htmlContent = financeResult.html;
        title = financeResult.title;
        slug = financeResult.slug;
        refCode = `FIN-${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
        break;

      case 'tasks':
        const tasksResult = await generateTasksContent(supabase);
        htmlContent = tasksResult.html;
        title = tasksResult.title;
        slug = tasksResult.slug;
        dateRange = `Operação Time Criativo — ${new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`;
        refCode = `WF-${new Date().getFullYear()}-WK${Math.ceil(new Date().getDate() / 7)}`;
        break;

      case 'project_overview':
        const overviewResult = await generateReport360Content(supabase, period);
        htmlContent = overviewResult.html;
        title = 'COMMAND CENTER / PROJETOS';
        slug = 'command-center-projetos';
        refCode = `PM-DASH-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        break;

      case 'portal':
        if (!id && !token) throw new Error('ID ou token do portal é obrigatório');
        const portalProjectId = id || '';
        const projectResult2 = await generateProjectContent(supabase, portalProjectId);
        htmlContent = projectResult2.html;
        title = projectResult2.title;
        slug = `portal-${projectResult2.slug}`;
        refCode = `PRT-${new Date().getFullYear()}-${portalProjectId.slice(0, 4).toUpperCase()}`;
        break;

      default:
        throw new Error(`Tipo de exportação não suportado: ${type}`);
    }

    // Generate full HTML
    const fullHtml = generatePDFHtml({
      title,
      subtitle: type === 'project_overview' ? `Relatório Consolidado • ${dateRange}` : undefined,
      dateRange: type !== 'project_overview' ? dateRange : undefined,
      refCode,
      content: htmlContent,
      period: label,
    });

    // Generate file path
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const timestamp = now.getTime();
    const fileName = `${slug}-${timestamp}.html`;
    const storagePath = `exports/${type}/${yearMonth}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(storagePath, fullHtml, {
        contentType: 'text/html',
        upsert: true,
      });

    if (uploadError) {
      console.error('[export-pdf] Upload error:', uploadError);
      throw new Error(`Falha ao salvar arquivo: ${uploadError.message}`);
    }

    // Generate signed URL (30 minutes expiration)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('exports')
      .createSignedUrl(storagePath, 1800); // 30 minutes

    if (signedUrlError) {
      console.error('[export-pdf] Signed URL error:', signedUrlError);
      // Fallback to public URL
      const { data: publicUrlData } = supabase.storage.from('exports').getPublicUrl(storagePath);
      
      // Track export
      await supabase.from('pdf_exports').insert({
        type,
        entity_id: id || null,
        entity_name: title,
        storage_path: storagePath,
        file_name: fileName,
        content_type: 'text/html',
        status: 'completed',
        created_by: userId,
        created_by_portal_token: token || null,
        completed_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          public_url: publicUrlData.publicUrl,
          storage_path: storagePath,
          file_name: fileName,
        } as ExportResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expiresAt = new Date(Date.now() + 1800 * 1000).toISOString();

    // Track export
    await supabase.from('pdf_exports').insert({
      type,
      entity_id: id || null,
      entity_name: title,
      storage_path: storagePath,
      file_name: fileName,
      content_type: 'text/html',
      signed_url: signedUrlData.signedUrl,
      signed_url_expires_at: expiresAt,
      status: 'completed',
      created_by: userId,
      created_by_portal_token: token || null,
      completed_at: new Date().toISOString(),
    });

    console.log(`[export-pdf] Export completed: ${storagePath}`);

    return new Response(
      JSON.stringify({
        success: true,
        signed_url: signedUrlData.signedUrl,
        public_url: signedUrlData.signedUrl,
        storage_path: storagePath,
        file_name: fileName,
        expires_at: expiresAt,
      } as ExportResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[export-pdf] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido ao exportar PDF",
      } as ExportResult),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
