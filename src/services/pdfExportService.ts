/**
 * PDF Export Service - Camada unificada para exportação de PDFs
 * 
 * Centraliza todas as chamadas de exportação com:
 * - Loading states
 * - Error handling
 * - Toast notifications
 * - Blob download for Safari/iOS compatibility
 * 
 * The edge functions generate real PDF binary files using pdf-lib.
 * The file is downloaded as a real .pdf via blob fetch.
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExportResult {
  success: boolean;
  signed_url?: string;
  public_url?: string;
  storage_path?: string;
  file_name?: string;
  expires_at?: string;
  error?: string;
}

export type ExportType = 
  | "project" 
  | "report_360" 
  | "tasks" 
  | "finance" 
  | "portal" 
  | "project_overview"
  | "creative"
  | "campaign"
  | "content";

export interface ExportOptions {
  /** Show toast notifications */
  showToasts?: boolean;
  /** Custom loading message */
  loadingMessage?: string;
  /** Custom success message */
  successMessage?: string;
  /** Override the download filename */
  fileName?: string;
}

const DEFAULT_OPTIONS: ExportOptions = {
  showToasts: true,
  loadingMessage: "Gerando relatório PDF...",
  successMessage: "PDF gerado com sucesso!",
};

// ─── Naming helpers ──────────────────────────────────────────

function formatDateForFilename(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function generateRefCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "HB";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function buildFileName(type: ExportType, entityName?: string): string {
  const dateStr = formatDateForFilename();
  const code = generateRefCode();
  const slugify = (s: string) =>
    s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");

  switch (type) {
    case "tasks":
      return `QUADRO_DE_TAREFAS_${dateStr}_${code}.pdf`;
    case "project":
      return `PROJETO_${slugify(entityName || "PROJETO")}_${dateStr}_${code}.pdf`;
    case "report_360":
      return `RELATORIO_360_${dateStr}_${code}.pdf`;
    case "finance":
      return `RELATORIO_FINANCEIRO_${dateStr}_${code}.pdf`;
    case "project_overview":
      return `VISAO_GERAL_PROJETOS_${dateStr}_${code}.pdf`;
    case "portal":
      return `PORTAL_CLIENTE_${slugify(entityName || "PORTAL")}_${dateStr}_${code}.pdf`;
    case "campaign":
      return `CAMPANHA_${slugify(entityName || "CAMPANHA")}_${dateStr}_${code}.pdf`;
    case "content":
      return `CONTEUDO_${slugify(entityName || "CONTEUDO")}_${dateStr}_${code}.pdf`;
    case "creative":
      return `CRIATIVO_${slugify(entityName || "CRIATIVO")}_${dateStr}_${code}.pdf`;
    default:
      return `HUB_EXPORT_${dateStr}_${code}.pdf`;
  }
}

// ─── Blob download (Safari/iOS compatible) ────────────────────

async function downloadPdfFromUrl(url: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Falha ao baixar PDF");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    // Cleanup after a short delay (Safari needs time)
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 250);
  } catch {
    // Fallback: open in new tab
    window.open(url, "_blank");
  }
}

/**
 * Core export function - calls the unified export-pdf Edge Function
 * and downloads the result as a real PDF file.
 */
async function exportPdf(
  type: ExportType,
  params: {
    id?: string;
    period?: string;
    token?: string;
    filters?: Record<string, unknown>;
    entityName?: string;
  } = {},
  options: ExportOptions = {}
): Promise<ExportResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  let toastId: string | number | undefined;
  
  if (opts.showToasts) {
    toastId = toast.loading(opts.loadingMessage);
  }

  try {
    console.log(`[pdfExportService] Exporting ${type}:`, params);

    const { data, error } = await supabase.functions.invoke<ExportResult>("export-pdf", {
      body: {
        type,
        id: params.id,
        period: params.period,
        token: params.token,
        filters: params.filters,
      },
    });

    if (error) {
      throw new Error(error.message || "Erro na chamada da função");
    }

    if (!data?.success) {
      throw new Error(data?.error || "Falha ao gerar PDF");
    }

    const url = data.signed_url || data.public_url;

    if (url) {
      const fileName = opts.fileName || buildFileName(type, params.entityName);
      await downloadPdfFromUrl(url, fileName);
    }

    if (opts.showToasts && toastId) {
      toast.success(opts.successMessage, { id: toastId });
    }

    console.log(`[pdfExportService] Export successful:`, data);
    return data;
  } catch (error) {
    console.error(`[pdfExportService] Export failed:`, error);
    
    const errorMessage = error instanceof Error ? error.message : "Erro ao exportar PDF";
    
    if (opts.showToasts && toastId) {
      toast.error(errorMessage, { id: toastId });
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ─── Public export functions ───────────────────────────────────

export async function exportProjectPDF(projectId: string, options?: ExportOptions): Promise<ExportResult> {
  return exportPdf("project", { id: projectId }, { successMessage: "PDF do projeto pronto!", ...options });
}

export async function exportReport360PDF(period: string = "3m", options?: ExportOptions): Promise<ExportResult> {
  return exportPdf("report_360", { period }, { successMessage: "Relatório 360° pronto!", ...options });
}

export async function exportTasksPDF(filters?: Record<string, unknown>, options?: ExportOptions): Promise<ExportResult> {
  return exportPdf("tasks", { filters }, { successMessage: "Quadro de tarefas pronto!", ...options });
}

export async function exportFinancePDF(period: string = "6m", options?: ExportOptions): Promise<ExportResult> {
  return exportPdf("finance", { period }, { successMessage: "Relatório financeiro pronto!", ...options });
}

export async function exportOverviewPDF(period: string = "3m", options?: ExportOptions): Promise<ExportResult> {
  return exportPdf("project_overview", { period }, { successMessage: "Visão geral pronta!", ...options });
}

export async function exportPortalPDF(token: string, projectId?: string, options?: ExportOptions): Promise<ExportResult> {
  return exportPdf("portal", { token, id: projectId }, { successMessage: "Relatório do portal pronto!", ...options });
}

/** Legacy export functions - redirect to dedicated edge functions */
async function invokeAndDownload(
  fnName: string,
  body: Record<string, unknown>,
  type: ExportType,
  entityName: string,
  toastMsg: string,
  options?: ExportOptions
): Promise<ExportResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const toastId = opts.showToasts ? toast.loading("Gerando PDF...") : undefined;

  try {
    const { data, error } = await supabase.functions.invoke<ExportResult>(fnName, { body });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || "Falha na exportação");

    const url = data.public_url || data.signed_url;
    if (url) {
      const fileName = buildFileName(type, entityName);
      await downloadPdfFromUrl(url, fileName);
    }

    if (toastId) toast.success(toastMsg, { id: toastId });
    return data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao exportar";
    if (toastId) toast.error(msg, { id: toastId });
    return { success: false, error: msg };
  }
}

export async function exportCreativePDF(type: "studio_run" | "creative_package", id: string, options?: ExportOptions): Promise<ExportResult> {
  return invokeAndDownload("export-creative-pdf", { type, id }, "creative", type, "PDF criativo pronto!", options);
}

export async function exportCampaignPDF(campaignId: string, options?: ExportOptions): Promise<ExportResult> {
  return invokeAndDownload("export-campaign-pdf", { campaign_id: campaignId }, "campaign", "", "PDF da campanha pronto!", options);
}

export async function exportContentPDF(contentItemId: string, options?: ExportOptions): Promise<ExportResult> {
  return invokeAndDownload("export-content-pdf", { content_item_id: contentItemId }, "content", "", "PDF do conteúdo pronto!", options);
}

export async function exportFocusPDF(
  plan: { blocks: any[]; total_estimated_minutes: number; tips: string[] },
  orientation: "landscape" | "portrait" = "portrait",
  options?: ExportOptions
): Promise<ExportResult> {
  return invokeAndDownload(
    "export-focus-pdf",
    { blocks: plan.blocks, total_estimated_minutes: plan.total_estimated_minutes, tips: plan.tips, orientation },
    "tasks",
    "FOCO",
    "PDF do plano de foco pronto!",
    options
  );
}

// Default export
const pdfExportService = {
  exportProjectPDF,
  exportReport360PDF,
  exportTasksPDF,
  exportFinancePDF,
  exportOverviewPDF,
  exportPortalPDF,
  exportCreativePDF,
  exportCampaignPDF,
  exportContentPDF,
  exportFocusPDF,
};

export default pdfExportService;
