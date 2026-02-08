/**
 * PortalFilesTab - Aba Arquivos do portal do cliente
 * 
 * Lista de arquivos do projeto visíveis ao cliente
 */

import { memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  FileText, 
  Image, 
  Film, 
  File, 
  Download,
  FolderOpen,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PortalFile } from "@/hooks/useClientPortalEnhanced";

interface PortalFilesTabProps {
  files: PortalFile[];
  hasPaymentBlock?: boolean;
}

function PortalFilesTabComponent({ files, hasPaymentBlock }: PortalFilesTabProps) {
  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="w-5 h-5" />;
    if (fileType.includes('image')) return <Image className="w-5 h-5 text-emerald-500" />;
    if (fileType.includes('video')) return <Film className="w-5 h-5 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group files by folder
  const groupedFiles = files.reduce((acc, file) => {
    const folder = file.folder || 'Geral';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(file);
    return acc;
  }, {} as Record<string, PortalFile[]>);

  if (files.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Nenhum arquivo disponível</h3>
        <p className="text-sm text-muted-foreground">
          Os arquivos do projeto aparecerão aqui quando forem compartilhados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedFiles).map(([folder, folderFiles]) => (
        <div key={folder} className="glass-card rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">{folder}</h3>
            <Badge variant="secondary" className="text-[10px]">
              {folderFiles.length} arquivo{folderFiles.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="space-y-2">
            {folderFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(file.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(file.file_url, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={hasPaymentBlock}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.file_url;
                      link.download = file.name;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Payment Block Notice */}
      {hasPaymentBlock && (
        <div className="glass-card rounded-xl p-4 border-amber-500/30 bg-amber-500/5">
          <p className="text-sm text-amber-500">
            <strong>Nota:</strong> Downloads estão temporariamente bloqueados devido a pendência financeira.
          </p>
        </div>
      )}
    </div>
  );
}

export const PortalFilesTab = memo(PortalFilesTabComponent);
