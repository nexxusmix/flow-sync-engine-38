import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectUpdate } from "@/types/projectUpdates";
import { Project } from "@/types/projects";
import { AddUpdateModal } from "../modals/AddUpdateModal";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Mic,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";

interface ProjectUpdatesSectionProps {
  project: Project;
  updates: ProjectUpdate[];
  onAddUpdate: (update: ProjectUpdate) => void;
}

export function ProjectUpdatesSection({ project, updates, onAddUpdate }: ProjectUpdatesSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedUpdates, setExpandedUpdates] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedUpdates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'mixed': return <Sparkles className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'audio': return 'Áudio';
      case 'image': return 'Imagem';
      case 'mixed': return 'Múltiplo';
      default: return 'Texto';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-normal text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Atualizações do Projeto
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Feedbacks, pedidos do cliente e alterações
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={() => setIsModalOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Atualização</span>
        </Button>
      </div>

      {updates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma atualização registrada</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Adicione textos, prints de conversa ou áudios para gerar resumos automáticos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {updates.map((update, index) => (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-muted/30 rounded-xl overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => toggleExpand(update.id)}
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    {getTypeIcon(update.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-light uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {getTypeLabel(update.type)}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {format(new Date(update.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {update.summary || update.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {update.clientRequests && update.clientRequests.length > 0 && (
                      <span className="text-[9px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {update.clientRequests.length} pedido(s)
                      </span>
                    )}
                    {expandedUpdates.has(update.id) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedUpdates.has(update.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50"
                    >
                      <div className="p-4 space-y-4">
                        {/* Summary */}
                        {update.summary && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-3 h-3 text-primary" />
                              <span className="text-[10px] font-light uppercase tracking-wide text-muted-foreground">
                                Resumo IA
                              </span>
                            </div>
                            <p className="text-sm text-foreground bg-background/50 rounded-lg p-3">
                              {update.summary}
                            </p>
                          </div>
                        )}

                        {/* Client Requests */}
                        {update.clientRequests && update.clientRequests.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                              <span className="text-[10px] font-light uppercase tracking-wide text-muted-foreground">
                                Pedidos do Cliente
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {update.clientRequests.map((request, idx) => (
                                <li 
                                  key={idx}
                                  className="flex items-start gap-2 text-sm text-foreground bg-amber-500/5 border border-amber-500/20 rounded-lg p-3"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                  {request}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Original Content */}
                        {update.originalContent && update.originalContent !== update.summary && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] font-light uppercase tracking-wide text-muted-foreground">
                                Conteúdo Original
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                              {update.originalContent}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 pt-2 border-t border-border/30">
                          <span className="text-[9px] text-muted-foreground">
                            Por: {update.author}
                          </span>
                          {update.metadata?.imageCount && (
                            <span className="text-[9px] text-muted-foreground">
                              {update.metadata.imageCount} imagem(ns) analisada(s)
                            </span>
                          )}
                          {update.metadata?.aiModel && (
                            <span className="text-[9px] text-primary">
                              IA: {update.metadata.aiModel}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddUpdateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        project={project}
        onUpdateAdded={onAddUpdate}
      />
    </div>
  );
}
