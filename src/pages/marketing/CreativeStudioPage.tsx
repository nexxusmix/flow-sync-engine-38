import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  StudioSidebar,
  StudioCopilot,
  NarrativeScriptEditor,
  EmptyBlockPlaceholder,
} from '@/components/creative-studio';
import { useCreativeWorks, useCreativeWork, useBlockVersions } from '@/hooks/useCreativeWorks';
import { supabase } from '@/integrations/supabase/client';
import type { CreativeBlockType, NarrativeScriptContent } from '@/types/creative-works';
import type { StudioNavItem } from '@/components/creative-studio/StudioSidebar';
import type { BrandKit } from '@/types/marketing';
import { TemplateStudioPanel } from '@/components/studio/TemplateStudioPanel';

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
  
  const [activeBlock, setActiveBlock] = useState<StudioNavItem>('narrative_script');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewResult, setPreviewResult] = useState<Record<string, unknown> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);

  const { createWork } = useCreativeWorks();
  const { work, blocks, isLoading, updateWork, upsertBlock, getBlock } = useCreativeWork(workId);
  
  const currentBlockType = activeBlock === 'templates' ? 'narrative_script' : activeBlock as CreativeBlockType;
  const currentBlock = getBlock(currentBlockType);
  const { versions } = useBlockVersions(currentBlock?.id);

  // Fetch brand kits for templates panel
  useEffect(() => {
    const fetchBrandKits = async () => {
      const { data } = await supabase.from('brand_kits').select('*').order('name');
      if (data) setBrandKits(data as unknown as BrandKit[]);
    };
    fetchBrandKits();
  }, []);

  // Create new work handler
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

  // Auto-create on mount if no workId
  useEffect(() => {
    if (!workId && !isCreating) {
      handleCreateNewWork();
    }
  }, [workId]);

  // Generate content with AI
  const handleGenerate = async () => {
    if (!work) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('studio-generate-block', {
        body: {
          workId: work.id,
          blockType: currentBlockType,
          action: 'generate',
          context: {
            title: work.title,
            projectId: work.project_id,
            clientId: work.client_id,
            campaignId: work.campaign_id,
          },
        },
      });

      if (error) throw error;
      
      if (data?.content) {
        setPreviewResult(data.content);
      }
    } catch (err) {
      console.error('Generate error:', err);
      toast.error('Erro ao gerar conteúdo');
    } finally {
      setIsGenerating(false);
    }
  };

  // Improve existing content
  const handleImprove = async () => {
    if (!work || !currentBlock) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('studio-generate-block', {
        body: {
          workId: work.id,
          blockType: currentBlockType,
          action: 'improve',
          currentContent: currentBlock.content,
          context: {
            title: work.title,
            projectId: work.project_id,
            clientId: work.client_id,
          },
        },
      });

      if (error) throw error;
      
      if (data?.content) {
        setPreviewResult(data.content);
      }
    } catch (err) {
      console.error('Improve error:', err);
      toast.error('Erro ao melhorar conteúdo');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate (same as generate but with warning)
  const handleRegenerate = async () => {
    await handleGenerate();
  };

  // Save block content
  const handleSaveBlock = async (content: NarrativeScriptContent) => {
    await upsertBlock.mutateAsync({
      type: currentBlockType,
      content: content as unknown as Record<string, unknown>,
      source: 'manual',
      status: 'draft',
    });
  };

  // Apply preview result
  const handleApplyPreview = async () => {
    if (!previewResult) return;
    
    await upsertBlock.mutateAsync({
      type: currentBlockType,
      content: previewResult,
      source: 'ai',
      status: 'draft',
    });
    
    setPreviewResult(null);
    toast.success('Conteúdo aplicado!');
  };

  // Discard preview
  const handleDiscardPreview = () => {
    setPreviewResult(null);
  };

  // Quick actions from copilot
  const handleQuickAction = async (action: string, instruction?: string) => {
    if (!work || !currentBlock) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('studio-generate-block', {
        body: {
          workId: work.id,
          blockType: currentBlockType,
          action,
          instruction,
          currentContent: currentBlock.content,
          context: {
            title: work.title,
            projectId: work.project_id,
            clientId: work.client_id,
          },
        },
      });

      if (error) throw error;
      
      if (data?.content) {
        setPreviewResult(data.content);
      }
    } catch (err) {
      console.error('Quick action error:', err);
      toast.error('Erro ao processar ação');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle title change
  const handleTitleChange = async (title: string) => {
    if (work) {
      await updateWork.mutateAsync({ title });
    }
  };

  // Handle work context update
  const handleWorkUpdate = async (updates: Partial<typeof work>) => {
    if (work) {
      await updateWork.mutateAsync(updates);
    }
  };

  // Restore version
  const handleRestoreVersion = async (version: number) => {
    const targetVersion = versions.find(v => v.version === version);
    if (targetVersion) {
      await upsertBlock.mutateAsync({
        type: currentBlockType,
        content: targetVersion.content as Record<string, unknown>,
        source: 'manual',
        status: 'draft',
      });
      toast.success(`Versão ${version} restaurada`);
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

  // Render block editor based on active type
  const renderBlockEditor = () => {
    switch (activeBlock) {
      case 'narrative_script':
        return (
          <NarrativeScriptEditor
            block={currentBlock || null}
            onSave={handleSaveBlock}
            onGenerate={handleGenerate}
            onImprove={handleImprove}
            onRegenerate={handleRegenerate}
            isGenerating={isGenerating}
            versions={versions.map(v => ({ version: v.version, created_at: v.created_at }))}
            onRestoreVersion={handleRestoreVersion}
          />
        );
      default:
        return (
          <EmptyBlockPlaceholder
            blockType={currentBlockType}
            blockLabel={BLOCK_LABELS[currentBlockType]}
            onGenerate={handleGenerate}
          />
        );
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
        <div className="flex-1 bg-background overflow-hidden">
          {activeBlock === 'templates' ? (
            <div className="h-full p-4">
              <TemplateStudioPanel brandKits={brandKits} />
            </div>
          ) : (
            renderBlockEditor()
          )}
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
        />
      </div>
    </DashboardLayout>
  );
}
