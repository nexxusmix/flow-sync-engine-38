import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex w-full">
      <AppSidebar />
      <main className="flex-1 ml-64">
        <Outlet />
      </main>
    </div>
  );
}
