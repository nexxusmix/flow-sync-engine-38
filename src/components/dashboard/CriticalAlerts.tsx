import { AlertsOverviewCard } from "../alerts/AlertsOverviewCard";

// Re-export the new alerts card as CriticalAlerts for backward compatibility
export function CriticalAlerts() {
  return <AlertsOverviewCard />;
}
