import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { ArrowLeft, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  role: AppRole | null;
  role_assignment_id: string | null;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  comercial: "Comercial",
  operacao: "Operação",
  financeiro: "Financeiro",
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  comercial: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  operacao: "bg-green-500/10 text-green-500 border-green-500/20",
  financeiro: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export default function UsersSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      // Get profiles (cast to any to handle stale generated types)
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, created_at, email")
        .order("created_at") as { data: any[] | null; error: any };

      if (pErr) throw pErr;

      // Get role assignments
      const { data: roleAssignments, error: rErr } = await supabase
        .from("user_role_assignments")
        .select("id, user_id, role");

      if (rErr) throw rErr;

      const roleMap = new Map(
        roleAssignments?.map((r) => [
          r.user_id,
          { role: r.role as AppRole, id: r.id },
        ])
      );

      return (profiles || []).map((p: any) => {
        const assignment = roleMap.get(p.user_id);
        return {
          id: p.user_id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          email: p.email,
          created_at: p.created_at,
          role: assignment?.role ?? null,
          role_assignment_id: assignment?.id ?? null,
        } as UserRow;
      });
    },
    enabled: isAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      newRole,
      existingAssignmentId,
    }: {
      userId: string;
      newRole: AppRole;
      existingAssignmentId: string | null;
    }) => {
      if (existingAssignmentId) {
        const { error } = await supabase
          .from("user_role_assignments")
          .update({ role: newRole })
          .eq("id", existingAssignmentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_role_assignments")
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      toast.success("Role atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar role"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Erro ao remover usuário");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      toast.success("Usuário removido!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (roleLoading) {
    return (
      <DashboardLayout title="Usuários">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/configuracoes" replace />;
  }

  return (
    <DashboardLayout title="Gerenciamento de Usuários">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/configuracoes")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-light text-foreground flex items-center gap-2">
              <Users className="w-6 h-6" />
              Gerenciamento de Usuários
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualize, edite roles e remova contas
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">Carregando...</p>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhum usuário encontrado
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(u.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {u.full_name || "Sem nome"}
                          </p>
                          {u.id === user?.id && (
                            <Badge
                              variant="outline"
                              className="text-[10px] mt-0.5"
                            >
                              Você
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role || "operacao"}
                        onValueChange={(val) =>
                          updateRoleMutation.mutate({
                            userId: u.id,
                            newRole: val as AppRole,
                            existingAssignmentId: u.role_assignment_id,
                          })
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(ROLE_LABELS) as AppRole[]
                          ).map((role) => (
                            <SelectItem key={role} value={role}>
                              <span className="flex items-center gap-2">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full ${ROLE_COLORS[role].split(" ")[0]}`}
                                />
                                {ROLE_LABELS[role]}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(u.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.id !== user?.id ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remover usuário
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover{" "}
                                <strong>{u.full_name || u.email}</strong>? Esta
                                ação é irreversível e todos os dados associados
                                serão perdidos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() =>
                                  deleteUserMutation.mutate(u.id)
                                }
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
