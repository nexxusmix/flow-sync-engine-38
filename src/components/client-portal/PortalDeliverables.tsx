import { useState } from "react";
import { Project, Deliverable } from "@/types/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock,
  FileVideo,
  FileImage,
  FileText,
  File
} from "lucide-react";

interface PortalDeliverablesProps {
  project: Project;
  deliverables: Deliverable[];
}

const TYPE_ICONS = {
  video: FileVideo,
  imagem: FileImage,
  pdf: FileText,
  zip: File,
  audio: File,
  outro: File,
};

function DeliverableCard({ 
  deliverable, 
  onSelect 
}: { 
  deliverable: Deliverable; 
  onSelect: () => void;
}) {
  const TypeIcon = TYPE_ICONS[deliverable.type] || File;
  const isApproved = deliverable.status === 'aprovado' || deliverable.status === 'entregue';
  const needsReview = deliverable.status === 'revisao';

  return (
    <div 
      className="glass-card rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors group"
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail/Icon */}
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {deliverable.type === 'video' ? (
            <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Play className="w-6 h-6 text-primary" />
            </div>
          ) : (
            <TypeIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-foreground truncate">{deliverable.title}</h4>
            {isApproved && (
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Versão {deliverable.currentVersion}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {needsReview && (
              <Badge variant="outline" className="text-muted-foreground border-border text-mono">
                <Clock className="w-3 h-3 mr-1" />
                Aguardando Revisão
              </Badge>
            )}
            {isApproved && (
              <Badge variant="outline" className="text-primary border-primary/30 text-mono">
                <CheckCircle className="w-3 h-3 mr-1" />
                Aprovado
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PortalDeliverables({ project, deliverables }: PortalDeliverablesProps) {
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);

  const toReview = deliverables.filter(d => d.status === 'revisao');
  const approved = deliverables.filter(d => d.status === 'aprovado' || d.status === 'entregue');
  const hasAnyDeliverables = deliverables.length > 0;

  return (
    <section className="space-y-6 min-h-[300px]">
      <h2 className="text-lg font-normal text-foreground">Entregas</h2>

      {!hasAnyDeliverables ? (
        <div className="glass-card rounded-xl p-12 text-center min-h-[200px] flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-light">Materiais ainda não liberados para revisão</p>
          <p className="text-xs text-muted-foreground/60 mt-2">Você será notificado quando houver entregas disponíveis</p>
        </div>
      ) : (
        <Tabs defaultValue="review" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="review" className="gap-2">
              <Clock className="w-4 h-4" />
              Para Revisar
              {toReview.length > 0 && (
                <Badge variant="secondary" className="ml-1">{toReview.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Aprovados
              {approved.length > 0 && (
                <Badge variant="secondary" className="ml-1">{approved.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-4 min-h-[150px]">
            {toReview.length > 0 ? (
              toReview.map((deliverable) => (
                <DeliverableCard 
                  key={deliverable.id} 
                  deliverable={deliverable}
                  onSelect={() => setSelectedDeliverable(deliverable)}
                />
              ))
            ) : (
              <div className="glass-card rounded-xl p-8 text-center min-h-[120px] flex flex-col items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                <p className="text-sm text-muted-foreground font-light">Nenhum item pendente de revisão</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Todas as entregas foram revisadas</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 min-h-[150px]">
            {approved.length > 0 ? (
              approved.map((deliverable) => (
                <DeliverableCard 
                  key={deliverable.id} 
                  deliverable={deliverable}
                  onSelect={() => setSelectedDeliverable(deliverable)}
                />
              ))
            ) : (
              <div className="glass-card rounded-xl p-8 text-center min-h-[120px] flex flex-col items-center justify-center">
                <Clock className="w-10 h-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground font-light">Nenhum item aprovado ainda</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Itens aprovados aparecerão aqui</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Preview Modal would go here */}
    </section>
  );
}
