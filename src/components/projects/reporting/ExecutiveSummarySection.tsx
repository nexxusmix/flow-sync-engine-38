/**
 * ExecutiveSummarySection - Report-style executive summary (01 — RESUMO EXECUTIVO)
 * Large heading, editorial paragraphs with AI/Edit buttons
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiGenerateButton } from "@/components/ai/AiGenerateButton";
import { ReportSectionHeader } from "./ReportSectionHeader";
import { Edit3, Save, X } from "lucide-react";
import { toast } from "sonner";
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
  const [isEditing, setIsEditing] = useState(false);
  const [localDescription, setLocalDescription] = useState(description || '');

  const handleSave = () => {
    onSave(localDescription);
    setIsEditing(false);
    toast.success('Briefing salvo com sucesso!');
  };

  const handleCancel = () => {
    setLocalDescription(description || '');
    setIsEditing(false);
  };

  const handleApplyBrief = (result: unknown, mode: 'replace' | 'append') => {
    const briefData = result as GenerateBriefOutput;
    const fullDescription = briefData.description || '';
    
    if (mode === 'replace') {
      setLocalDescription(fullDescription);
    } else {
      setLocalDescription(prev => prev ? `${prev}\n\n---\n\n${fullDescription}` : fullDescription);
    }
    setIsEditing(true);
  };

  // Parse description into paragraphs
  const paragraphs = (description || '').split('\n\n').filter(p => p.trim());
  
  // Extract headline (first line or generate from project name)
  const headline = paragraphs[0]?.length < 80 
    ? paragraphs[0] 
    : `${projectName} — Projeto Audiovisual Completo.`;

  return (
    <div className="bg-card border border-border p-8 md:p-12">
      <ReportSectionHeader index="01" title="RESUMO EXECUTIVO">
        {isManager && (
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
        )}
      </ReportSectionHeader>

      {isEditing ? (
        <div className="space-y-4">
          <Textarea
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            placeholder="Descreva o resumo executivo do projeto, objetivos e escopo principal..."
            className="min-h-[200px] bg-muted/20 border-border text-foreground font-light text-lg leading-relaxed"
          />
          <div className="flex gap-2 justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" />
              Salvar Briefing
            </Button>
          </div>
        </div>
      ) : description ? (
        <div className="max-w-4xl">
          {/* Headline */}
          <h2 className="font-serif text-3xl md:text-4xl font-normal italic text-foreground mb-8">
            {headline}
          </h2>

          {/* Paragraphs with editorial styling */}
          <div className="space-y-6">
            {paragraphs.slice(headline === paragraphs[0] ? 1 : 0).map((paragraph, idx) => (
              <p 
                key={idx}
                className="text-lg md:text-xl text-muted-foreground leading-[1.8] font-light"
              >
                {paragraph}
              </p>
            ))}
          </div>
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
  );
}
