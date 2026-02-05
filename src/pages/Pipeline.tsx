import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Pipeline() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie suas oportunidades de vendas
          </p>
        </div>
        <Button className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      <div className="bento-card flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Kanban em desenvolvimento</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Arraste e solte seus leads entre os estágios
          </p>
        </div>
      </div>
    </div>
  );
}
