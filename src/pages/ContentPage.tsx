import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Film } from "lucide-react";

export default function ContentPage() {
  return (
    <DashboardLayout title="Conteúdo">
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="icon-box w-16 h-16 mb-4">
          <Film className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Conteúdo</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Biblioteca de conteúdos e assets. Em desenvolvimento.
        </p>
      </div>
    </DashboardLayout>
  );
}
