/**
 * PortalVersionsTimeline - Timeline de versões de uma entrega
 * 
 * Exibe o histórico de versões (V1, V2, V3...) com:
 * - Data e hora
 * - Notas do gestor
 * - Link para download/visualização
 */

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  History,
  FileVideo,
  Download,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface DeliverableVersion {
  id: string;
  version_number: number;
  title?: string | null;
  notes?: string | null;
  file_url?: string | null;
  created_at: string;
  created_by_name?: string | null;
}

interface PortalVersionsTimelineProps {
  versions: DeliverableVersion[];
  currentVersion: number;
  onSelectVersion?: (version: DeliverableVersion) => void;
}

export function PortalVersionsTimeline({
  versions,
  currentVersion,
  onSelectVersion,
}: PortalVersionsTimelineProps) {
  if (versions.length === 0) {
    return null;
  }

  // Sort by version number descending
  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <section className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center gap-2">
        <History className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Histórico de Versões</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          v{currentVersion} atual
        </Badge>
      </div>

      {/* Timeline */}
      <div className="p-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

          <div className="space-y-4">
            {sortedVersions.map((version, index) => {
              const isCurrent = version.version_number === currentVersion;
              const isFirst = index === 0;

              return (
                <div key={version.id} className="relative pl-8">
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    isCurrent 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {isCurrent ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      `v${version.version_number}`
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn(
                    "rounded-xl p-3 transition-colors",
                    isCurrent ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-medium text-sm",
                            isCurrent ? "text-primary" : "text-foreground"
                          )}>
                            Versão {version.version_number}
                          </span>
                          {isCurrent && (
                            <Badge className="text-[9px] bg-primary/20 text-primary">
                              Atual
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(new Date(version.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          {version.created_by_name && ` • ${version.created_by_name}`}
                        </p>
                        {version.notes && (
                          <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                            {version.notes}
                          </p>
                        )}
                      </div>

                      {version.file_url && (
                        <div className="flex items-center gap-1">
                          {onSelectVersion && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => onSelectVersion(version)}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            asChild
                          >
                            <a href={version.file_url} download>
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
