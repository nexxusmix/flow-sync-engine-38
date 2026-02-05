import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Inbox } from "lucide-react";

export default function InboxPage() {
  return (
    <DashboardLayout title="Inbox">
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="icon-box w-16 h-16 mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Inbox Unificada</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Todas suas conversas de WhatsApp, Instagram e Email em um só lugar. Em desenvolvimento.
        </p>
      </div>
    </DashboardLayout>
  );
}
