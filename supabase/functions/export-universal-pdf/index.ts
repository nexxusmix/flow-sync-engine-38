import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Design System Colors (SQUAD Film - Premium Dark Theme)
const COLORS = {
  background: "#050505",
  surface: "#0a0a0a",
  border: "#1a1a1a",
  primary: "#06b6d4", // cyan-500
  text: "#FFFFFF",
  textMuted: "#737373", // gray-500
  textDim: "#9ca3af", // gray-400
  success: "#22c55e", // green-500
  warning: "#eab308", // yellow-500
  error: "#ef4444", // red-500
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

function formatDateFull(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function markdownToHtml(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/^##\s*(.+)$/gm, '<h3 class="section-title">$1</h3>')
    .replace(/^#\s*(.+)$/gm, '<h2 class="main-title">$1</h2>')
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)(?=\s*<li>)/g, '$1')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="deliverable-list">$1</ul>')
    .replace(/<\/ul>\s*<ul class="deliverable-list">/g, '')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[#-]+\s*/gm, '')
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => {
      if (p.includes('<h2') || p.includes('<h3') || p.includes('<ul')) return p;
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
}

/**
 * Premium Report 360 HTML Generator
 * Matches the editorial design specification
 */
function generateReport360HTML(
  metrics: {
    delivered: number;
    open: number;
    delayed: number;
    onTimePercentage: number;
    avgHealthScore: number;
    totalValue: number;
  },
  monthlyData: Array<{ month: string; delivered: number; open: number; delayed: number }>,
  statusDistribution: Array<{ status: string; count: number }>,
  projects: any[],
  milestones: any[],
  dateRange: { start: Date; end: Date },
  period: string
): string {
  const periodLabels: Record<string, string> = {
    "1m": "1 Mês",
    "3m": "3 Meses",
    "6m": "6 Meses",
    "1y": "1 Ano",
  };

  // Get a sample project for detailed display (most recent active)
  const sampleProject = projects.find(p => p.status === 'active') || projects[0];
  const projectMilestones = milestones.filter(m => m.project_id === sampleProject?.id);

  // Calculate chart data
  const maxMonthValue = Math.max(...monthlyData.flatMap(d => [d.delivered, d.open, d.delayed]), 1);
  
  return `<!DOCTYPE html>
<html class="dark" lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>Relatório 360° - SQUAD FILM</title>
  <link href="https://fonts.googleapis.com" rel="preconnect"/>
  <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background-color: ${COLORS.background};
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
      font-size: 32px;
      font-weight: 300;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    
    .header-left h1 span {
      color: ${COLORS.primary};
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
    
    .period-tabs {
      display: flex;
      gap: 8px;
    }
    
    .period-tab {
      padding: 8px 16px;
      font-size: 11px;
      font-weight: 500;
      border: 1px solid ${COLORS.border};
      background: transparent;
      color: ${COLORS.textMuted};
      cursor: pointer;
    }
    
    .period-tab.active {
      background: ${COLORS.text};
      color: ${COLORS.background};
      border-color: ${COLORS.text};
    }
    
    .export-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: ${COLORS.primary};
      color: ${COLORS.background};
      font-size: 11px;
      font-weight: 600;
      border: none;
      cursor: pointer;
    }
    
    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
      margin-bottom: 40px;
    }
    
    .kpi-card {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      padding: 20px;
      text-align: center;
    }
    
    .kpi-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: ${COLORS.textMuted};
      margin-bottom: 12px;
    }
    
    .kpi-value {
      font-size: 32px;
      font-weight: 300;
      letter-spacing: -1px;
    }
    
    .kpi-value.success { color: ${COLORS.success}; }
    .kpi-value.primary { color: ${COLORS.primary}; }
    .kpi-value.error { color: ${COLORS.error}; }
    .kpi-value.warning { color: ${COLORS.warning}; }
    
    /* Charts Section */
    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 40px;
    }
    
    .chart-card {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      padding: 24px;
    }
    
    .chart-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${COLORS.textMuted};
      margin-bottom: 24px;
    }
    
    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .bar-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .bar-label {
      width: 60px;
      font-size: 10px;
      color: ${COLORS.textMuted};
    }
    
    .bar-container {
      flex: 1;
      display: flex;
      gap: 4px;
    }
    
    .bar {
      height: 20px;
      min-width: 2px;
      transition: width 0.3s ease;
    }
    
    .bar.delivered { background: ${COLORS.success}; }
    .bar.open { background: ${COLORS.primary}; }
    .bar.delayed { background: ${COLORS.error}; }
    
    .chart-legend {
      display: flex;
      gap: 24px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid ${COLORS.border};
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10px;
      color: ${COLORS.textMuted};
    }
    
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .legend-dot.delivered { background: ${COLORS.success}; }
    .legend-dot.open { background: ${COLORS.primary}; }
    .legend-dot.delayed { background: ${COLORS.error}; }
    
    /* Donut Chart */
    .donut-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .donut-wrapper {
      position: relative;
      width: 140px;
      height: 140px;
      margin-bottom: 24px;
    }
    
    .donut-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    
    .donut-ring {
      fill: none;
      stroke: ${COLORS.border};
      stroke-width: 20;
    }
    
    .donut-segment {
      fill: none;
      stroke-width: 20;
      stroke-linecap: round;
    }
    
    .donut-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }
    
    .donut-total {
      font-size: 32px;
      font-weight: 300;
      color: ${COLORS.text};
    }
    
    .donut-legend {
      width: 100%;
    }
    
    .donut-legend-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid ${COLORS.border};
      font-size: 11px;
    }
    
    .donut-legend-item:last-child {
      border-bottom: none;
    }
    
    .donut-legend-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: ${COLORS.textMuted};
    }
    
    .donut-legend-value {
      font-weight: 600;
      color: ${COLORS.text};
    }
    
    /* Summary Section */
    .summary-card {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      padding: 24px;
      margin-bottom: 40px;
    }
    
    .summary-header {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${COLORS.primary};
      border-left: 3px solid ${COLORS.primary};
      padding-left: 12px;
      margin-bottom: 24px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-value {
      font-size: 36px;
      font-weight: 300;
      margin-bottom: 8px;
    }
    
    .summary-value.success { color: ${COLORS.success}; }
    .summary-value.primary { color: ${COLORS.primary}; }
    .summary-value.error { color: ${COLORS.error}; }
    
    .summary-label {
      font-size: 11px;
      color: ${COLORS.textMuted};
    }
    
    /* Project Scope */
    .scope-section {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      padding: 24px;
      margin-bottom: 40px;
    }
    
    .scope-header {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    
    .scope-header span {
      color: ${COLORS.primary};
    }
    
    .scope-text {
      font-size: 12px;
      color: ${COLORS.textDim};
      line-height: 1.8;
      max-width: 900px;
    }
    
    .specs-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 32px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid ${COLORS.border};
    }
    
    .specs-title {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: ${COLORS.textMuted};
      margin-bottom: 16px;
    }
    
    .specs-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .spec-tag {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: ${COLORS.background};
      border: 1px solid ${COLORS.border};
      font-size: 10px;
      color: ${COLORS.textDim};
    }
    
    .spec-tag .material-symbols-outlined {
      font-size: 14px;
      color: ${COLORS.primary};
    }
    
    /* Production Flow */
    .flow-section {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      padding: 24px;
      margin-bottom: 40px;
    }
    
    .flow-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .flow-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${COLORS.primary};
      border-left: 3px solid ${COLORS.primary};
      padding-left: 12px;
    }
    
    .flow-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: ${COLORS.primary}15;
      border: 1px solid ${COLORS.primary}33;
      font-size: 9px;
      font-weight: 600;
      color: ${COLORS.primary};
    }
    
    .flow-badge .dot {
      width: 6px;
      height: 6px;
      background: ${COLORS.primary};
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .flow-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    .flow-step {
      padding: 16px;
      background: ${COLORS.background};
      border: 1px solid ${COLORS.border};
    }
    
    .flow-step.active {
      border-color: ${COLORS.primary}44;
      background: ${COLORS.primary}08;
    }
    
    .flow-step-title {
      font-size: 10px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .flow-step-status {
      font-size: 9px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .flow-step-status.active { color: ${COLORS.primary}; }
    .flow-step-status.waiting { color: ${COLORS.warning}; }
    .flow-step-status.pending { color: ${COLORS.textMuted}; }
    
    .flow-step-desc {
      font-size: 9px;
      color: ${COLORS.textMuted};
      line-height: 1.5;
    }
    
    .flow-progress {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid ${COLORS.border};
      font-size: 10px;
      color: ${COLORS.textMuted};
    }
    
    .flow-progress span {
      color: ${COLORS.primary};
      font-weight: 600;
    }
    
    /* Deliverables */
    .deliverables-section {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      padding: 24px;
      margin-bottom: 40px;
    }
    
    .deliverables-header {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${COLORS.primary};
      border-left: 3px solid ${COLORS.primary};
      padding-left: 12px;
      margin-bottom: 24px;
    }
    
    .deliverables-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    .deliverable-card {
      padding: 16px;
      background: ${COLORS.background};
      border: 1px solid ${COLORS.border};
    }
    
    .deliverable-type {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: ${COLORS.primary};
      margin-bottom: 8px;
    }
    
    .deliverable-title {
      font-size: 11px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .deliverable-specs {
      font-size: 9px;
      color: ${COLORS.textMuted};
    }
    
    /* Financial Section */
    .financial-section {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      padding: 24px;
      margin-bottom: 40px;
    }
    
    .financial-header {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${COLORS.primary};
      border-left: 3px solid ${COLORS.primary};
      padding-left: 12px;
      margin-bottom: 24px;
    }
    
    .pix-info {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: ${COLORS.background};
      border: 1px solid ${COLORS.border};
      margin-bottom: 24px;
    }
    
    .pix-icon {
      font-size: 24px;
      color: ${COLORS.primary};
    }
    
    .pix-details {
      flex: 1;
    }
    
    .pix-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: ${COLORS.textMuted};
      margin-bottom: 4px;
    }
    
    .pix-key {
      font-size: 12px;
      font-weight: 500;
      color: ${COLORS.primary};
    }
    
    .pix-holder {
      text-align: right;
    }
    
    .pix-holder-label {
      font-size: 9px;
      color: ${COLORS.textMuted};
      margin-bottom: 4px;
    }
    
    .pix-holder-name {
      font-size: 11px;
      font-weight: 500;
    }
    
    .milestones-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .milestone-card {
      padding: 16px;
      background: ${COLORS.background};
      border: 1px solid ${COLORS.border};
    }
    
    .milestone-card.paid {
      border-left: 3px solid ${COLORS.success};
    }
    
    .milestone-card.overdue {
      border-left: 3px solid ${COLORS.error};
    }
    
    .milestone-card.pending {
      border-left: 3px solid ${COLORS.textMuted};
    }
    
    .milestone-status {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    
    .milestone-status.paid { color: ${COLORS.success}; }
    .milestone-status.overdue { color: ${COLORS.error}; }
    .milestone-status.pending { color: ${COLORS.textMuted}; }
    
    .milestone-title {
      font-size: 11px;
      font-weight: 500;
      margin-bottom: 12px;
    }
    
    .milestone-amount {
      font-size: 18px;
      font-weight: 300;
      margin-bottom: 8px;
    }
    
    .milestone-date {
      font-size: 9px;
      color: ${COLORS.textMuted};
    }
    
    .contract-notes {
      padding: 16px;
      background: ${COLORS.background};
      border: 1px solid ${COLORS.border};
    }
    
    .contract-notes-title {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: ${COLORS.textMuted};
      margin-bottom: 12px;
    }
    
    .contract-note {
      font-size: 10px;
      color: ${COLORS.textMuted};
      margin-bottom: 8px;
      line-height: 1.5;
    }
    
    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 24px;
      border-top: 1px solid ${COLORS.border};
    }
    
    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .footer-title {
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.1em;
    }
    
    .footer-tagline {
      font-size: 10px;
      color: ${COLORS.textMuted};
    }
    
    .footer-powered {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 9px;
      color: ${COLORS.textMuted};
    }
    
    .footer-powered span {
      color: ${COLORS.primary};
      font-weight: 600;
      letter-spacing: 0.2em;
    }
    
    /* Print Button */
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: ${COLORS.primary};
      color: ${COLORS.background};
      border: none;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      z-index: 1000;
    }
    
    .print-button:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">
    <span class="material-symbols-outlined" style="font-size: 18px;">picture_as_pdf</span>
    Exportar PDF
  </button>

  <div class="pdf-container">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <h1>Relatório <span>360°</span></h1>
        <p class="date-range">${formatDateFull(dateRange.start)} — ${formatDateFull(dateRange.end)}</p>
      </div>
      <div class="header-right no-print">
        <div class="period-tabs">
          ${Object.entries(periodLabels).map(([key, label]) => 
            `<button class="period-tab ${key === period ? 'active' : ''}">${label}</button>`
          ).join('')}
        </div>
      </div>
    </header>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Entregues</div>
        <div class="kpi-value success">${metrics.delivered}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Abertos</div>
        <div class="kpi-value primary">${metrics.open}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Atrasados</div>
        <div class="kpi-value error">${metrics.delayed}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">No Prazo</div>
        <div class="kpi-value">${metrics.onTimePercentage}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Saúde Média</div>
        <div class="kpi-value success">${metrics.avgHealthScore}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Valor Total</div>
        <div class="kpi-value primary">${formatCurrency(metrics.totalValue)}</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-grid">
      <!-- Bar Chart -->
      <div class="chart-card">
        <div class="chart-title">Evolução por Mês</div>
        <div class="bar-chart">
          ${monthlyData.slice(-6).map(d => `
            <div class="bar-row">
              <div class="bar-label">${d.month}</div>
              <div class="bar-container">
                <div class="bar delivered" style="width: ${Math.max(2, (d.delivered / maxMonthValue) * 100)}%"></div>
                <div class="bar open" style="width: ${Math.max(2, (d.open / maxMonthValue) * 100)}%"></div>
                ${d.delayed > 0 ? `<div class="bar delayed" style="width: ${Math.max(2, (d.delayed / maxMonthValue) * 100)}%"></div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="chart-legend">
          <div class="legend-item"><div class="legend-dot delivered"></div>Entregues</div>
          <div class="legend-item"><div class="legend-dot open"></div>Abertos</div>
          <div class="legend-item"><div class="legend-dot delayed"></div>Atrasados</div>
        </div>
      </div>

      <!-- Donut Chart -->
      <div class="chart-card">
        <div class="chart-title">Distribuição por Status</div>
        <div class="donut-container">
          <div class="donut-wrapper">
            <svg class="donut-svg" viewBox="0 0 100 100">
              <circle class="donut-ring" cx="50" cy="50" r="40"/>
              ${(() => {
                const total = statusDistribution.reduce((sum, s) => sum + s.count, 0) || 1;
                let offset = 0;
                const circumference = 2 * Math.PI * 40;
                return statusDistribution.map(s => {
                  const percent = s.count / total;
                  const dash = percent * circumference;
                  const color = s.status === 'active' ? COLORS.primary : s.status === 'completed' ? COLORS.success : COLORS.textMuted;
                  const segment = `<circle class="donut-segment" cx="50" cy="50" r="40" stroke="${color}" stroke-dasharray="${dash} ${circumference}" stroke-dashoffset="${-offset}"/>`;
                  offset += dash;
                  return segment;
                }).join('');
              })()}
            </svg>
            <div class="donut-center">
              <div class="donut-total">${metrics.open + metrics.delivered}</div>
            </div>
          </div>
          <div class="donut-legend">
            ${statusDistribution.map(s => {
              const label = s.status === 'active' ? 'Em Andamento' : s.status === 'completed' ? 'Finalizados' : s.status === 'paused' ? 'Pausados' : 'Arquivados';
              return `
                <div class="donut-legend-item">
                  <span class="donut-legend-label">${label}</span>
                  <span class="donut-legend-value">${s.count}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="summary-card">
      <div class="summary-header">Resumo do Período</div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-value">${metrics.delivered + metrics.open}</div>
          <div class="summary-label">Total</div>
        </div>
        <div class="summary-item">
          <div class="summary-value success">${metrics.delivered}</div>
          <div class="summary-label">Finalizados</div>
        </div>
        <div class="summary-item">
          <div class="summary-value primary">${metrics.open}</div>
          <div class="summary-label">Ativos</div>
        </div>
        <div class="summary-item">
          <div class="summary-value error">${metrics.delayed}</div>
          <div class="summary-label">Atraso</div>
        </div>
      </div>
    </div>

    ${sampleProject ? `
    <!-- Project Scope -->
    <div class="scope-section">
      <div class="scope-header">Escopo do Projeto: <span>${escapeHtml(sampleProject.name || '')}</span></div>
      <p class="scope-text">
        ${escapeHtml(sampleProject.description || 'Este projeto audiovisual visa registrar e transmitir a magnitude do empreendimento através de uma narrativa cinematográfica completa. A produção será conduzida pela SQUAD FILM, utilizando equipamentos de qualidade Cinema 4K e drone, abrangendo desde a captação até a finalização.')}
      </p>
      <div class="specs-grid">
        <div>
          <div class="specs-title">Especificações Técnicas</div>
          <div class="specs-list">
            <div class="spec-tag"><span class="material-symbols-outlined">videocam</span>CINEMA 4K Raw Capture</div>
            <div class="spec-tag"><span class="material-symbols-outlined">flight</span>DRONE 4K Aerial Coverage</div>
            <div class="spec-tag"><span class="material-symbols-outlined">palette</span>Professional COLOR GRADE</div>
            <div class="spec-tag"><span class="material-symbols-outlined">graphic_eq</span>Professional SOUND DESIGN</div>
          </div>
        </div>
        <div>
          <div class="specs-title">Módulos de Produção</div>
          <div class="specs-list">
            <div class="spec-tag"><span class="material-symbols-outlined">movie</span>Filmes Narrativos</div>
            <div class="spec-tag"><span class="material-symbols-outlined">campaign</span>Lançamento / Institucional</div>
            <div class="spec-tag"><span class="material-symbols-outlined">construction</span>Acompanhamento de Obra</div>
            <div class="spec-tag"><span class="material-symbols-outlined">share</span>Social Media Content</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Production Flow -->
    <div class="flow-section">
      <div class="flow-header">
        <div class="flow-title">Fluxo de Produção & Timeline</div>
        <div class="flow-badge"><div class="dot"></div>Squad Engine Active</div>
      </div>
      <div class="flow-grid">
        <div class="flow-step active">
          <div class="flow-step-title">Briefing & Estratégia</div>
          <div class="flow-step-status active">Em Andamento</div>
          <div class="flow-step-desc">Definição de escopo, objetivos e roteirização inicial.</div>
        </div>
        <div class="flow-step">
          <div class="flow-step-title">Pré-Produção</div>
          <div class="flow-step-status waiting">Aguardando</div>
          <div class="flow-step-desc">Planejamento de cronograma e recursos técnicos.</div>
        </div>
        <div class="flow-step">
          <div class="flow-step-title">Captação 4K</div>
          <div class="flow-step-status pending">Não Iniciada</div>
          <div class="flow-step-desc">Gravação profissional com equipamentos cinema.</div>
        </div>
        <div class="flow-step">
          <div class="flow-step-title">Edição & Grade</div>
          <div class="flow-step-status pending">Não Iniciada</div>
          <div class="flow-step-desc">Montagem, color grading e finalização.</div>
        </div>
      </div>
      <div class="flow-progress">Progresso Geral<span style="margin-left: 8px;">0/9 Etapas</span></div>
    </div>

    <!-- Deliverables -->
    <div class="deliverables-section">
      <div class="deliverables-header">Entregas Estruturadas (19 Itens)</div>
      <div class="deliverables-grid">
        <div class="deliverable-card">
          <div class="deliverable-type">01 / LANÇAMENTO</div>
          <div class="deliverable-title">Vídeo Principal</div>
          <div class="deliverable-specs">2:30m|Wide/Vert</div>
        </div>
        <div class="deliverable-card">
          <div class="deliverable-type">01 / INSTITUCIONAL</div>
          <div class="deliverable-title">Institucional Porto</div>
          <div class="deliverable-specs">3:00m|Wide/Vert</div>
        </div>
        <div class="deliverable-card">
          <div class="deliverable-type">01 / MANIFESTO</div>
          <div class="deliverable-title">Manifesto da Marca</div>
          <div class="deliverable-specs">2:00m|Wide/Vert</div>
        </div>
        <div class="deliverable-card">
          <div class="deliverable-type">10 / SOCIAL PILLS</div>
          <div class="deliverable-title">Pílulas Motion x10</div>
          <div class="deliverable-specs">60s|Vertical Only</div>
        </div>
      </div>
    </div>

    <!-- Financial -->
    <div class="financial-section">
      <div class="financial-header">Condições Financeiras & Fluxo</div>
      
      <div class="pix-info">
        <span class="material-symbols-outlined pix-icon">account_balance_wallet</span>
        <div class="pix-details">
          <div class="pix-label">Chave PIX (Nubank)</div>
          <div class="pix-key">squadfilmeo@gmail.com</div>
        </div>
        <div class="pix-holder">
          <div class="pix-holder-label">Titular da Conta</div>
          <div class="pix-holder-name">Matheus Filipe Alves</div>
        </div>
      </div>
      
      <div class="milestones-grid">
        ${projectMilestones.length > 0 ? projectMilestones.slice(0, 3).map(m => {
          const today = new Date().toISOString().split('T')[0];
          const isOverdue = m.status !== 'paid' && m.due_date < today;
          const statusClass = m.status === 'paid' ? 'paid' : isOverdue ? 'overdue' : 'pending';
          const statusLabel = m.status === 'paid' ? 'Quitado' : isOverdue ? 'Em Atraso' : 'Pendente';
          return `
            <div class="milestone-card ${statusClass}">
              <div class="milestone-status ${statusClass}">${statusLabel}</div>
              <div class="milestone-title">${escapeHtml(m.description || 'Parcela')}</div>
              <div class="milestone-amount">${formatCurrency(m.amount || 0)}</div>
              <div class="milestone-date">${m.status === 'paid' ? 'PAGAMENTO' : 'VENCIMENTO'}: ${formatDate(m.due_date).toUpperCase()}</div>
            </div>
          `;
        }).join('') : `
          <div class="milestone-card paid">
            <div class="milestone-status paid">Quitado</div>
            <div class="milestone-title">Sinal / Reserva</div>
            <div class="milestone-amount">${formatCurrency((sampleProject.contract_value || 15590) * 0.5)}</div>
            <div class="milestone-date">PAGAMENTO: 15 JAN 2026</div>
          </div>
          <div class="milestone-card overdue">
            <div class="milestone-status overdue">Em Atraso</div>
            <div class="milestone-title">Parcela 01</div>
            <div class="milestone-amount">${formatCurrency((sampleProject.contract_value || 15590) * 0.25)}</div>
            <div class="milestone-date">VENCIMENTO: 05 FEV 2026</div>
          </div>
          <div class="milestone-card pending">
            <div class="milestone-status pending">Pendente</div>
            <div class="milestone-title">Parcela 02</div>
            <div class="milestone-amount">${formatCurrency((sampleProject.contract_value || 15590) * 0.25)}</div>
            <div class="milestone-date">VENCIMENTO: 05 MAR 2026</div>
          </div>
        `}
      </div>
      
      <div class="contract-notes">
        <div class="contract-notes-title">Notas Contratuais</div>
        <div class="contract-note">• Direitos patrimoniais cedidos apenas após a quitação integral do projeto.</div>
        <div class="contract-note">• Rescisão unilateral exige aviso prévio de 30 dias corridos.</div>
        <div class="contract-note">• Em caso de rescisão sem justa causa, o valor de sinal não é reembolsável.</div>
        <div class="contract-note">• Foro eleito: Comarca de Anápolis/GO.</div>
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-brand">
        <div class="footer-title">Squad Film Studio</div>
        <div class="footer-tagline">Premium Visual Storytelling</div>
      </div>
      <div class="footer-powered">
        powered by <span>SQUAD///FILM</span>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Project HTML Generator (existing implementation)
 */
function generateProjectHTML(
  project: any,
  stages: any[],
  deliverables: any[],
  milestones: any[]
): string {
  const allStages = stages || [];
  const completedStages = allStages.filter(s => s.status === 'completed').length;
  const totalStages = allStages.length || 9;
  const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  const description = project.description || 'Este projeto audiovisual visa registrar e transmitir a magnitude do empreendimento através de uma narrativa cinematográfica completa.';
  const cleanDescription = markdownToHtml(description);

  const deliverablesList = (deliverables || []).map((d: any, i: number) => ({
    index: i + 1,
    title: d.title || `Entrega ${i + 1}`,
    description: d.description || 'Qualidade Cinema 4K. Formatos Wide e Vertical.',
    status: d.status || 'pending'
  }));
  
  if (deliverablesList.length === 0) {
    deliverablesList.push(
      { index: 1, title: "Vídeo Lançamento", description: "Até 02m30s. Qualidade Cinema 4K.", status: "in_progress" },
      { index: 2, title: "Institucional", description: "Até 03m00s. Wide e Vertical. Cinema 4K.", status: "pending" },
      { index: 3, title: "Pílulas Motion Social", description: "Até 60s cada. Vertical. Motion Graphics.", status: "pending" },
      { index: 4, title: "Acompanhamento de Obra", description: "Até 02m00s cada. Wide e Vertical.", status: "pending" }
    );
  }

  const milestonesData = (milestones || []).map((m: any) => ({
    description: m.description || 'Parcela',
    due_date: m.due_date,
    amount: m.amount || 0,
    status: m.status || 'pending'
  }));
  
  if (milestonesData.length === 0) {
    const totalValue = project.contract_value || 15590;
    milestonesData.push(
      { description: "Sinal - Reserva", due_date: "2026-01-15", amount: totalValue * 0.5, status: "paid" },
      { description: "Parcela 01", due_date: "2026-02-05", amount: totalValue * 0.25, status: "pending" },
      { description: "Parcela 02", due_date: "2026-03-05", amount: totalValue * 0.25, status: "pending" }
    );
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(project.name)} — Relatório Executivo</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
    
    @page { size: A4; margin: 15mm 20mm; }
    @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none !important; } .page-break { page-break-before: always; } }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: ${COLORS.background};
      color: ${COLORS.text};
      font-size: 11px;
      line-height: 1.6;
      font-weight: 400;
    }
    
    .container { max-width: 210mm; margin: 0 auto; padding: 20px; }
    .layout { display: grid; grid-template-columns: 180px 1fr; gap: 24px; }
    
    .sidebar { background: ${COLORS.surface}; border: 1px solid ${COLORS.border}; padding: 20px; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 8px; font-weight: 500; letter-spacing: 0.8px; text-transform: uppercase; margin-right: 6px; margin-bottom: 12px; }
    .badge-active { background: ${COLORS.primary}22; border: 1px solid ${COLORS.primary}44; color: ${COLORS.primary}; }
    .badge-blocked { background: ${COLORS.error}22; border: 1px solid ${COLORS.error}44; color: ${COLORS.error}; }
    
    .project-title { font-size: 16px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .client-name { font-size: 10px; color: ${COLORS.textMuted}; font-style: italic; margin-bottom: 16px; }
    .divider { height: 1px; background: ${COLORS.border}; margin: 16px 0; }
    
    .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .metric-item { margin-bottom: 8px; }
    .metric-label { font-size: 7px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; color: ${COLORS.textMuted}; margin-bottom: 4px; }
    .metric-value { font-size: 12px; font-weight: 500; }
    .metric-value.primary { color: ${COLORS.primary}; }
    .metric-value.success { color: ${COLORS.success}; }
    
    .progress-section { margin-top: 24px; }
    .progress-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .progress-label { font-size: 8px; font-weight: 500; letter-spacing: 0.5px; color: ${COLORS.textMuted}; }
    .progress-value { font-size: 9px; color: ${COLORS.text}; }
    .progress-bar { height: 4px; background: ${COLORS.border}; position: relative; }
    .progress-fill { height: 100%; background: ${COLORS.primary}; min-width: 2px; }
    
    .main-content { min-width: 0; }
    .section { margin-bottom: 24px; }
    .section-header { font-size: 9px; font-weight: 500; letter-spacing: 1.5px; color: ${COLORS.primary}; margin-bottom: 16px; }
    .card { background: ${COLORS.surface}; border: 1px solid ${COLORS.border}; padding: 20px; }
    .card-headline { font-size: 16px; font-weight: 500; margin-bottom: 16px; }
    .card-headline em { color: ${COLORS.primary}; font-style: italic; }
    
    .executive-content { color: ${COLORS.textDim}; font-size: 11px; line-height: 1.8; }
    .executive-content h2, .executive-content .main-title { font-size: 14px; font-weight: 500; color: ${COLORS.text}; margin: 20px 0 12px 0; }
    .executive-content h3, .executive-content .section-title { font-size: 12px; font-weight: 500; color: ${COLORS.primary}; margin: 16px 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .executive-content p { margin-bottom: 12px; }
    .executive-content ul, .executive-content .deliverable-list { margin: 12px 0; padding-left: 0; list-style: none; }
    .executive-content li { position: relative; padding-left: 16px; margin-bottom: 6px; color: ${COLORS.textMuted}; }
    .executive-content li::before { content: "•"; position: absolute; left: 0; color: ${COLORS.primary}; }
    .executive-content strong { font-weight: 500; color: ${COLORS.text}; }
    
    .scope-card { border-left: 3px solid ${COLORS.primary}66; }
    .scope-text { font-size: 10px; color: ${COLORS.textMuted}; line-height: 1.7; }
    
    .methodology-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 16px; }
    .methodology-title { font-size: 8px; font-weight: 500; letter-spacing: 1px; color: ${COLORS.primary}; margin-bottom: 10px; }
    .methodology-list { list-style: none; }
    .methodology-list li { font-size: 9px; color: ${COLORS.textMuted}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .deliverable-item { display: flex; align-items: center; padding: 12px 16px; background: ${COLORS.surface}; border: 1px solid ${COLORS.border}; margin-bottom: 4px; }
    .deliverable-index { font-size: 12px; color: ${COLORS.primary}; font-weight: 300; width: 32px; }
    .deliverable-content { flex: 1; }
    .deliverable-title { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }
    .deliverable-desc { font-size: 9px; color: ${COLORS.textMuted}; margin-top: 2px; }
    .deliverable-status { font-size: 7px; font-weight: 500; letter-spacing: 0.5px; }
    .status-completed { color: ${COLORS.success}; }
    .status-in_progress { color: ${COLORS.primary}; }
    .status-pending { color: ${COLORS.textMuted}; }
    .status-blocked { color: ${COLORS.error}; }
    
    .financial-table { width: 100%; border-collapse: collapse; background: ${COLORS.surface}; border: 1px solid ${COLORS.border}; }
    .financial-table th { padding: 12px 16px; font-size: 8px; font-weight: 500; letter-spacing: 0.8px; text-transform: uppercase; color: ${COLORS.textMuted}; background: ${COLORS.border}66; text-align: left; }
    .financial-table th:last-child { text-align: right; }
    .financial-table td { padding: 12px 16px; font-size: 10px; border-top: 1px solid ${COLORS.border}; }
    .financial-table td:last-child { text-align: right; font-weight: 500; }
    .amount-paid { color: ${COLORS.success}; }
    .amount-overdue { color: ${COLORS.error}; }
    .amount-pending { color: ${COLORS.text}; }
    .pix-info { font-size: 9px; color: ${COLORS.textMuted}; margin-top: 12px; letter-spacing: 0.3px; }
    
    .observations-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .observation-item { font-size: 9px; color: ${COLORS.textMuted}; margin-bottom: 8px; }
    
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid ${COLORS.border}; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-brand { font-size: 10px; font-weight: 500; letter-spacing: 2px; color: ${COLORS.textMuted}; }
    .footer-tagline { font-size: 8px; color: ${COLORS.textDim}; margin-top: 4px; }
    .footer-meta { text-align: right; font-size: 8px; color: ${COLORS.textMuted}; }
    
    .print-button { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: ${COLORS.primary}; color: ${COLORS.background}; border: none; font-size: 12px; font-weight: 500; cursor: pointer; z-index: 1000; }
    .print-button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Imprimir / Salvar PDF</button>
  
  <div class="container">
    <div class="layout">
      <aside class="sidebar">
        <div>
          <span class="badge badge-active">${project.status === 'active' ? 'ACTIVE' : (project.status || 'ACTIVE').toUpperCase()}</span>
          ${project.has_payment_block ? '<span class="badge badge-blocked">BLOQUEADO</span>' : ''}
        </div>
        
        <h1 class="project-title">${escapeHtml((project.name || '').substring(0, 18))}</h1>
        <p class="client-name">${escapeHtml(project.client_name || 'Cliente')}</p>
        
        <div class="divider"></div>
        
        <div class="metrics-grid">
          <div class="metric-item">
            <div class="metric-label">Valor do Contrato</div>
            <div class="metric-value primary">${formatCurrency(project.contract_value || 0)}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Saúde</div>
            <div class="metric-value success">${project.health_score || 100}%</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Entrega</div>
            <div class="metric-value">${formatDate(project.due_date)}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">Responsável</div>
            <div class="metric-value">${escapeHtml((project.owner_name || 'Squad Film').substring(0, 14))}</div>
          </div>
        </div>
        
        ${project.has_payment_block ? `
        <div style="margin-top: 20px; padding: 12px; background: ${COLORS.error}12; border: 1px solid ${COLORS.error}33;">
          <div style="font-size: 8px; font-weight: 500; color: ${COLORS.error}; letter-spacing: 0.5px; margin-bottom: 4px;">BLOQUEADO POR INADIMPLÊNCIA</div>
          <div style="font-size: 8px; color: ${COLORS.textMuted};">Fatura em atraso. Entrega final bloqueada até regularização.</div>
        </div>
        ` : ''}
        
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">PROGRESSO</span>
            <span class="progress-value">${progress}% (${completedStages}/${totalStages} etapas)</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.max(2, progress)}%"></div>
          </div>
        </div>
      </aside>
      
      <main class="main-content">
        <section class="section">
          <h2 class="section-header">01 — RESUMO EXECUTIVO</h2>
          <div class="card">
            <h3 class="card-headline">${escapeHtml(project.name)} — Narrativa Audiovisual <em>Completa</em>.</h3>
            <div class="executive-content">${cleanDescription}</div>
          </div>
        </section>
        
        <section class="section">
          <h2 class="section-header">02 — ESCOPO DETALHADO</h2>
          <div class="card scope-card">
            <p class="scope-text">
              2.1. O PRESENTE CONTRATO TEM POR OBJETO A PRESTAÇÃO DE SERVIÇOS DE PRODUÇÃO AUDIOVISUAL PARA O PROJETO "${escapeHtml((project.name || '').toUpperCase())}", VISANDO REGISTRAR E TRANSMITIR A MAGNITUDE DO EMPREENDIMENTO ATRAVÉS DE UMA NARRATIVA AUDIOVISUAL COMPLETA.
            </p>
          </div>
          
          <div class="methodology-grid">
            <div>
              <h4 class="methodology-title">METODOLOGIA TÉCNICA</h4>
              <ul class="methodology-list">
                <li>• Equipamentos Cinema 4K</li>
                <li>• Utilização de Drone 4K</li>
                <li>• Processo de Color Grade</li>
                <li>• Licensing Profissional</li>
              </ul>
            </div>
            <div>
              <h4 class="methodology-title">COMPROMISSOS SQUAD</h4>
              <ul class="methodology-list">
                <li>• Equipe de 02 Profissionais</li>
                <li>• Rigor no Cronograma</li>
                <li>• Identidade Industrial/Moderna</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section class="section">
          <h2 class="section-header">03 — ENTREGAS & FORMATOS</h2>
          ${deliverablesList.slice(0, 8).map(d => `
            <div class="deliverable-item">
              <span class="deliverable-index">${String(d.index).padStart(2, '0')}</span>
              <div class="deliverable-content">
                <div class="deliverable-title">${escapeHtml(d.title.substring(0, 40))}</div>
                <div class="deliverable-desc">${escapeHtml(d.description.substring(0, 55))}</div>
              </div>
              <span class="deliverable-status status-${d.status}">
                ${d.status === 'completed' ? 'CONCLUÍDO' : d.status === 'in_progress' ? 'EM ANDAMENTO' : d.status === 'blocked' ? 'BLOQUEADO' : 'PENDENTE'}
              </span>
            </div>
          `).join('')}
        </section>
        
        <section class="section">
          <h2 class="section-header">04 — CONDIÇÕES FINANCEIRAS</h2>
          <table class="financial-table">
            <thead>
              <tr>
                <th>Parcela</th>
                <th>Data</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${milestonesData.map(m => `
                <tr>
                  <td>${escapeHtml(m.description)}</td>
                  <td>${formatDate(m.due_date)}</td>
                  <td class="amount-${m.status}">${formatCurrency(m.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="pix-info">PAGAMENTO VIA PIX (SQUADFILMEO@GMAIL.COM) • BANCO NUBANK • TITULAR: MATHEUS FILIPE ALVES</p>
        </section>
        
        <section class="section">
          <h2 class="section-header">05 — OBSERVAÇÕES & TERMOS</h2>
          <div class="observations-grid">
            <div>
              <p class="observation-item">• Direitos patrimoniais cedidos após quitação.</p>
              <p class="observation-item">• Rescisão exige aviso prévio de 30 dias.</p>
              <p class="observation-item">• Sinal não devolvido em rescisão sem justa causa.</p>
            </div>
            <div>
              <p class="observation-item">• Foro: Comarca de Anápolis/GO.</p>
              <p class="observation-item">• Limite de revisões: 02 por entrega.</p>
              <p class="observation-item">• Entrega em formatos Wide e Vertical.</p>
            </div>
          </div>
        </section>
        
        <footer class="footer">
          <div>
            <div class="footer-brand">SQUAD /// FILM</div>
            <div class="footer-tagline">Visual Storytelling Studio</div>
          </div>
          <div class="footer-meta">
            <div>Relatório Gerado em ${new Date().getFullYear()} • ${escapeHtml(project.name)} — Executivo</div>
            <div>Brazil / Global • ©${new Date().getFullYear()}</div>
          </div>
        </footer>
      </main>
    </div>
  </div>
</body>
</html>`;
}

function generateSimpleHTML(
  title: string,
  subtitle: string,
  metrics: { label: string; value: string; color?: string }[],
  content: string
): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
    
    @page { size: A4; margin: 20mm; }
    @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none !important; } }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: ${COLORS.background};
      color: ${COLORS.text};
      font-size: 12px;
      line-height: 1.6;
      font-weight: 400;
      padding: 40px;
    }
    
    .header { margin-bottom: 32px; }
    .title { font-size: 24px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .subtitle { font-size: 12px; color: ${COLORS.textMuted}; }
    
    .metrics { display: flex; gap: 16px; margin-bottom: 32px; }
    .metric { flex: 1; background: ${COLORS.surface}; border: 1px solid ${COLORS.border}; padding: 16px; }
    .metric-label { font-size: 8px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; color: ${COLORS.textMuted}; margin-bottom: 8px; }
    .metric-value { font-size: 18px; font-weight: 500; }
    .metric-value.primary { color: ${COLORS.primary}; }
    .metric-value.success { color: ${COLORS.success}; }
    .metric-value.warning { color: ${COLORS.warning}; }
    
    .section-title { font-size: 10px; font-weight: 500; letter-spacing: 1.5px; color: ${COLORS.primary}; margin-bottom: 16px; }
    .content { font-size: 12px; color: ${COLORS.textDim}; line-height: 1.8; }
    
    .footer { margin-top: 60px; padding-top: 16px; border-top: 1px solid ${COLORS.border}; display: flex; justify-content: space-between; }
    .footer-brand { font-size: 10px; font-weight: 500; letter-spacing: 2px; color: ${COLORS.textMuted}; }
    .footer-meta { font-size: 8px; color: ${COLORS.textMuted}; }
    
    .print-button { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: ${COLORS.primary}; color: ${COLORS.background}; border: none; font-size: 12px; font-weight: 500; cursor: pointer; }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Imprimir / Salvar PDF</button>
  
  <header class="header">
    <h1 class="title">${escapeHtml(title)}</h1>
    <p class="subtitle">${escapeHtml(subtitle)}</p>
  </header>
  
  <div class="metrics">
    ${metrics.map(m => `
      <div class="metric">
        <div class="metric-label">${escapeHtml(m.label)}</div>
        <div class="metric-value ${m.color || ''}">${escapeHtml(m.value)}</div>
      </div>
    `).join('')}
  </div>
  
  <section>
    <h2 class="section-title">RESUMO</h2>
    <div class="content">${content}</div>
  </section>
  
  <footer class="footer">
    <div class="footer-brand">SQUAD /// FILM</div>
    <div class="footer-meta">©${new Date().getFullYear()} • Página 1</div>
  </footer>
</body>
</html>`;
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

    let htmlContent: string;

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

      const { data: milestones } = await supabase
        .from("payment_milestones")
        .select("*")
        .eq("project_id", id)
        .order("due_date", { ascending: true });

      htmlContent = generateProjectHTML(project, stages || [], deliverables || [], milestones || []);

    } else if (type === "report_360") {
      const { start, end } = getPeriodDates(period);
      
      // Fetch all data needed for Report 360
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .gte("created_at", start.toISOString());

      const { data: milestones } = await supabase
        .from("payment_milestones")
        .select("*")
        .order("due_date", { ascending: true });

      const allProjects = projects || [];
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate metrics
      const delivered = allProjects.filter(p => p.status === 'completed').length;
      const open = allProjects.filter(p => p.status === 'active').length;
      const delayed = allProjects.filter(p => p.status === 'active' && p.due_date && p.due_date < today).length;
      const totalValue = allProjects.reduce((sum, p) => sum + Number(p.contract_value || 0), 0);
      const avgHealthScore = allProjects.length > 0 
        ? Math.round(allProjects.reduce((sum, p) => sum + (p.health_score || 100), 0) / allProjects.length)
        : 100;
      const onTimePercentage = delivered > 0 ? Math.round(((delivered - delayed) / delivered) * 100) : 0;

      // Calculate monthly data
      const monthlyData: Array<{ month: string; delivered: number; open: number; delayed: number }> = [];
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthProjects = allProjects.filter(p => p.created_at?.startsWith(monthKey));
        
        monthlyData.push({
          month: months[date.getMonth()],
          delivered: monthProjects.filter(p => p.status === 'completed').length,
          open: monthProjects.filter(p => p.status === 'active').length,
          delayed: monthProjects.filter(p => p.status === 'active' && p.due_date && p.due_date < today).length,
        });
      }

      // Status distribution
      const statusCounts: Record<string, number> = {};
      allProjects.forEach(p => {
        statusCounts[p.status || 'active'] = (statusCounts[p.status || 'active'] || 0) + 1;
      });
      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
      if (statusDistribution.length === 0) {
        statusDistribution.push({ status: 'active', count: 0 });
      }

      htmlContent = generateReport360HTML(
        { delivered, open, delayed, onTimePercentage, avgHealthScore, totalValue },
        monthlyData,
        statusDistribution,
        allProjects,
        milestones || [],
        { start, end },
        period
      );

    } else if (type === "tasks") {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
      const pendingTasks = tasks?.filter(t => t.status !== 'done').length || 0;
      
      htmlContent = generateSimpleHTML(
        "Relatório de Tarefas",
        `Gerado em ${formatDate(new Date().toISOString())}`,
        [
          { label: "Total", value: String(totalTasks) },
          { label: "Concluídas", value: String(completedTasks), color: "success" },
          { label: "Pendentes", value: String(pendingTasks), color: "warning" },
        ],
        `${completedTasks} tarefas concluídas de um total de ${totalTasks}.`
      );

    } else if (type === "project_overview") {
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const totalValue = projects?.reduce((sum, p) => sum + Number(p.contract_value || 0), 0) || 0;
      
      htmlContent = generateSimpleHTML(
        "Visão Geral de Projetos",
        `Gerado em ${formatDate(new Date().toISOString())}`,
        [
          { label: "Total", value: String(totalProjects) },
          { label: "Ativos", value: String(activeProjects), color: "primary" },
          { label: "Valor Total", value: formatCurrency(totalValue), color: "success" },
        ],
        `${activeProjects} projetos ativos de um total de ${totalProjects}, com valor acumulado de ${formatCurrency(totalValue)}.`
      );

    } else {
      htmlContent = generateSimpleHTML(
        "Relatório",
        `Gerado em ${formatDate(new Date().toISOString())}`,
        [{ label: "Tipo", value: type || "Geral" }],
        "Relatório gerado automaticamente."
      );
    }

    // Save HTML to storage
    const fileName = `report_${type}_${Date.now()}.html`;
    const filePath = `exports/html/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(filePath, htmlContent, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      // Try project-files bucket as fallback
      const { error: fallbackError } = await supabase.storage
        .from("project-files")
        .upload(filePath, htmlContent, {
          contentType: "text/html",
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
