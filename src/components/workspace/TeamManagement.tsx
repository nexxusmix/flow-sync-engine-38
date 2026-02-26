import { useState } from "react";
import { useWorkspaceMembers, WorkspaceRole } from "@/hooks/useWorkspaceMembers";
import { useWorkspacePresence } from "@/hooks/useWorkspacePresence";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { UserPlus, Shield, Crown, Eye, Pencil, Trash2, X, Mail, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const roleLabels: Record<WorkspaceRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Visualizador",
};

const roleIcons: Record<WorkspaceRole, React.ReactNode> = {
  owner: <Crown className="w-3.5 h-3.5" />,
  admin: <Shield className="w-3.5 h-3.5" />,
  editor: <Pencil className="w-3.5 h-3.5" />,
  viewer: <Eye className="w-3.5 h-3.5" />,
};

const roleBadgeClass: Record<WorkspaceRole, string> = {
  owner: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  admin: "bg-primary/15 text-primary border-primary/20",
  editor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  viewer: "bg-muted text-muted-foreground border-border",
};

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

export function TeamManagement() {
  const { user } = useAuth();
  const {
    members,
    invites,
    isLoading,
    currentMember,
    isOwnerOrAdmin,
    inviteMember,
    updateRole,
    removeMember,
    cancelInvite,
  } = useWorkspaceMembers();
  const { isOnline } = useWorkspacePresence();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("editor");

  const [inviteLoading, setInviteLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setInviteLoading(true);
    try {
      // Call edge function to send actual invite email
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: email.trim(), role },
      });
      if (error) throw error;

      // Also create workspace invite record
      inviteMember.mutate(
        { email: email.trim(), role },
        {
          onSuccess: () => {
            setEmail("");
            setInviteOpen(false);
            toast.success(`Convite enviado para ${email.trim()}`);
          },
        }
      );
    } catch (err: any) {
      toast.error("Erro ao enviar convite: " + (err.message || "erro desconhecido"));
    } finally {
      setInviteLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light tracking-wide text-foreground">Equipe</h2>
          <p className="text-sm text-muted-foreground font-light mt-1">
            {members.length} membro{members.length !== 1 ? "s" : ""} no workspace
          </p>
        </div>
        {isOwnerOrAdmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Convidar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-light tracking-wide">Convidar membro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Email</label>
                  <Input
                    type="email"
                    placeholder="nome@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Papel</label>
                  <Select value={role} onValueChange={(v) => setRole(v as WorkspaceRole)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleInvite}
                  disabled={!email.trim() || inviteLoading}
                  className="w-full"
                >
                  {inviteLoading ? "Enviando..." : "Enviar convite"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Members list */}
      <div className="space-y-2">
        <AnimatePresence>
          {members.map((member, i) => {
            const profile = member.profile;
            const isCurrentUser = member.user_id === user?.id;
            const isOwner = member.role === "owner";

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50 hover:border-border transition-colors"
              >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-light">
                    {getInitials(profile?.full_name, profile?.email)}
                  </AvatarFallback>
                </Avatar>
                {isOnline(member.user_id) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                )}
              </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {profile?.full_name || profile?.email || "Sem nome"}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">você</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                </div>

                <Badge variant="outline" className={cn("gap-1 text-[10px] uppercase tracking-wider", roleBadgeClass[member.role])}>
                  {roleIcons[member.role]}
                  {roleLabels[member.role]}
                </Badge>

                {isOwnerOrAdmin && !isOwner && !isCurrentUser && (
                  <div className="flex items-center gap-1">
                    <Select
                      value={member.role}
                      onValueChange={(v) => updateRole.mutate({ memberId: member.id, role: v as WorkspaceRole })}
                    >
                      <SelectTrigger className="h-7 w-7 p-0 border-0 bg-transparent [&>svg]:hidden">
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/60 hover:text-destructive"
                      onClick={() => removeMember.mutate(member.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-light text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Convites pendentes
          </h3>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-dashed border-border/50"
              >
                <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expira em {new Date(invite.expires_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Badge variant="outline" className={cn("gap-1 text-[10px] uppercase tracking-wider", roleBadgeClass[invite.role])}>
                  {roleIcons[invite.role]}
                  {roleLabels[invite.role]}
                </Badge>
                {isOwnerOrAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => cancelInvite.mutate(invite.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
