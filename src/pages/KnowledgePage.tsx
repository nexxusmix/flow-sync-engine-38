import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookOpen } from "lucide-react";

export default function KnowledgePage() {
  return (
    <DashboardLayout title="Knowledge Base">
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="icon-box w-16 h-16 mb-4">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Knowledge Base</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Base de conhecimento e documentação interna. Em desenvolvimento.
        </p>
      </div>
    </DashboardLayout>
  );
}
