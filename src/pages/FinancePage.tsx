import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Wallet } from "lucide-react";

export default function FinancePage() {
  return (
    <DashboardLayout title="Financeiro">
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="icon-box w-16 h-16 mb-4">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Financeiro</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Controle de cobranças, pagamentos e fluxo de caixa. Em desenvolvimento.
        </p>
      </div>
    </DashboardLayout>
  );
}
