import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FolderKanban } from "lucide-react";

export default function ProjectsPage() {
  return (
    <DashboardLayout title="Projetos">
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="icon-box w-16 h-16 mb-4">
          <FolderKanban className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Projetos</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Gerencie seus projetos de produção audiovisual. Em desenvolvimento.
        </p>
      </div>
    </DashboardLayout>
  );
}
