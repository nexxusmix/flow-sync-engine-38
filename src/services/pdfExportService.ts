/**
 * PDF Export Service - Camada unificada para exportação de PDFs
 * 
 * Centraliza todas as chamadas de exportação com:
 * - Loading states
 * - Error handling
 * - Toast notifications
 * - Signed URL management
 * - Auto-open in new tab with print dialog
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
  /** Whether to download the PDF directly instead of opening */
  autoDownload?: boolean;
  /** Custom filename for download */
  fileName?: string;
  /** Show toast notifications */
  showToasts?: boolean;
  /** Custom loading message */
  loadingMessage?: string;
  /** Custom success message */
  successMessage?: string;
}

const DEFAULT_OPTIONS: ExportOptions = {
  autoOpen: true,
  autoDownload: false,
  showToasts: true,
  loadingMessage: "Gerando relatório...",
  successMessage: "Relatório gerado com sucesso!",
};

/**
 * Downloads a file from URL directly to user's device.
 * Validates content-type to prevent downloading raw HTML as PDF.
 */
async function downloadFile(url: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    // If the response is HTML, open it rendered in a new window instead of downloading
    if (contentType.includes('text/html')) {
      console.warn('[pdfExportService] Server returned HTML instead of PDF, opening rendered view');
      await openPrintableWindow(url);
      return;
    }
    
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
  } catch (error) {
    console.error('[pdfExportService] Error downloading file:', error);
    // Fallback: open in new tab (rendered)
    window.open(url, '_blank');
  }
}

/**
 * Opens the HTML report in a new window, renders it visually, and triggers print dialog.
 * Works on desktop and mobile (iOS Safari included).
 */
async function openPrintableWindow(url: string): Promise<void> {
  try {
    // On mobile, just open the URL directly - the browser will render it
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Mobile: open URL directly in new tab - browser renders HTML visually
      window.open(url, '_blank');
      return;
    }
    
    // Desktop: fetch HTML and write to a new window for print dialog
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch report');
    }
    
    const htmlContent = await response.text();
    
    const printWindow = window.open('', '_blank', 'width=1100,height=900,scrollbars=yes,resizable=yes');
    
    if (!printWindow) {
      // Popup blocked - fallback to direct open
      window.open(url, '_blank');
      return;
    }
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Trigger print after content loads
    const triggerPrint = () => {
      if (printWindow && !printWindow.closed) {
        printWindow.focus();
        printWindow.print();
      }
    };
    
    printWindow.onload = () => setTimeout(triggerPrint, 500);
    setTimeout(triggerPrint, 1500);
    
  } catch (error) {
    console.error('[pdfExportService] Error opening printable window:', error);
    window.open(url, '_blank');
  }
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
    const fileName = data.file_name || opts.fileName || `relatorio-${type}-${Date.now()}`;

    if (url) {
      if (opts.autoDownload) {
        // Download the PDF directly
        await downloadFile(url, fileName);
      } else if (opts.autoOpen) {
        // Open in a new window with print styles applied
        await openPrintableWindow(url);
      }
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
    successMessage: "Relatório do projeto gerado!",
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
    successMessage: "Relatório 360° gerado!",
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
    successMessage: "Quadro de tarefas gerado!",
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
    successMessage: "Relatório financeiro gerado!",
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
    successMessage: "Visão geral gerada!",
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
    successMessage: "Relatório do portal gerado!",
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
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const toastId = opts.showToasts ? toast.loading("Gerando PDF criativo...") : undefined;

  try {
    const { data, error } = await supabase.functions.invoke<ExportResult>("export-creative-pdf", {
      body: { type, id },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || "Falha na exportação");

    const url = data.public_url || data.signed_url;
    const fileName = data.file_name || opts.fileName || `criativo-${type}-${id}`;
    
    if (url) {
      if (opts.autoDownload) {
        await downloadFile(url, fileName);
      } else if (opts.autoOpen) {
        await openPrintableWindow(url);
      }
    }

    if (toastId) toast.success("PDF criativo baixado!", { id: toastId });
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
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const toastId = opts.showToasts ? toast.loading("Gerando PDF da campanha...") : undefined;

  try {
    const { data, error } = await supabase.functions.invoke<ExportResult>("export-campaign-pdf", {
      body: { campaign_id: campaignId },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || "Falha na exportação");

    const url = data.public_url || data.signed_url;
    const fileName = data.file_name || opts.fileName || `campanha-${campaignId}`;
    
    if (url) {
      if (opts.autoDownload) {
        await downloadFile(url, fileName);
      } else if (opts.autoOpen) {
        await openPrintableWindow(url);
      }
    }

    if (toastId) toast.success("PDF da campanha baixado!", { id: toastId });
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
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const toastId = opts.showToasts ? toast.loading("Gerando PDF do conteúdo...") : undefined;

  try {
    const { data, error } = await supabase.functions.invoke<ExportResult>("export-content-pdf", {
      body: { content_item_id: contentItemId },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || "Falha na exportação");

    const url = data.public_url || data.signed_url;
    const fileName = data.file_name || opts.fileName || `conteudo-${contentItemId}`;
    
    if (url) {
      if (opts.autoDownload) {
        await downloadFile(url, fileName);
      } else if (opts.autoOpen) {
        await openPrintableWindow(url);
      }
    }

    if (toastId) toast.success("PDF do conteúdo baixado!", { id: toastId });
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
