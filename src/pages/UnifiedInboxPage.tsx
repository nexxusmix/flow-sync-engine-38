import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UnifiedInboxView } from "@/components/inbox/UnifiedInboxView";
import { Inbox } from "lucide-react";

export default function UnifiedInboxPage() {
  return (
    <DashboardLayout title="Inbox Unificada">
      <div className="h-full">
        <UnifiedInboxView />
      </div>
    </DashboardLayout>
  );
}
