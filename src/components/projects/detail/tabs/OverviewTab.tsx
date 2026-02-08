import { useState } from "react";
import { ProjectWithStages, useProjects } from "@/hooks/useProjects";
import { PROJECT_STAGES, STATUS_CONFIG } from "@/data/projectTemplates";
import { TimelineForecast30D } from "@/components/timeline/TimelineForecast30D";
import { AiGenerateButton } from "@/components/ai/AiGenerateButton";
import { ProjectArtSection } from "@/components/projects/ProjectArtSection";
import type { GenerateBriefOutput } from "@/ai/actions";
import { 
  Activity,
  DollarSign,
  Target,
  Zap,
  TrendingUp,
  Calendar,
  Eye,
  FileText,
  Edit3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface OverviewTabProps {
  project: ProjectWithStages;
}

export function OverviewTab({ project }: OverviewTabProps) {
  const { updateProject } = useProjects();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(project.description || '');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-emerald-500';
    if (health >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const handleSaveDescription = async () => {
    updateProject({ id: project.id, data: { description } });
    setIsEditing(false);
    toast.success('Briefing salvo com sucesso!');
  };

  const handleApplyBrief = (result: unknown, mode: 'replace' | 'append') => {
    const briefData = result as GenerateBriefOutput;
    const fullDescription = briefData.description || '';
    
    if (mode === 'replace') {
      setDescription(fullDescription);
    } else {
      setDescription(prev => prev ? `${prev}\n\n---\n\n${fullDescription}` : fullDescription);
    }
    setIsEditing(true);
  };

  const currentStageName = PROJECT_STAGES.find(s => s.type === project.stage_current)?.name || project.stage_current;
  const completedStages = project.stages?.filter(s => s.status === 'completed').length || 0;
  const totalStages = project.stages?.length || 0;
  const stageProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[9px] font-bold text-emerald-500 uppercase">Progresso</span>
          </div>
          <p className="text-lg font-bold text-foreground">{stageProgress}%</p>
          <p className="text-[10px] text-muted-foreground">{completedStages}/{totalStages} etapas</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[9px] font-bold text-primary uppercase">Saúde</span>
          </div>
          <p className={`text-lg font-bold ${getHealthColor(project.health_score || 0)}`}>{project.health_score || 0}%</p>
          <p className="text-[10px] text-muted-foreground">Health Score</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-[9px] font-bold text-amber-500 uppercase">Etapa</span>
          </div>
          <p className="text-lg font-bold text-foreground truncate">{currentStageName}</p>
          <p className="text-[10px] text-muted-foreground">Etapa Atual</p>
        </div>

        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-violet-500" />
            </div>
            <span className="text-[9px] font-bold text-violet-500 uppercase">Valor</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatCurrency(project.contract_value || 0)}</p>
          <p className="text-[10px] text-muted-foreground">Valor do Contrato</p>
        </div>
      </div>

      {/* Project Briefing / Description */}
      <div className="glass-card rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Briefing do Projeto</h3>
              <p className="text-[10px] text-muted-foreground">Descrição, escopo e objetivos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AiGenerateButton
              actionKey="projects.generateBrief"
              entityType="project"
              entityId={project.id}
              hasExistingContent={!!description}
              getContext={() => ({
                id: project.id,
                name: project.name,
                client_name: project.client_name,
                service_type: project.template,
                description: description,
              })}
              onApply={handleApplyBrief}
            />
            {!isEditing && description && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o projeto, escopo, objetivos e entregas..."
              className="min-h-[200px] bg-muted/30"
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setDescription(project.description || '');
                  setIsEditing(false);
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveDescription}>
                Salvar Briefing
              </Button>
            </div>
          </div>
        ) : description ? (
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap bg-muted/20 rounded-xl p-4">
            {description}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Nenhum briefing definido</p>
            <p className="text-xs text-muted-foreground/70 max-w-sm">
              Use o botão "Gerar com IA" para criar um briefing automaticamente ou clique para escrever manualmente.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Escrever Briefing
            </Button>
          </div>
        )}
      </div>

      {/* Project Art Section - AI Generated Images */}
      <ProjectArtSection
        projectId={project.id}
        bannerUrl={(project as any).banner_url}
        coverUrl={(project as any).cover_image_url}
        logoUrl={(project as any).logo_url}
      />

      {/* Timeline Forecast 30D */}
      <TimelineForecast30D 
        milestones={[]} 
        projectId={project.id}
      />

      {/* Project Stages */}
      <div className="glass-card rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Etapas do Projeto</h3>
            <p className="text-[10px] text-muted-foreground">Fluxo de Produção</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {project.stages?.map((stage) => (
            <div key={stage.id} className="bg-muted/30 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate">
                  {stage.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  stage.status === 'completed' ? 'bg-emerald-500' :
                  stage.status === 'in_progress' ? 'bg-primary' :
                  'bg-muted-foreground/30'
                }`} />
                <span className="text-[9px] text-muted-foreground">
                  {stage.status === 'completed' ? 'Concluída' :
                   stage.status === 'in_progress' ? 'Em andamento' :
                   'Não iniciada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card rounded-xl p-4 border-l-2 border-emerald-500">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-[8px] font-bold text-emerald-500 uppercase">Status</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Status do Projeto</p>
          <p className="text-lg font-bold text-foreground capitalize">{project.status}</p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-2 border-primary">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-[8px] font-bold text-primary uppercase">Entrega</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Data de Entrega</p>
          <p className="text-sm font-bold text-foreground">
            {project.due_date ? new Date(project.due_date).toLocaleDateString('pt-BR') : '--'}
          </p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-2 border-amber-500">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-[8px] font-bold text-amber-500 uppercase">Cliente</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Nome do Cliente</p>
          <p className="text-sm font-bold text-foreground truncate">{project.client_name || '--'}</p>
        </div>

        <div className="glass-card rounded-xl p-4 border-l-2 border-violet-500">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-violet-500" />
            <span className="text-[8px] font-bold text-violet-500 uppercase">Bloqueio</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-1">Bloqueio Financeiro</p>
          <p className="text-sm font-bold text-foreground">{project.has_payment_block ? 'Ativo' : 'Inativo'}</p>
        </div>
      </div>
    </div>
  );
}
