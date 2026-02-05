import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { UserRole, Permission, PERMISSION_LABELS, MODULE_LABELS, RolePermissions } from "@/types/settings";
import { ArrowLeft, Shield, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const MODULES = ['projects', 'finance', 'proposals', 'contracts', 'marketing', 'prospecting', 'reports', 'settings'];
const ALL_PERMISSIONS: Permission[] = ['read', 'write', 'delete', 'approve', 'send', 'sign', 'export', 'sensitive'];

export default function RolesSettingsPage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: {} as RolePermissions });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name');

      if (error) throw error;
      setRoles((data || []) as unknown as UserRole[]);
    } catch (error) {
      console.error("Error loading roles:", error);
      toast.error("Erro ao carregar papéis");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permissions: {} });
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: UserRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || {},
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome do papel é obrigatório");
      return;
    }

    try {
      if (editingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions as unknown as Record<string, never>,
          })
          .eq('id', editingRole.id);

        if (error) throw error;
        toast.success("Papel atualizado!");
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert([{
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions as unknown as Record<string, never>,
            is_system: false,
          }]);

        if (error) throw error;
        toast.success("Papel criado!");
      }

      setIsDialogOpen(false);
      loadRoles();
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("Erro ao salvar papel");
    }
  };

  const handleDelete = async (role: UserRole) => {
    if (role.is_system) {
      toast.error("Não é possível excluir papéis do sistema");
      return;
    }

    if (!confirm(`Excluir papel "${role.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', role.id);

      if (error) throw error;
      toast.success("Papel excluído!");
      loadRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Erro ao excluir papel");
    }
  };

  const togglePermission = (module: string, permission: Permission) => {
    const currentPerms = formData.permissions[module as keyof RolePermissions] || [];
    const newPerms = currentPerms.includes(permission)
      ? currentPerms.filter(p => p !== permission)
      : [...currentPerms, permission];
    
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [module]: newPerms,
      },
    });
  };

  const hasPermission = (module: string, permission: Permission) => {
    const perms = formData.permissions[module as keyof RolePermissions] || [];
    return perms.includes(permission);
  };

  if (loading) {
    return (
      <DashboardLayout title="Papéis e Permissões">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Papéis e Permissões">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Papéis e Permissões</h1>
              <p className="text-sm text-muted-foreground">Controle de acesso por módulo (RBAC)</p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Papel
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className={`w-5 h-5 ${role.is_system ? 'text-amber-500' : 'text-primary'}`} />
                    <CardTitle className="text-base font-medium">{role.name}</CardTitle>
                  </div>
                  {role.is_system && (
                    <Badge variant="outline" className="text-xs">Sistema</Badge>
                  )}
                </div>
                {role.description && (
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {Object.entries(role.permissions || {}).map(([module, perms]) => (
                    perms && perms.length > 0 && (
                      <Badge key={module} variant="secondary" className="text-[10px]">
                        {MODULE_LABELS[module] || module}: {perms.length}
                      </Badge>
                    )
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEditDialog(role)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  {!role.is_system && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(role)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? `Editar: ${editingRole.name}` : 'Novo Papel'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Papel</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Gerente de Projetos"
                    disabled={editingRole?.is_system}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Permissões por Módulo</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium">Módulo</th>
                        {ALL_PERMISSIONS.map(p => (
                          <th key={p} className="text-center p-2 font-medium text-xs">
                            {PERMISSION_LABELS[p]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map(module => (
                        <tr key={module} className="border-t">
                          <td className="p-2 font-medium">{MODULE_LABELS[module]}</td>
                          {ALL_PERMISSIONS.map(perm => (
                            <td key={perm} className="text-center p-2">
                              <Checkbox
                                checked={hasPermission(module, perm)}
                                onCheckedChange={() => togglePermission(module, perm)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingRole ? 'Salvar Alterações' : 'Criar Papel'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
