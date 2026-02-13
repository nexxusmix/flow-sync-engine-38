import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectWithStages } from '@/hooks/useProjects';
import { MessageTab } from './send-to-client/MessageTab';
import { MaterialTab } from './send-to-client/MaterialTab';
import { PanoramaTab } from './send-to-client/PanoramaTab';
import { ContextSidebar } from './send-to-client/ContextSidebar';
import { MessageHistory } from './send-to-client/MessageHistory';
import { MessageSquare, Package, LayoutDashboard, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { usePortalLink } from '@/hooks/usePortalLink';

interface SendToClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithStages;
}

export function SendToClientModal({ open, onOpenChange, project }: SendToClientModalProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { portalUrl, portalLink, createLink } = usePortalLink(project.id, {
    name: project.name,
    clientName: project.client_name,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 pb-0 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-medium">Enviar ao Cliente</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {project.client_name} • {project.name}
                {project.due_date && (
                  <> • Prazo: {format(new Date(project.due_date), 'dd MMM yyyy', { locale: ptBR })}</>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-1.5 text-xs"
            >
              <History className="w-3.5 h-3.5" />
              Histórico
            </Button>
          </div>
        </DialogHeader>

        {showHistory ? (
          <div className="flex-1 overflow-y-auto p-4">
            <MessageHistory projectId={project.id} onBack={() => setShowHistory(false)} />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Main content */}
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="message" className="h-full flex flex-col">
                <TabsList className="mx-4 mt-3 grid grid-cols-3 w-auto">
                  <TabsTrigger value="message" className="gap-1.5 text-xs">
                    <MessageSquare className="w-3.5 h-3.5" /> Mensagem
                  </TabsTrigger>
                  <TabsTrigger value="material" className="gap-1.5 text-xs">
                    <Package className="w-3.5 h-3.5" /> Material
                  </TabsTrigger>
                  <TabsTrigger value="panorama" className="gap-1.5 text-xs">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Panorama
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto p-4">
                  <TabsContent value="message" className="mt-0">
                    <MessageTab project={project} />
                  </TabsContent>
                  <TabsContent value="material" className="mt-0">
                    <MaterialTab project={project} />
                  </TabsContent>
                  <TabsContent value="panorama" className="mt-0">
                    <PanoramaTab project={project} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Context Sidebar - hidden on mobile */}
            <div className="hidden lg:block w-64 border-l border-border/50 overflow-y-auto">
              <ContextSidebar project={project} portalUrl={portalUrl} portalLink={portalLink} onCreatePortalLink={() => createLink.mutate()} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
