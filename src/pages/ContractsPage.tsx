import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FileSignature } from "lucide-react";

export default function ContractsPage() {
  return (
    <DashboardLayout title="Contratos">
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="icon-box w-16 h-16 mb-4">
          <FileSignature className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Contratos</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Gerencie contratos e assinaturas digitais. Em desenvolvimento.
        </p>
      </div>
    </DashboardLayout>
  );
}
