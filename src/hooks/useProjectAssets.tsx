import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface ProjectAsset {
  id: string;
  workspace_id: string;
  project_id: string;
  uploaded_by_user_id: string | null;
  uploaded_by_client_name: string | null;
  source_type: 'file' | 'link';
  asset_type: 'image' | 'video' | 'pdf' | 'audio' | 'zip' | 'link' | 'other';
  title: string;
  description: string | null;
  tags: string[];
  visibility: 'internal' | 'client' | 'both';
  category: 'deliverable' | 'reference' | 'raw' | 'contract' | 'finance' | 'other';
  status: 'processing' | 'ready' | 'failed';
  stage_key: string | null;
  deliverable_id: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_ext: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  url: string | null;
  provider: 'youtube' | 'vimeo' | 'drive' | 'generic' | null;
  embed_url: string | null;
  og_image_url: string | null;
  thumb_url: string | null;
  preview_url: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  ai_title: string | null;
  ai_summary: string | null;
  ai_tags: string[] | null;
  ai_entities: any;
  ai_confidence: number | null;
  ai_processed: boolean;
  created_at: string;
  updated_at: string;
}

function detectAssetType(file: File): ProjectAsset['asset_type'] {
  const t = file.type;
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  if (t === 'application/pdf') return 'pdf';
  if (t.includes('zip') || t.includes('rar') || t.includes('tar')) return 'zip';
  return 'other';
}

function detectLinkProvider(url: string): { provider: ProjectAsset['provider']; embedUrl: string | null; thumbUrl: string | null } {
  try {
    const u = new URL(url);
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) {
      return {
        provider: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
        thumbUrl: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
      };
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return {
        provider: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        thumbUrl: null,
      };
    }
    // Drive
    if (u.hostname.includes('drive.google.com')) {
      return { provider: 'drive', embedUrl: null, thumbUrl: null };
    }
    return { provider: 'generic', embedUrl: null, thumbUrl: null };
  } catch {
    return { provider: 'generic', embedUrl: null, thumbUrl: null };
  }
}

interface UploadAssetParams {
  file: File;
  projectId: string;
  category?: ProjectAsset['category'];
  visibility?: ProjectAsset['visibility'];
  stageKey?: string;
  aiProcess?: boolean;
  onProgress?: (pct: number) => void;
}

interface AddLinkParams {
  url: string;
  projectId: string;
  title?: string;
  category?: ProjectAsset['category'];
  visibility?: ProjectAsset['visibility'];
  aiProcess?: boolean;
}

export function useProjectAssets(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['project-assets', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectAsset[];
    },
    enabled: !!projectId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`project-assets-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_assets',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['project-assets', projectId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, queryClient]);

  const uploadAsset = useMutation({
    mutationFn: async ({ file, projectId, category = 'other', visibility = 'internal', stageKey, aiProcess = true }: UploadAssetParams) => {
      const ext = file.name.split('.').pop() || '';
      const ts = Date.now();
      const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${projectId}/assets/${ts}_${sanitized}`;

      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from('project-files')
        .upload(storagePath, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(storagePath);
      const assetType = detectAssetType(file);

      // Insert DB record
      const { data, error: dbErr } = await supabase
        .from('project_assets')
        .insert({
          project_id: projectId,
          uploaded_by_user_id: user?.id,
          source_type: 'file' as const,
          asset_type: assetType,
          title: file.name.replace(/\.[^.]+$/, ''),
          category,
          visibility,
          stage_key: stageKey || null,
          storage_bucket: 'project-files',
          storage_path: storagePath,
          file_name: file.name,
          file_ext: ext,
          mime_type: file.type,
          file_size_bytes: file.size,
          thumb_url: assetType === 'image' ? urlData.publicUrl : null,
          status: assetType === 'image' ? 'ready' : 'processing',
        })
        .select()
        .single();
      if (dbErr) throw dbErr;

      // For images, mark ready immediately. For others, trigger processing.
      if (assetType === 'image') {
        // Update status to ready
        await supabase.from('project_assets').update({ status: 'ready' }).eq('id', data.id);
      }

      // Trigger AI enrichment if enabled
      if (aiProcess) {
        try {
          await supabase.functions.invoke('process-asset', {
            body: { asset_id: data.id },
          });
        } catch (e) {
          console.warn('AI processing request failed, asset saved without AI:', e);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-assets', projectId] });
    },
    onError: (err) => {
      console.error('Upload error:', err);
      toast.error('Erro ao enviar arquivo');
    },
  });

  const addLink = useMutation({
    mutationFn: async ({ url, projectId, title, category = 'reference', visibility = 'both', aiProcess = true }: AddLinkParams) => {
      const { provider, embedUrl, thumbUrl } = detectLinkProvider(url);

      const { data, error } = await supabase
        .from('project_assets')
        .insert({
          project_id: projectId,
          uploaded_by_user_id: user?.id,
          source_type: 'link' as const,
          asset_type: 'link' as const,
          title: title || url,
          category,
          visibility,
          url,
          provider,
          embed_url: embedUrl,
          thumb_url: thumbUrl,
          status: 'ready' as const,
        })
        .select()
        .single();
      if (error) throw error;

      if (aiProcess) {
        try {
          await supabase.functions.invoke('process-asset', { body: { asset_id: data.id } });
        } catch (e) {
          console.warn('AI processing for link failed:', e);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-assets', projectId] });
      toast.success('Link adicionado!');
    },
    onError: (err) => {
      console.error('Add link error:', err);
      toast.error('Erro ao adicionar link');
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (assetId: string) => {
      const asset = assets.find(a => a.id === assetId);
      if (asset?.storage_path) {
        await supabase.storage.from('project-files').remove([asset.storage_path]);
      }
      const { error } = await supabase.from('project_assets').delete().eq('id', assetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-assets', projectId] });
      toast.success('Material excluído');
    },
    onError: () => toast.error('Erro ao excluir material'),
  });

  const deliverables = assets.filter(a => a.category === 'deliverable' && a.status === 'ready');
  const references = assets.filter(a => a.category === 'reference');
  const mediaAssets = assets.filter(a => ['image', 'video', 'link'].includes(a.asset_type) && a.status === 'ready');

  return {
    assets,
    deliverables,
    references,
    mediaAssets,
    isLoading,
    uploadAsset,
    addLink,
    deleteAsset,
  };
}
