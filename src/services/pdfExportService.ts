/**
 * PDF Export Service - Camada unificada para exportação de PDFs
 * 
 * Centraliza todas as chamadas de exportação com:
 * - Loading states
 * - Error handling
 * - Toast notifications
 * - Signed URL management
 * - Auto-open in new tab
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
  /** Whether to automatically open the PDF in a new tab */
  autoOpen?: boolean;
  /** Show toast notifications */
  showToasts?: boolean;
  /** Custom loading message */
  loadingMessage?: string;
  /** Custom success message */
  successMessage?: string;
}

const DEFAULT_OPTIONS: ExportOptions = {
  autoOpen: true,
  showToasts: true,
  loadingMessage: "Gerando PDF...",
  successMessage: "PDF exportado com sucesso!",
};

/**
 * Opens the HTML report in a new window optimized for printing/PDF export
 * The HTML already contains @media print styles for proper PDF generation
 */
function openPrintableWindow(url: string): void {
  // Open a new window with the rendered HTML
  const printWindow = window.open(url, "_blank", "width=1100,height=800");
  
  if (!printWindow) {
    // Fallback: just open normally if popup blocked
    window.open(url, "_blank");
    return;
  }

  // When the page loads, show print dialog automatically
  printWindow.onload = () => {
    // Small delay to ensure styles are loaded
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}

/**
 * Core export function - calls the unified export-pdf Edge Function
 */
async function exportPdf(
  type: ExportType,
  params: {
    id?: string;
    period?: string;
    token?: string;
    filters?: Record<string, unknown>;
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
        ...params,
      },
    });

    if (error) {
      throw new Error(error.message || "Erro na chamada da função");
    }

    if (!data?.success) {
      throw new Error(data?.error || "Falha ao gerar PDF");
    }

    const url = data.signed_url || data.public_url;

    if (opts.autoOpen && url) {
      // Open in a new window with print styles applied
      openPrintableWindow(url);
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

/**
 * Export a single project as PDF
 */
export async function exportProjectPDF(
  projectId: string,
  options?: ExportOptions
): Promise<ExportResult> {
  return exportPdf("project", { id: projectId }, {
    successMessage: "Relatório do projeto exportado!",
    ...options,
  });
}

/**
 * Export Report 360 as PDF
 */
export async function exportReport360PDF(
  period: string = "3m",
  options?: ExportOptions
): Promise<ExportResult> {
  return exportPdf("report_360", { period }, {
    successMessage: "Relatório 360° exportado!",
    ...options,
  });
}

/**
 * Export Tasks/Workflow as PDF
 */
export async function exportTasksPDF(
  filters?: Record<string, unknown>,
  options?: ExportOptions
): Promise<ExportResult> {
  return exportPdf("tasks", { filters }, {
    successMessage: "Quadro de tarefas exportado!",
    ...options,
  });
}

/**
 * Export Finance Report as PDF
 */
export async function exportFinancePDF(
  period: string = "6m",
  options?: ExportOptions
): Promise<ExportResult> {
  return exportPdf("finance", { period }, {
    successMessage: "Relatório financeiro exportado!",
    ...options,
  });
}

/**
 * Export Projects Overview as PDF
 */
export async function exportOverviewPDF(
  period: string = "3m",
  options?: ExportOptions
): Promise<ExportResult> {
  return exportPdf("project_overview", { period }, {
    successMessage: "Visão geral exportada!",
    ...options,
  });
}

/**
 * Export Portal Client PDF (via token - no auth required)
 */
export async function exportPortalPDF(
  token: string,
  projectId?: string,
  options?: ExportOptions
): Promise<ExportResult> {
  return exportPdf("portal", { token, id: projectId }, {
    successMessage: "Relatório do portal exportado!",
    ...options,
  });
}

/**
 * Legacy export functions - redirect to unified edge function
 */
export async function exportCreativePDF(
  type: "studio_run" | "creative_package",
  id: string,
  options?: ExportOptions
): Promise<ExportResult> {
  // Use the original export-creative-pdf for now
  const toastId = options?.showToasts !== false ? toast.loading("Gerando PDF criativo...") : undefined;

  try {
    const { data, error } = await supabase.functions.invoke<ExportResult>("export-creative-pdf", {
      body: { type, id },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || "Falha na exportação");

    const url = data.public_url || data.signed_url;
    if (options?.autoOpen !== false && url) {
      openPrintableWindow(url);
    }

    if (toastId) toast.success("PDF criativo exportado!", { id: toastId });
    return data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao exportar";
    if (toastId) toast.error(msg, { id: toastId });
    return { success: false, error: msg };
  }
}

export async function exportCampaignPDF(
  campaignId: string,
  options?: ExportOptions
): Promise<ExportResult> {
  const toastId = options?.showToasts !== false ? toast.loading("Gerando PDF da campanha...") : undefined;

  try {
    const { data, error } = await supabase.functions.invoke<ExportResult>("export-campaign-pdf", {
      body: { campaign_id: campaignId },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || "Falha na exportação");

    const url = data.public_url || data.signed_url;
    if (options?.autoOpen !== false && url) {
      openPrintableWindow(url);
    }

    if (toastId) toast.success("PDF da campanha exportado!", { id: toastId });
    return data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao exportar";
    if (toastId) toast.error(msg, { id: toastId });
    return { success: false, error: msg };
  }
}

export async function exportContentPDF(
  contentItemId: string,
  options?: ExportOptions
): Promise<ExportResult> {
  const toastId = options?.showToasts !== false ? toast.loading("Gerando PDF do conteúdo...") : undefined;

  try {
    const { data, error } = await supabase.functions.invoke<ExportResult>("export-content-pdf", {
      body: { content_item_id: contentItemId },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || "Falha na exportação");

    const url = data.public_url || data.signed_url;
    if (options?.autoOpen !== false && url) {
      openPrintableWindow(url);
    }

    if (toastId) toast.success("PDF do conteúdo exportado!", { id: toastId });
    return data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao exportar";
    if (toastId) toast.error(msg, { id: toastId });
    return { success: false, error: msg };
  }
}

// Default export for convenience
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
};

export default pdfExportService;
