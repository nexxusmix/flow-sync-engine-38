import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  role: WorkspaceRole;
  status: string;
  created_at: string;
  expires_at: string;
}

const DEFAULT_WORKSPACE = "00000000-0000-0000-0000-000000000000";

export function useWorkspaceMembers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["workspace-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_members" as any)
        .select("*, profiles:user_id(full_name, email, avatar_url)")
        .eq("workspace_id", DEFAULT_WORKSPACE)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return (data as any[]) as WorkspaceMember[];
    },
    enabled: !!user?.id,
  });

  const invitesQuery = useQuery({
    queryKey: ["workspace-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_invites" as any)
        .select("*")
        .eq("workspace_id", DEFAULT_WORKSPACE)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as any[]) as WorkspaceInvite[];
    },
    enabled: !!user?.id,
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: WorkspaceRole }) => {
      const { error } = await supabase
        .from("workspace_invites" as any)
        .insert({
          workspace_id: DEFAULT_WORKSPACE,
          email,
          role,
          invited_by: user?.id,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-invites"] });
      toast.success("Convite enviado com sucesso");
    },
    onError: (err: any) => {
      toast.error("Erro ao enviar convite: " + err.message);
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: WorkspaceRole }) => {
      const { error } = await supabase
        .from("workspace_members" as any)
        .update({ role } as any)
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
      toast.success("Papel atualizado");
    },
    onError: (err: any) => {
      toast.error("Erro ao atualizar: " + err.message);
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("workspace_members" as any)
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members"] });
      toast.success("Membro removido");
    },
    onError: (err: any) => {
      toast.error("Erro ao remover: " + err.message);
    },
  });

  const cancelInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("workspace_invites" as any)
        .update({ status: "cancelled" } as any)
        .eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-invites"] });
      toast.success("Convite cancelado");
    },
    onError: (err: any) => {
      toast.error("Erro ao cancelar: " + err.message);
    },
  });

  const currentMember = membersQuery.data?.find((m) => m.user_id === user?.id);
  const isOwnerOrAdmin = currentMember?.role === "owner" || currentMember?.role === "admin";

  return {
    members: membersQuery.data ?? [],
    invites: invitesQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    currentMember,
    isOwnerOrAdmin,
    inviteMember,
    updateRole,
    removeMember,
    cancelInvite,
  };
}
