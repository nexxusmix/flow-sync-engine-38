import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DangerZoneSettingsPage() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Redirecionar se não for admin
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Acesso restrito a administradores");
      navigate("/configuracoes");
    }
  }, [roleLoading, isAdmin, navigate]);

  const handleReset = async () => {
    if (confirmText !== "ZERAR") {
      toast.error("Digite ZERAR para confirmar");
      return;
    }

    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("platform-reset", {
        body: { confirmation: "ZERAR" }
      });

      if (error) throw error;

      toast.success("Plataforma zerada com sucesso!");
      setIsDialogOpen(false);
      setConfirmText("");
      navigate("/");
    } catch (error: any) {
      console.error("Erro ao zerar plataforma:", error);
      toast.error(error.message || "Erro ao zerar plataforma");
    } finally {
      setIsResetting(false);
    }
  };

  // Loading state
  if (roleLoading) {
    return (
      <DashboardLayout title="Danger Zone">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // Não autorizado (já vai redirecionar, mas mostra mensagem)
  if (!isAdmin) {
    return (
      <DashboardLayout title="Danger Zone">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <ShieldAlert className="w-16 h-16 text-destructive" />
          <p className="text-muted-foreground">Acesso restrito a administradores</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Danger Zone">
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/configuracoes")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-section-title font-light text-foreground tracking-tight">Danger Zone</h1>
            <p className="text-caption text-muted-foreground mt-1">
              Ações irreversíveis e críticas do sistema
            </p>
          </div>
        </div>

        {/* Warning Card */}
        <Card className="border-destructive/50 bg-destructive/5 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-destructive text-lg">Atenção!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                As ações nesta página são <strong>permanentes e irreversíveis</strong>. 
                Certifique-se de que você entende as consequências antes de prosseguir.
              </p>
            </div>
          </div>
        </Card>

        {/* Reset Platform */}
        <Card className="border-destructive/30 p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-destructive" />
                <h3 className="font-semibold text-foreground">Zerar Plataforma</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Remove <strong>todos os dados operacionais</strong> da plataforma:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Projetos e etapas</li>
                <li>Propostas e contratos</li>
                <li>Receitas, despesas e transações financeiras</li>
                <li>Ideias, conteúdos e campanhas de marketing</li>
                <li>Prospects, cadências e atividades de prospecção</li>
                <li>Eventos de calendário e deadlines</li>
                <li>Mensagens e threads do inbox</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                <strong>Mantém:</strong> Usuários, permissões, configurações e estrutura do workspace.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setIsDialogOpen(true)}
              className="flex-shrink-0"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Zerar Tudo
            </Button>
          </div>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Confirmar Reset da Plataforma
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  Esta ação é <strong>irreversível</strong>. Todos os dados operacionais 
                  serão permanentemente removidos.
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Digite <strong className="text-destructive">ZERAR</strong> para confirmar:
                  </label>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="ZERAR"
                    className="font-mono"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isResetting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReset}
                disabled={confirmText !== "ZERAR" || isResetting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Zerando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Confirmar Reset
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
