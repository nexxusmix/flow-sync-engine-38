import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TeamManagement } from "@/components/workspace/TeamManagement";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TeamSettingsPage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Equipe">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-light tracking-wide">Equipe do Workspace</h1>
        </div>
        <TeamManagement />
      </div>
    </DashboardLayout>
  );
}
