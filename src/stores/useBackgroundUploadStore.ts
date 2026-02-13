import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BackgroundUploadItem {
  id: string;
  fileName: string;
  file: File;
  projectId: string;
  category: string;
  visibility: string;
  aiProcess: boolean;
  status: 'queued' | 'uploading' | 'done' | 'error';
  progress: number;
}

interface BackgroundUploadState {
  items: BackgroundUploadItem[];
  isProcessing: boolean;
  minimized: boolean;
  addItems: (items: Omit<BackgroundUploadItem, 'status' | 'progress'>[]) => void;
  dismiss: () => void;
  setMinimized: (v: boolean) => void;
}

function detectAssetType(file: File): string {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type === 'application/pdf') return 'document';
  return 'document';
}

async function uploadSingleFile(item: BackgroundUploadItem, userId: string | undefined): Promise<boolean> {
  const ext = item.file.name.split('.').pop() || '';
  const ts = Date.now();
  const sanitized = item.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${item.projectId}/assets/${ts}_${sanitized}`;

  try {
    const { error: uploadErr } = await supabase.storage
      .from('project-files')
      .upload(storagePath, item.file);
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(storagePath);
    const assetType = detectAssetType(item.file);

    const { data, error: dbErr } = await supabase
      .from('project_assets')
      .insert({
        project_id: item.projectId,
        uploaded_by_user_id: userId,
        source_type: 'file' as const,
        asset_type: assetType,
        title: item.file.name.replace(/\.[^.]+$/, ''),
        category: item.category,
        visibility: item.visibility,
        storage_bucket: 'project-files',
        storage_path: storagePath,
        file_name: item.file.name,
        file_ext: ext,
        mime_type: item.file.type,
        file_size_bytes: item.file.size,
        thumb_url: assetType === 'image' ? urlData.publicUrl : null,
        status: assetType === 'image' ? 'ready' : 'processing',
      })
      .select()
      .single();
    if (dbErr) throw dbErr;

    if (assetType === 'image') {
      await supabase.from('project_assets').update({ status: 'ready' }).eq('id', data.id);
    }

    if (item.aiProcess) {
      try {
        await supabase.functions.invoke('process-asset', { body: { asset_id: data.id } });
      } catch (e) {
        console.warn('AI processing failed:', e);
      }
    }

    return true;
  } catch (err) {
    console.error('Background upload error:', err);
    return false;
  }
}

export const useBackgroundUploadStore = create<BackgroundUploadState>((set, get) => ({
  items: [],
  isProcessing: false,
  minimized: false,

  setMinimized: (v) => set({ minimized: v }),

  dismiss: () => {
    const { isProcessing } = get();
    if (!isProcessing) {
      set({ items: [] });
    }
  },

  addItems: (newItems) => {
    const mapped: BackgroundUploadItem[] = newItems.map(i => ({
      ...i,
      status: 'queued' as const,
      progress: 0,
    }));

    set(state => ({ items: [...state.items, ...mapped] }));

    // Start processing if not already
    const { isProcessing } = get();
    if (!isProcessing) {
      processQueue();
    }
  },
}));

async function processQueue() {
  const store = useBackgroundUploadStore;
  store.setState({ isProcessing: true });

  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  while (true) {
    const items = store.getState().items;
    const next = items.find(i => i.status === 'queued');
    if (!next) break;

    // Mark uploading
    store.setState({
      items: store.getState().items.map(i =>
        i.id === next.id ? { ...i, status: 'uploading' as const, progress: 50 } : i
      ),
    });

    const success = await uploadSingleFile(next, userId);

    store.setState({
      items: store.getState().items.map(i =>
        i.id === next.id ? { ...i, status: success ? 'done' as const : 'error' as const, progress: success ? 100 : 0 } : i
      ),
    });
  }

  const finalItems = store.getState().items;
  const doneCount = finalItems.filter(i => i.status === 'done').length;
  const errorCount = finalItems.filter(i => i.status === 'error').length;

  if (errorCount === 0 && doneCount > 0) {
    toast.success(`${doneCount} material(is) enviado(s) com sucesso!`);
  } else if (errorCount > 0) {
    toast.error(`${errorCount} arquivo(s) falharam no envio`);
  }

  store.setState({ isProcessing: false });
}
