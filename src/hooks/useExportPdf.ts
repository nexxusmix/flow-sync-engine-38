import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExportResult {
  success: boolean;
  file_path?: string;
  public_url?: string;
  file_name?: string;
  error?: string;
}

export function useExportPdf() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  const exportStudioRun = async (studioRunId: string) => {
    setIsExporting(true);
    setExportedUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke<ExportResult>('export-creative-pdf', {
        body: {
          type: 'studio_run',
          id: studioRunId,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha na exportação');

      setExportedUrl(data.public_url || null);
      toast.success("PDF exportado com sucesso!");
      
      return data;
    } catch (error) {
      console.error("Error exporting PDF:", error);
      const message = error instanceof Error ? error.message : "Erro ao exportar PDF";
      toast.error(message);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const exportCreativePackage = async (packageId: string) => {
    setIsExporting(true);
    setExportedUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke<ExportResult>('export-creative-pdf', {
        body: {
          type: 'creative_package',
          id: packageId,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Falha na exportação');

      setExportedUrl(data.public_url || null);
      toast.success("PDF exportado com sucesso!");
      
      return data;
    } catch (error) {
      console.error("Error exporting PDF:", error);
      const message = error instanceof Error ? error.message : "Erro ao exportar PDF";
      toast.error(message);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const openPdf = () => {
    if (exportedUrl) {
      window.open(exportedUrl, '_blank');
    }
  };

  const copyLink = async () => {
    if (exportedUrl) {
      await navigator.clipboard.writeText(exportedUrl);
      toast.success("Link copiado!");
    }
  };

  const resetExport = () => {
    setExportedUrl(null);
  };

  return {
    isExporting,
    exportedUrl,
    exportStudioRun,
    exportCreativePackage,
    openPdf,
    copyLink,
    resetExport,
  };
}
