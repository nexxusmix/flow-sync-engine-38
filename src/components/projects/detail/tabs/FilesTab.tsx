import { ProjectWithStages } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { 
  Folder, 
  FileVideo, 
  FileImage, 
  FileText, 
  File, 
  Upload
} from "lucide-react";

interface FilesTabProps {
  project: ProjectWithStages;
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
        {Object.entries(FOLDER_CONFIG).map(([key, { name, icon: Icon }]) => (
          <div key={key} className="glass-card rounded-xl overflow-hidden">
            {/* Folder Header */}
            <div className="p-4 border-b border-border/50 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{name}</span>
                </div>
                <span className="text-xs text-muted-foreground">0 arquivo(s)</span>
              </div>
            </div>

            {/* Files List - Empty */}
            <div className="p-2 max-h-48 overflow-y-auto">
              <p className="text-center text-xs text-muted-foreground py-4">
                Nenhum arquivo
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      <div className="glass-card rounded-2xl p-12 text-center">
        <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">Nenhum arquivo no projeto ainda.</p>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Fazer Upload
        </Button>
      </div>
    </div>
  );
}
