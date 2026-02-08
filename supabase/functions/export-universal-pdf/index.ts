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

// Convert markdown-like text to clean HTML
function markdownToHtml(text: string): string {
  if (!text) return '';
  
  return text
    // Remove markdown headings and convert to styled paragraphs
    .replace(/^##\s*(.+)$/gm, '<h3 class="section-title">$1</h3>')
    .replace(/^#\s*(.+)$/gm, '<h2 class="main-title">$1</h2>')
    // Convert bullet lists
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive li elements in ul
    .replace(/(<li>[\s\S]*?<\/li>)(?=\s*<li>)/g, '$1')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul class="deliverable-list">$1</ul>')
    // Fix multiple ul tags
    .replace(/<\/ul>\s*<ul class="deliverable-list">/g, '')
    // Bold text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic text
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Remove remaining # and - at line starts
    .replace(/^[#-]+\s*/gm, '')
    // Convert newlines to paragraphs
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => {
      if (p.includes('<h2') || p.includes('<h3') || p.includes('<ul')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
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

/**
 * Premium Editorial HTML PDF Generator
 * Generates HTML with print-optimized CSS for A4 PDF export
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
    @import url('https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@300;400;500;600&display=swap');
    
    @page {
      size: A4;
      margin: 15mm 20mm;
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
      font-family: 'Host Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: ${COLORS.background};
      color: ${COLORS.text};
      font-size: 11px;
      line-height: 1.6;
      font-weight: 300;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    
    .layout {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 24px;
    }
    
    /* Sidebar */
    .sidebar {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      padding: 20px;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 8px;
      font-weight: 500;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-right: 6px;
      margin-bottom: 12px;
    }
    
    .badge-active {
      background: ${COLORS.primary}22;
      border: 1px solid ${COLORS.primary}44;
      color: ${COLORS.primary};
    }
    
    .badge-blocked {
      background: ${COLORS.error}22;
      border: 1px solid ${COLORS.error}44;
      color: ${COLORS.error};
    }
    
    .project-title {
      font-size: 16px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .client-name {
      font-size: 10px;
      color: ${COLORS.textMuted};
      font-style: italic;
      margin-bottom: 16px;
    }
    
    .divider {
      height: 1px;
      background: ${COLORS.border};
      margin: 16px 0;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    .metric-item {
      margin-bottom: 8px;
    }
    
    .metric-label {
      font-size: 7px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: ${COLORS.textMuted};
      margin-bottom: 4px;
    }
    
    .metric-value {
      font-size: 12px;
      font-weight: 500;
    }
    
    .metric-value.primary { color: ${COLORS.primary}; }
    .metric-value.success { color: ${COLORS.success}; }
    
    .progress-section {
      margin-top: 24px;
    }
    
    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .progress-label {
      font-size: 8px;
      font-weight: 500;
      letter-spacing: 0.5px;
      color: ${COLORS.textMuted};
    }
    
    .progress-value {
      font-size: 9px;
      color: ${COLORS.text};
    }
    
    .progress-bar {
      height: 4px;
      background: ${COLORS.border};
      position: relative;
    }
    
    .progress-fill {
      height: 100%;
      background: ${COLORS.primary};
      min-width: 2px;
    }
    
    /* Main Content */
    .main-content {
      min-width: 0;
    }
    
    .section {
      margin-bottom: 24px;
    }
    
    .section-header {
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 1.5px;
      color: ${COLORS.primary};
      margin-bottom: 16px;
    }
    
    .card {
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      padding: 20px;
    }
    
    .card-headline {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;
    }
    
    .card-headline em {
      color: ${COLORS.primary};
      font-style: italic;
    }
    
    .executive-content {
      color: ${COLORS.textDim};
      font-size: 11px;
      line-height: 1.8;
    }
    
    .executive-content h2,
    .executive-content .main-title {
      font-size: 14px;
      font-weight: 500;
      color: ${COLORS.text};
      margin: 20px 0 12px 0;
    }
    
    .executive-content h3,
    .executive-content .section-title {
      font-size: 12px;
      font-weight: 500;
      color: ${COLORS.primary};
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .executive-content p {
      margin-bottom: 12px;
    }
    
    .executive-content ul,
    .executive-content .deliverable-list {
      margin: 12px 0;
      padding-left: 0;
      list-style: none;
    }
    
    .executive-content li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 6px;
      color: ${COLORS.textMuted};
    }
    
    .executive-content li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${COLORS.primary};
    }
    
    .executive-content strong {
      font-weight: 500;
      color: ${COLORS.text};
    }
    
    .scope-card {
      border-left: 3px solid ${COLORS.primary}66;
    }
    
    .scope-text {
      font-size: 10px;
      color: ${COLORS.textMuted};
      line-height: 1.7;
    }
    
    .methodology-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 16px;
    }
    
    .methodology-title {
      font-size: 8px;
      font-weight: 500;
      letter-spacing: 1px;
      color: ${COLORS.primary};
      margin-bottom: 10px;
    }
    
    .methodology-list {
      list-style: none;
    }
    
    .methodology-list li {
      font-size: 9px;
      color: ${COLORS.textMuted};
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Deliverables */
    .deliverable-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
      margin-bottom: 4px;
    }
    
    .deliverable-index {
      font-size: 12px;
      color: ${COLORS.primary};
      font-weight: 300;
      width: 32px;
    }
    
    .deliverable-content {
      flex: 1;
    }
    
    .deliverable-title {
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .deliverable-desc {
      font-size: 9px;
      color: ${COLORS.textMuted};
      margin-top: 2px;
    }
    
    .deliverable-status {
      font-size: 7px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    
    .status-completed { color: ${COLORS.success}; }
    .status-in_progress { color: ${COLORS.primary}; }
    .status-pending { color: ${COLORS.textMuted}; }
    .status-blocked { color: ${COLORS.error}; }
    
    /* Financial Table */
    .financial-table {
      width: 100%;
      border-collapse: collapse;
      background: ${COLORS.surface};
      border: 1px solid ${COLORS.border};
    }
    
    .financial-table th {
      padding: 12px 16px;
      font-size: 8px;
      font-weight: 500;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: ${COLORS.textMuted};
      background: ${COLORS.border}66;
      text-align: left;
    }
    
    .financial-table th:last-child {
      text-align: right;
    }
    
    .financial-table td {
      padding: 12px 16px;
      font-size: 10px;
      border-top: 1px solid ${COLORS.border};
    }
    
    .financial-table td:last-child {
      text-align: right;
      font-weight: 500;
    }
    
    .amount-paid { color: ${COLORS.success}; }
    .amount-overdue { color: ${COLORS.error}; }
    .amount-pending { color: ${COLORS.text}; }
    
    .pix-info {
      font-size: 9px;
      color: ${COLORS.textMuted};
      margin-top: 12px;
      letter-spacing: 0.3px;
    }
    
    /* Observations */
    .observations-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .observation-item {
      font-size: 9px;
      color: ${COLORS.textMuted};
      margin-bottom: 8px;
    }
    
    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid ${COLORS.border};
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .footer-brand {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 2px;
      color: ${COLORS.textMuted};
    }
    
    .footer-tagline {
      font-size: 8px;
      color: ${COLORS.textDim};
      margin-top: 4px;
    }
    
    .footer-meta {
      text-align: right;
      font-size: 8px;
      color: ${COLORS.textMuted};
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${COLORS.primary};
      color: ${COLORS.background};
      border: none;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      z-index: 1000;
    }
    
    .print-button:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Imprimir / Salvar PDF</button>
  
  <div class="container">
    <div class="layout">
      <!-- Sidebar -->
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
      
      <!-- Main Content -->
      <main class="main-content">
        <!-- Executive Summary -->
        <section class="section">
          <h2 class="section-header">01 — RESUMO EXECUTIVO</h2>
          <div class="card">
            <h3 class="card-headline">${escapeHtml(project.name)} — Narrativa Audiovisual <em>Completa</em>.</h3>
            <div class="executive-content">
              ${cleanDescription}
            </div>
          </div>
        </section>
        
        <!-- Scope -->
        <section class="section">
          <h2 class="section-header">02 — ESCOPO DETALHADO</h2>
          <div class="card scope-card">
            <p class="scope-text">
              2.1. O PRESENTE CONTRATO TEM POR OBJETO A PRESTAÇÃO DE SERVIÇOS DE PRODUÇÃO AUDIOVISUAL PARA O PROJETO "${escapeHtml((project.name || '').toUpperCase())}", VISANDO REGISTRAR E TRANSMITIR A MAGNITUDE DO EMPREENDIMENTO ATRAVÉS DE UMA NARRATIVA AUDIOVISUAL COMPLETA. 2.2. O ESCOPO INCLUI CAPTAÇÃO, EDIÇÃO, COLOR GRADING E SOUND DESIGN, UTILIZANDO EQUIPAMENTOS CINEMA 4K E DRONE.
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
        
        <!-- Deliverables -->
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
          ${deliverablesList.length > 8 ? `<p style="font-size: 9px; color: ${COLORS.textMuted}; margin-top: 8px;">+ Ver todas as ${deliverablesList.length} entregas</p>` : ''}
        </section>
        
        <!-- Financial -->
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
        
        <!-- Observations -->
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
        
        <!-- Footer -->
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
    @import url('https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@300;400;500;600&display=swap');
    
    @page { size: A4; margin: 20mm; }
    @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none !important; } }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Host Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: ${COLORS.background};
      color: ${COLORS.text};
      font-size: 12px;
      line-height: 1.6;
      font-weight: 300;
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
      
      htmlContent = generateSimpleHTML(
        "Relatório 360",
        `Período: ${formatDate(start.toISOString())} — ${formatDate(end.toISOString())}`,
        [
          { label: "Projetos", value: String(totalProjects) },
          { label: "Receita", value: formatCurrency(totalRevenue), color: "success" },
          { label: "Período", value: period.toUpperCase() },
        ],
        `Total de ${totalProjects} projetos no período selecionado com receita acumulada de ${formatCurrency(totalRevenue)}.`
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
      return new Response(
        JSON.stringify({ error: "Invalid export type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save as HTML file (printable to PDF)
    const fileName = `${type}_${id || 'report'}_${Date.now()}.html`;
    const filePath = `exports/pdf/${fileName}`;

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
          file_name: fileName,
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
