import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface Deliverable {
  id: string;
  project_id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  priority: string;
  due_date: string | null;
  created_by: string | null;
  assigned_to: string | null;
  order_index: number;
  is_archived: boolean;
  lock_reason: string | null;
  last_activity_at: string | null;
  file_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  thumbnail_url: string | null;
  link_url: string | null;
  link_provider: string | null;
  version_number: number;
  created_at: string;
  updated_at: string;
}

export const DELIVERABLE_STATUSES = [
  { key: "not_started", label: "Não iniciado", color: "bg-muted text-muted-foreground" },
  { key: "in_production", label: "Em produção", color: "bg-blue-500/20 text-blue-400" },
  { key: "in_review", label: "Em revisão", color: "bg-amber-500/20 text-amber-400" },
  { key: "approved", label: "Aprovado", color: "bg-emerald-500/20 text-emerald-400" },
  { key: "delivered", label: "Entregue", color: "bg-primary/20 text-primary" },
  { key: "blocked", label: "Bloqueado", color: "bg-destructive/20 text-destructive" },
] as const;

export const DELIVERABLE_TYPES = [
  { key: "video", label: "Vídeo" },
  { key: "image", label: "Imagem" },
  { key: "pdf", label: "PDF" },
  { key: "file", label: "Arquivo" },
  { key: "link", label: "Link" },
  { key: "package", label: "Pacote" },
] as const;

export function useDeliverables(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["deliverables", projectId];

  const { data: deliverables = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_deliverables")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_archived", false)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Deliverable[];
    },
    enabled: !!projectId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`deliverables-${projectId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "project_deliverables",
        filter: `project_id=eq.${projectId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, queryClient, queryKey]);

  const createDeliverable = useMutation({
    mutationFn: async (input: Partial<Deliverable>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("project_deliverables")
        .insert({
          project_id: projectId,
          workspace_id: input.workspace_id || "",
          name: input.name || "Novo entregável",
          description: input.description || null,
          status: input.status || "not_started",
          type: input.type || "file",
          priority: input.priority || "normal",
          due_date: input.due_date || null,
          created_by: userData.user.id,
          file_url: input.file_url || null,
          file_name: input.file_name || null,
          mime_type: input.mime_type || null,
          file_size: input.file_size || null,
          thumbnail_url: input.thumbnail_url || null,
          link_url: input.link_url || null,
          link_provider: input.link_provider || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Deliverable;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Entregável criado!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar entregável"),
  });

  const updateDeliverable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Deliverable> & { id: string }) => {
      const { error } = await supabase
        .from("project_deliverables")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Entregável atualizado!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar"),
  });

  const deleteDeliverable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_deliverables")
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Entregável arquivado!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao arquivar"),
  });

  const uploadFile = async (file: File): Promise<{ url: string; path: string }> => {
    const ext = file.name.split(".").pop();
    const path = `${projectId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("project-files")
      .upload(path, file, { upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
    return { url: urlData.publicUrl, path };
  };

  return {
    deliverables,
    isLoading,
    createDeliverable,
    updateDeliverable,
    deleteDeliverable,
    uploadFile,
  };
}
