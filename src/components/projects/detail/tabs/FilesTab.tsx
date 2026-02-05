import { Project } from "@/types/projects";
import { Button } from "@/components/ui/button";
import { 
  Folder, 
  FileVideo, 
  FileImage, 
  FileText, 
  File, 
  Upload, 
  Eye,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FilesTabProps {
  project: Project;
}

const FOLDER_CONFIG = {
  brutos: { name: 'Brutos', icon: FileVideo },
  projeto: { name: 'Projeto', icon: Folder },
  referencias: { name: 'Referências', icon: FileImage },
  entregas: { name: 'Entregas', icon: File },
  contratos: { name: 'Contratos', icon: FileText },
  outros: { name: 'Outros', icon: File },
};

export function FilesTab({ project }: FilesTabProps) {
  const groupedFiles = Object.entries(FOLDER_CONFIG).map(([key, config]) => ({
    folder: key as keyof typeof FOLDER_CONFIG,
    ...config,
    files: project.files.filter(f => f.folder === key),
  }));

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex justify-end">
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload de Arquivo
        </Button>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupedFiles.map(({ folder, name, icon: Icon, files }) => (
          <div key={folder} className="glass-card rounded-xl overflow-hidden">
            {/* Folder Header */}
            <div className="p-4 border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{files.length} arquivo(s)</span>
              </div>
            </div>

            {/* Files List */}
            <div className="p-2 max-h-48 overflow-y-auto">
              {files.length > 0 ? (
                <div className="space-y-1">
                  {files.map((file) => (
                    <div 
                      key={file.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.visibleInPortal && (
                          <Eye className="w-3 h-3 text-primary" />
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground py-4">
                  Nenhum arquivo
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {project.files.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Nenhum arquivo no projeto ainda.</p>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Fazer Upload
          </Button>
        </div>
      )}
    </div>
  );
}
