/**
 * useExportPdf - Hook unificado para exportação de PDFs
 * 
 * Fornece estado de loading, URL exportada e funções de exportação
 * para todos os tipos de relatórios da plataforma.
 */

import { useState, useCallback } from "react";
import {
  exportProjectPDF,
  exportReport360PDF,
  exportTasksPDF,
  exportFinancePDF,
  exportOverviewPDF,
  exportPortalPDF,
  exportCreativePDF,
  exportCampaignPDF,
  exportContentPDF,
  type ExportResult,
  type ExportOptions,
} from "@/services/pdfExportService";

export interface UseExportPdfReturn {
  /** Whether an export is currently in progress */
  isExporting: boolean;
  /** The URL of the last exported PDF (if available) */
  exportedUrl: string | null;
  /** Export a single project */
  exportProject: (projectId: string, options?: ExportOptions) => Promise<ExportResult>;
  /** Export Report 360 */
  exportReport360: (period?: string, options?: ExportOptions) => Promise<ExportResult>;
  /** Export Tasks/Workflow */
  exportTasks: (filters?: Record<string, unknown>, options?: ExportOptions) => Promise<ExportResult>;
  /** Export Finance Report */
  exportFinance: (period?: string, options?: ExportOptions) => Promise<ExportResult>;
  /** Export Projects Overview */
  exportProjectsOverview: (period?: string, options?: ExportOptions) => Promise<ExportResult>;
  /** Export Portal Client PDF */
  exportPortal: (token: string, projectId?: string, options?: ExportOptions) => Promise<ExportResult>;
  /** Export Studio Run / Creative Package */
  exportStudioRun: (studioRunId: string, options?: ExportOptions) => Promise<ExportResult>;
  /** Export Creative Package */
  exportCreativePackage: (packageId: string, options?: ExportOptions) => Promise<ExportResult>;
  /** Export Campaign */
  exportCampaign: (campaignId: string, options?: ExportOptions) => Promise<ExportResult>;
  /** Export Content Item */
  exportContent: (contentItemId: string, options?: ExportOptions) => Promise<ExportResult>;
  /** Open the last exported PDF in a new tab */
  openPdf: () => void;
  /** Copy the exported URL to clipboard */
  copyLink: () => Promise<void>;
  /** Reset the exported URL */
  resetExport: () => void;
}

export function useExportPdf(): UseExportPdfReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  // Helper to wrap export functions with loading state
  const withLoading = useCallback(
    async <T extends ExportResult>(
      exportFn: () => Promise<T>
    ): Promise<T> => {
      setIsExporting(true);
      setExportedUrl(null);
      
      try {
        const result = await exportFn();
        
        if (result.success) {
          const url = result.signed_url || result.public_url || null;
          setExportedUrl(url);
        }
        
        return result;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  const exportProject = useCallback(
    (projectId: string, options?: ExportOptions) =>
      withLoading(() => exportProjectPDF(projectId, options)),
    [withLoading]
  );

  const exportReport360 = useCallback(
    (period: string = "3m", options?: ExportOptions) =>
      withLoading(() => exportReport360PDF(period, options)),
    [withLoading]
  );

  const exportTasks = useCallback(
    (filters?: Record<string, unknown>, options?: ExportOptions) =>
      withLoading(() => exportTasksPDF(filters, options)),
    [withLoading]
  );

  const exportFinance = useCallback(
    (period: string = "6m", options?: ExportOptions) =>
      withLoading(() => exportFinancePDF(period, options)),
    [withLoading]
  );

  const exportProjectsOverview = useCallback(
    (period: string = "3m", options?: ExportOptions) =>
      withLoading(() => exportOverviewPDF(period, options)),
    [withLoading]
  );

  const exportPortal = useCallback(
    (token: string, projectId?: string, options?: ExportOptions) =>
      withLoading(() => exportPortalPDF(token, projectId, options)),
    [withLoading]
  );

  const exportStudioRun = useCallback(
    (studioRunId: string, options?: ExportOptions) =>
      withLoading(() => exportCreativePDF("studio_run", studioRunId, options)),
    [withLoading]
  );

  const exportCreativePackage = useCallback(
    (packageId: string, options?: ExportOptions) =>
      withLoading(() => exportCreativePDF("creative_package", packageId, options)),
    [withLoading]
  );

  const exportCampaign = useCallback(
    (campaignId: string, options?: ExportOptions) =>
      withLoading(() => exportCampaignPDF(campaignId, options)),
    [withLoading]
  );

  const exportContent = useCallback(
    (contentItemId: string, options?: ExportOptions) =>
      withLoading(() => exportContentPDF(contentItemId, options)),
    [withLoading]
  );

  const openPdf = useCallback(() => {
    if (exportedUrl) {
      window.open(exportedUrl, "_blank");
    }
  }, [exportedUrl]);

  const copyLink = useCallback(async () => {
    if (exportedUrl) {
      await navigator.clipboard.writeText(exportedUrl);
      // Toast is handled by the service
    }
  }, [exportedUrl]);

  const resetExport = useCallback(() => {
    setExportedUrl(null);
  }, []);

  return {
    isExporting,
    exportedUrl,
    exportProject,
    exportReport360,
    exportTasks,
    exportFinance,
    exportProjectsOverview,
    exportPortal,
    exportStudioRun,
    exportCreativePackage,
    exportCampaign,
    exportContent,
    openPdf,
    copyLink,
    resetExport,
  };
}

export default useExportPdf;
