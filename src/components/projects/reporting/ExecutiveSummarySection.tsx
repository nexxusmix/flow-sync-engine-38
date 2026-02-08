/**
 * ExecutiveSummarySection - Report-style executive summary (01 — RESUMO EXECUTIVO)
 * Collapsible by default, large heading, editorial paragraphs with AI/Edit buttons
 * Now with auto-save functionality and visual card-based rendering
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiGenerateButton } from "@/components/ai/AiGenerateButton";
import { SaveIndicator, DraftIndicator } from "@/components/ui/save-indicator";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Edit3, X, ChevronDown, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { VisualMarkdownRenderer } from "./VisualMarkdownRenderer";
import type { GenerateBriefOutput } from "@/ai/actions";

interface ExecutiveSummarySectionProps {
  projectId: string;
  projectName: string;
  clientName: string;
  template: string;
  description: string | null;
  onSave: (description: string) => void;
  isManager?: boolean;
}

export function ExecutiveSummarySection({
  projectId,
  projectName,
  clientName,
  template,
  description,
  onSave,
  isManager = true,
}: ExecutiveSummarySectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'text'>('visual');

  // Auto-save hook with debounce
  const {
    value: localDescription,
    setValue: setLocalDescription,
    status: saveStatus,
    saveNow,
    hasDraft,
    discardDraft,
  } = useAutoSave({
    storageKey: `project:${projectId}:description`,
    debounceMs: 800,
    onSave: async (value) => {
      onSave(value);
    },
    initialValue: description || '',
    persistDraft: true,
  });

  const handleCancel = () => {
    discardDraft();
    setIsEditing(false);
  };

  const handleApplyBrief = useCallback((result: unknown, mode: 'replace' | 'append') => {
    const briefData = result as GenerateBriefOutput;
    const fullDescription = briefData.description || '';
    
    if (mode === 'replace') {
      setLocalDescription(fullDescription);
    } else {
      const appendedValue = localDescription ? `${localDescription}\n\n---\n\n${fullDescription}` : fullDescription;
      setLocalDescription(appendedValue);
    }
    setIsEditing(true);
    setIsOpen(true);
  }, [setLocalDescription, localDescription]);

  // Parse description into paragraphs (use localDescription when editing, otherwise description)
  const displayDescription = isEditing ? localDescription : (description || '');
  const paragraphs = displayDescription.split('\n\n').filter((p: string) => p.trim());
  
  // Extract headline (first line or generate from project name)
  const headline = paragraphs[0]?.length < 80 
    ? paragraphs[0] 
    : `${projectName} — Projeto Audiovisual Completo.`;

  return (
    <div className="bg-card border border-border">
      {/* Collapsible Header */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-8 md:p-12 pb-6 flex items-start justify-between hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-primary text-[10px] uppercase tracking-[0.4em] font-bold">
              01 — RESUMO EXECUTIVO
            </span>
          </div>
          {/* Preview headline when closed */}
          {!isOpen && description && (
            <p className="text-lg text-muted-foreground font-light line-clamp-2 max-w-3xl">
              {headline}
            </p>
          )}
          {!isOpen && !description && (
            <p className="text-sm text-muted-foreground/70">
              Clique para expandir e adicionar o resumo executivo
            </p>
          )}
        </div>
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-200 mt-1",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-8 md:px-12 pb-8 md:pb-12 pt-0 border-t border-border">
              {/* Action buttons when open */}
              {isManager && (
                <div className="flex items-center justify-between pt-6 mb-6">
                  <div className="flex items-center gap-2">
                    <AiGenerateButton
                      actionKey="projects.generateBrief"
                      entityType="project"
                      entityId={projectId}
                      hasExistingContent={!!description}
                      getContext={() => ({
                        id: projectId,
                        name: projectName,
                        client_name: clientName,
                        service_type: template,
                        description: description,
                      })}
                      onApply={handleApplyBrief}
                    />
                    {!isEditing && description && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditing(true)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    )}
                  </div>
                  
                  {/* View mode toggle */}
                  {!isEditing && description && (
                    <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                      <Button
                        variant={viewMode === 'visual' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('visual')}
                        className="h-7 px-3 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Visual
                      </Button>
                      <Button
                        variant={viewMode === 'text' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('text')}
                        className="h-7 px-3 text-xs"
                      >
                        Texto
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <DraftIndicator hasDraft={hasDraft} onDiscard={discardDraft} />
                    <SaveIndicator status={saveStatus} />
                  </div>
                  <Textarea
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={saveNow}
                    placeholder={`Use markdown para estruturar o conteúdo:\n\n## ENTREGAS\n- Item 1\n- Item 2\n\n## CONDIÇÕES FINANCEIRAS\n- Parcela 1: R$ 5.000 (2026-01-15) - Sinal\n\n## OBSERVAÇÕES\n- Observação importante`}
                    className="min-h-[300px] bg-muted/20 border-border text-foreground font-mono text-sm leading-relaxed"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCancel}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Fechar Edição
                    </Button>
                  </div>
                </div>
              ) : description ? (
                <div className="pt-6">
                  {/* Headline */}
                  <h2 className="font-serif text-3xl md:text-4xl font-normal italic text-foreground mb-8">
                    {headline}
                  </h2>

                  {viewMode === 'visual' ? (
                    <VisualMarkdownRenderer content={displayDescription} />
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed bg-transparent p-0 border-0">
                        {displayDescription}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-lg text-muted-foreground mb-4">Nenhum resumo executivo definido</p>
                  <p className="text-sm text-muted-foreground/70 max-w-lg mb-6">
                    Use o botão "Gerar com IA" para criar um resumo executivo automaticamente baseado nos dados do projeto, 
                    ou clique para escrever manualmente.
                  </p>
                  {isManager && (
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Escrever Resumo Executivo
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
