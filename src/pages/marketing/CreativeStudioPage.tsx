/**
 * CreativeStudioPage — SQUAD FILM / Liquid Glass
 * 3-panel layout: Sidebar (blocks+context) | Editor | Copilot+Actions
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  StudioSidebar,
  StudioCopilot,
  NarrativeScriptEditor,
  BriefEditor,
  ShotlistEditor,
  CopyEditor,
  GenericBlockEditor,
} from '@/components/creative-studio';
import { useCreativeWorks, useCreativeWork, useBlockVersions } from '@/hooks/useCreativeWorks';
import { supabase } from '@/integrations/supabase/client';
import type { CreativeBlockType, NarrativeScriptContent, BriefContent, ShotlistContent, CopyVariationsContent } from '@/types/creative-works';
import type { StudioNavItem } from '@/components/creative-studio/StudioSidebar';
import type { BrandKit } from '@/types/marketing';
import { TemplateStudioPanel } from '@/components/studio/TemplateStudioPanel';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const BLOCK_LABELS: Record<CreativeBlockType, string> = {
  brief: 'Brief',
  narrative_script: 'Roteiro Narrativo',
  storyboard: 'Storyboard',
  storyboard_images: 'Imagens',
  shotlist: 'Shotlist',
  moodboard: 'Moodboard',
  visual_identity: 'Identidade Visual',
  motion_direction: 'Motion / Direção',
  lettering: 'Tipografia',
  copy_variations: 'Copy / Legendas',
};

export default function CreativeStudioPage() {
  const { workId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeBlock, setActiveBlock] = useState<StudioNavItem>('brief');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewResult, setPreviewResult] = useState<Record<string, unknown> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);

  const { createWork } = useCreativeWorks();
  const { work, blocks, isLoading, updateWork, upsertBlock, getBlock } = useCreativeWork(workId);

  const currentBlockType = activeBlock === 'templates' ? 'narrative_script' : activeBlock as CreativeBlockType;
  const currentBlock = getBlock(currentBlockType);
  const { versions } = useBlockVersions(currentBlock?.id);

  useEffect(() => {
    const fetchBrandKits = async () => {
      const { data } = await supabase.from('brand_kits').select('*').order('name');
      if (data) setBrandKits(data as unknown as BrandKit[]);
    };
    fetchBrandKits();
  }, []);

  // Auto-fill brief when project is linked and brief is empty
  useEffect(() => {
    if (!work?.project_id || !workId) return;
    const briefBlock = getBlock('brief');
    if (briefBlock?.content) return; // Brief already has content

    const fillBriefFromProject = async () => {
      const { data: project } = await supabase
        .from('projects')
        .select('name, description, due_date')
        .eq('id', work.project_id!)
        .single();

      if (!project) return;

      // Fetch deliverables
      const { data: milestones } = await (supabase
        .from('payment_milestones' as any)
        .select('title')
        .eq('project_id', work.project_id!) as any);

      const deliverables = (milestones || []).map((m: any) => m.title).filter(Boolean) as string[];

      const briefContent: Record<string, unknown> = {
        objective: project.description?.substring(0, 500) || `Projeto: ${project.name}`,
        audience: '',
        offer: '',
        restrictions: '',
        tone: '',
        deliverables,
        deadline: project.due_date || '',
        references: [],
      };

      await upsertBlock.mutateAsync({
        type: 'brief',
        content: briefContent,
        source: 'manual',
        status: 'draft',
      });

      toast.success('Brief pré-preenchido com dados do projeto!');
    };

    fillBriefFromProject();
  }, [work?.project_id, workId]);

  const handleCreateNewWork = async () => {
    setIsCreating(true);
    try {
      const projectId = searchParams.get('project_id');
      const clientId = searchParams.get('client_id');
      const campaignId = searchParams.get('campaign_id');
      const newWork = await createWork.mutateAsync({
        title: 'Novo Trabalho Criativo',
        project_id: projectId,
        client_id: clientId,
        campaign_id: campaignId,
      });
      navigate(`/marketing/studio/${newWork.id}`, { replace: true });
    } catch (err) {
      console.error('Failed to create work:', err);
      toast.error('Erro ao criar trabalho criativo');
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!workId && !isCreating) {
      handleCreateNewWork();
    }
  }, [workId]);

  const handleGenerate = async () => {
    if (!work) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('studio-generate-block', {
        body: {
          workId: work.id, blockType: currentBlockType, action: 'generate',
          context: { title: work.title, projectId: work.project_id, clientId: work.client_id, campaignId: work.campaign_id },
        },
      });
      if (error) throw error;
      if (data?.content) {
        // Apply directly for non-narrative blocks
        await upsertBlock.mutateAsync({
          type: currentBlockType,
          content: data.content,
          source: 'ai', status: 'draft',
        });
        toast.success('Conteúdo gerado com IA!');
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Erro ao gerar conteúdo');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImprove = async () => {
    if (!work || !currentBlock) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('studio-generate-block', {
        body: {
          workId: work.id, blockType: currentBlockType, action: 'improve',
          currentContent: currentBlock.content,
          context: { title: work.title, projectId: work.project_id, clientId: work.client_id },
        },
      });
      if (error) throw error;
      if (data?.content) setPreviewResult(data.content);
    } catch (err) {
      console.error('Improve error:', err);
      toast.error('Erro ao melhorar conteúdo');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => { await handleGenerate(); };

  // Generic save handler for all block types
  const handleSaveBlock = useCallback(async (content: Record<string, unknown>) => {
    await upsertBlock.mutateAsync({
      type: currentBlockType,
      content,
      source: 'manual', status: 'draft',
    });
  }, [currentBlockType, upsertBlock]);

  const handleApplyPreview = async () => {
    if (!previewResult) return;
    await upsertBlock.mutateAsync({
      type: currentBlockType,
      content: previewResult,
      source: 'ai', status: 'draft',
    });
    setPreviewResult(null);
    toast.success('Conteúdo aplicado!');
  };

  const handleDiscardPreview = () => { setPreviewResult(null); };

  const handleQuickAction = async (action: string, instruction?: string) => {
    if (!work || !currentBlock) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('studio-generate-block', {
        body: {
          workId: work.id, blockType: currentBlockType, action, instruction,
          currentContent: currentBlock.content,
          context: { title: work.title, projectId: work.project_id, clientId: work.client_id },
        },
      });
      if (error) throw error;
      if (data?.content) setPreviewResult(data.content);
    } catch (err) {
      console.error('Quick action error:', err);
      toast.error('Erro ao processar ação');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTitleChange = async (title: string) => {
    if (work) await updateWork.mutateAsync({ title });
  };

  const handleWorkUpdate = async (updates: Partial<typeof work>) => {
    if (work) await updateWork.mutateAsync(updates);
  };

  const handleRestoreVersion = async (version: number) => {
    const targetVersion = versions.find(v => v.version === version);
    if (targetVersion) {
      await upsertBlock.mutateAsync({
        type: currentBlockType,
        content: targetVersion.content as Record<string, unknown>,
        source: 'manual', status: 'draft',
      });
      toast.success(`Versão ${version} restaurada`);
    }
  };

  // -- Actions --
  const handleDuplicate = async () => {
    if (!work) return;
    try {
      const newWork = await createWork.mutateAsync({
        title: `${work.title} (cópia)`,
        client_id: work.client_id,
        project_id: work.project_id,
        campaign_id: work.campaign_id,
        brand_kit_id: work.brand_kit_id,
      });
      // Copy blocks
      for (const block of blocks) {
        await supabase.from('creative_blocks').insert({
          work_id: newWork.id,
          type: block.type,
          content: block.content as any,
          source: block.source,
          title: block.title,
          status: 'draft',
          version: 1,
          order_index: block.order_index,
        });
      }
      toast.success('Trabalho duplicado!');
      navigate(`/marketing/studio/${newWork.id}`);
    } catch {
      toast.error('Erro ao duplicar');
    }
  };

  const handleArchive = async () => {
    if (!work) return;
    try {
      await updateWork.mutateAsync({ status: 'archived' } as any);
      toast.success('Trabalho arquivado');
      navigate('/marketing/studio');
    } catch {
      toast.error('Erro ao arquivar');
    }
  };

  if (isLoading || !workId) {
    return (
      <DashboardLayout title="Studio Criativo">
        <div className="h-full flex items-center justify-center">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  const renderBlockEditor = () => {
    switch (activeBlock) {
      case 'brief':
        return (
          <BriefEditor
            block={currentBlock || null}
            onSave={(c) => handleSaveBlock(c as unknown as Record<string, unknown>)}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        );
      case 'narrative_script':
        return (
          <NarrativeScriptEditor
            block={currentBlock || null}
            onSave={(c) => handleSaveBlock(c as unknown as Record<string, unknown>)}
            onGenerate={handleGenerate}
            onImprove={handleImprove}
            onRegenerate={handleRegenerate}
            isGenerating={isGenerating}
            versions={versions.map(v => ({ version: v.version, created_at: v.created_at }))}
            onRestoreVersion={handleRestoreVersion}
          />
        );
      case 'shotlist':
        return (
          <ShotlistEditor
            block={currentBlock || null}
            onSave={(c) => handleSaveBlock(c as unknown as Record<string, unknown>)}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        );
      case 'copy_variations':
        return (
          <CopyEditor
            block={currentBlock || null}
            onSave={(c) => handleSaveBlock(c as unknown as Record<string, unknown>)}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        );
      case 'storyboard':
      case 'storyboard_images':
      case 'moodboard':
      case 'visual_identity':
      case 'motion_direction':
      case 'lettering':
        return (
          <GenericBlockEditor
            blockType={currentBlockType}
            block={currentBlock || null}
            onSave={handleSaveBlock}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="Studio Criativo">
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Sidebar */}
        <StudioSidebar
          work={work || null}
          blocks={blocks}
          activeBlock={activeBlock}
          onBlockSelect={setActiveBlock}
          onWorkUpdate={handleWorkUpdate}
          onTitleChange={handleTitleChange}
        />

        {/* Main Editor */}
        <div className="flex-1 bg-background overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[200px] bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.04)_0%,transparent_70%)] pointer-events-none z-0" />
          <div className="relative z-10 h-full">
            {activeBlock === 'templates' ? (
              <div className="h-full p-4">
                <TemplateStudioPanel brandKits={brandKits} />
              </div>
            ) : (
              renderBlockEditor()
            )}
          </div>
        </div>

        {/* Copilot Panel */}
        <StudioCopilot
          work={work || null}
          currentBlock={currentBlock || null}
          onQuickAction={handleQuickAction}
          isProcessing={isGenerating}
          previewResult={previewResult}
          onApplyPreview={handleApplyPreview}
          onDiscardPreview={handleDiscardPreview}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
        />
      </div>
    </DashboardLayout>
  );
}
