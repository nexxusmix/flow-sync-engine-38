import { ProjectWithStages } from "@/hooks/useProjects";
import { useProjectFinance } from "@/hooks/useProjectFinance";
import { ProjectFinanceDetailPanel } from "@/components/finance/ProjectFinanceDetailPanel";
import { Loader2, TrendingUp } from "lucide-react";

interface FinanceTabProps {
  project: ProjectWithStages;
}

export function FinanceTab({ project }: FinanceTabProps) {
  const { contract, revenues, expenses, summary, isLoading, refresh } = useProjectFinance(project.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <TrendingUp className="w-8 h-8" />
        <p className="text-sm">Nenhum dado financeiro disponível</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <ProjectFinanceDetailPanel
        project={summary}
        contract={contract}
        revenues={revenues}
        expenses={expenses}
        onRefresh={refresh}
      />
    </div>
  );
}
