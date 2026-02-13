import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ScoutDashboard } from "@/components/scout/ScoutDashboard";

export default function ScoutPage() {
  return (
    <DashboardLayout title="Agent Scout">
      <ScoutDashboard />
    </DashboardLayout>
  );
}
