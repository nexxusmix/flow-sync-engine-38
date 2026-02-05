import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FileText } from "lucide-react";

export default function ProposalsPage() {
  return (
    <DashboardLayout title="Propostas">
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="icon-box w-16 h-16 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Propostas</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Crie e gerencie propostas comerciais. Em desenvolvimento.
        </p>
      </div>
    </DashboardLayout>
  );
}
