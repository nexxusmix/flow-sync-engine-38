import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users } from "lucide-react";

export default function CRMPage() {
  return (
    <DashboardLayout title="CRM">
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="icon-box w-16 h-16 mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">CRM</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Gerencie seus leads, accounts e deals. Em desenvolvimento.
        </p>
      </div>
    </DashboardLayout>
  );
}
