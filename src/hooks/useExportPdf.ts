/**
 * useExportPdf - Hook unificado para exportação de PDFs
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
  isExporting: boolean;
  exportProject: (projectId: string, options?: ExportOptions) => Promise<ExportResult>;
  exportReport360: (period?: string, options?: ExportOptions) => Promise<ExportResult>;
  exportTasks: (filters?: Record<string, unknown>, options?: ExportOptions) => Promise<ExportResult>;
  exportFinance: (period?: string, options?: ExportOptions) => Promise<ExportResult>;
  exportProjectsOverview: (period?: string, options?: ExportOptions) => Promise<ExportResult>;
  exportPortal: (token: string, projectId?: string, options?: ExportOptions) => Promise<ExportResult>;
  exportStudioRun: (studioRunId: string, options?: ExportOptions) => Promise<ExportResult>;
  exportCreativePackage: (packageId: string, options?: ExportOptions) => Promise<ExportResult>;
  exportCampaign: (campaignId: string, options?: ExportOptions) => Promise<ExportResult>;
  exportContent: (contentItemId: string, options?: ExportOptions) => Promise<ExportResult>;
}

export function useExportPdf(): UseExportPdfReturn {
  const [isExporting, setIsExporting] = useState(false);

  const withLoading = useCallback(
    async <T extends ExportResult>(exportFn: () => Promise<T>): Promise<T> => {
      setIsExporting(true);
      try {
        return await exportFn();
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return {
    isExporting,
    exportProject: useCallback((id: string, o?: ExportOptions) => withLoading(() => exportProjectPDF(id, o)), [withLoading]),
    exportReport360: useCallback((p = "3m", o?: ExportOptions) => withLoading(() => exportReport360PDF(p, o)), [withLoading]),
    exportTasks: useCallback((f?: Record<string, unknown>, o?: ExportOptions) => withLoading(() => exportTasksPDF(f, o)), [withLoading]),
    exportFinance: useCallback((p = "6m", o?: ExportOptions) => withLoading(() => exportFinancePDF(p, o)), [withLoading]),
    exportProjectsOverview: useCallback((p = "3m", o?: ExportOptions) => withLoading(() => exportOverviewPDF(p, o)), [withLoading]),
    exportPortal: useCallback((t: string, pid?: string, o?: ExportOptions) => withLoading(() => exportPortalPDF(t, pid, o)), [withLoading]),
    exportStudioRun: useCallback((id: string, o?: ExportOptions) => withLoading(() => exportCreativePDF("studio_run", id, o)), [withLoading]),
    exportCreativePackage: useCallback((id: string, o?: ExportOptions) => withLoading(() => exportCreativePDF("creative_package", id, o)), [withLoading]),
    exportCampaign: useCallback((id: string, o?: ExportOptions) => withLoading(() => exportCampaignPDF(id, o)), [withLoading]),
    exportContent: useCallback((id: string, o?: ExportOptions) => withLoading(() => exportContentPDF(id, o)), [withLoading]),
  };
}

export default useExportPdf;
