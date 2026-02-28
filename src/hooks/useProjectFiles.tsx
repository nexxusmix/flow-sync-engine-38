import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Dynamic folder type - accepts any string slug
export type FileFolder = string;

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  folder: FileFolder;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  visible_in_portal: boolean;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  tags: string[];
  created_at: string;
}

export interface FileCategory {
  id: string;
  project_id: string | null;
  name: string;
  slug: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

interface UploadFileParams {
  file: File;
  folder: FileFolder;
  projectId: string;
  visibleInPortal?: boolean;
}

export function useProjectFiles(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch categories (defaults + project-specific)
  const { data: categories = [] } = useQuery({
    queryKey: ['project-file-categories', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_file_categories')
        .select('*')
        .or(`is_default.eq.true,project_id.eq.${projectId}`)
        .order('is_default', { ascending: false })
        .order('name');
      if (error) throw error;
      return data as FileCategory[];
    },
    enabled: !!projectId,
  });

  const { data: files = [], isLoading, error } = useQuery({
    queryKey: ['project-files', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProjectFile[];
    },
    enabled: !!projectId,
  });

  const uploadFile = useMutation({
    mutationFn: async ({ file, folder, projectId, visibleInPortal = false }: UploadFileParams) => {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${projectId}/${folder}/${timestamp}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(storagePath);

      let uploaderName = user?.email || 'Unknown';
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) uploaderName = profile.full_name;
      }

      const { data, error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          name: file.name,
          folder,
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          visible_in_portal: visibleInPortal,
          uploaded_by: user?.id,
          uploaded_by_name: uploaderName,
          tags: [],
        })
        .select()
        .single();
      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      toast.success('Arquivo enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar arquivo');
    },
  });

  const createCategory = useMutation({
    mutationFn: async ({ name, slug, projectId: pid }: { name: string; slug: string; projectId: string }) => {
      const { data, error } = await supabase
        .from('project_file_categories')
        .insert({ project_id: pid, name, slug, icon: 'folder', is_default: false })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-file-categories', projectId] });
      toast.success('Categoria criada!');
    },
    onError: () => toast.error('Erro ao criar categoria'),
  });

  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      const { data: file, error: fetchError } = await supabase
        .from('project_files')
        .select('file_url')
        .eq('id', fileId)
        .single();
      if (fetchError) throw fetchError;

      const url = new URL(file.file_url);
      const pathParts = url.pathname.split('/storage/v1/object/public/project-files/');
      if (pathParts.length > 1) {
        const storagePath = decodeURIComponent(pathParts[1]);
        await supabase.storage.from('project-files').remove([storagePath]);
      }

      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      toast.success('Arquivo excluído');
    },
    onError: () => toast.error('Erro ao excluir arquivo'),
  });

  const updateFile = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectFile> & { id: string }) => {
      const { data, error } = await supabase
        .from('project_files')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      toast.success('Arquivo atualizado');
    },
    onError: () => toast.error('Erro ao atualizar arquivo'),
  });

  const moveFile = useMutation({
    mutationFn: async ({ fileId, newFolder }: { fileId: string; newFolder: FileFolder }) => {
      const { data, error } = await supabase
        .from('project_files')
        .update({ folder: newFolder })
        .eq('id', fileId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      toast.success('Arquivo movido');
    },
    onError: () => toast.error('Erro ao mover arquivo'),
  });

  const togglePortalVisibility = useMutation({
    mutationFn: async ({ fileId, visible }: { fileId: string; visible: boolean }) => {
      const { data, error } = await supabase
        .from('project_files')
        .update({ visible_in_portal: visible })
        .eq('id', fileId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
      toast.success(data.visible_in_portal ? 'Arquivo visível no portal' : 'Arquivo oculto do portal');
    },
    onError: () => toast.error('Erro ao alterar visibilidade'),
  });

  // Group files by folder
  const filesByFolder = files.reduce((acc, file) => {
    if (!acc[file.folder]) acc[file.folder] = [];
    acc[file.folder].push(file);
    return acc;
  }, {} as Record<FileFolder, ProjectFile[]>);

  // Build ordered folder list from categories
  const folderOrder = categories.map(c => c.slug);
  // Add any folders from files that aren't in categories
  files.forEach(f => {
    if (!folderOrder.includes(f.folder)) folderOrder.push(f.folder);
  });

  return {
    files,
    filesByFolder,
    categories,
    folderOrder,
    isLoading,
    error,
    uploadFile,
    deleteFile,
    updateFile,
    moveFile,
    togglePortalVisibility,
    createCategory,
  };
}
