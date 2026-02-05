import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Pipeline() {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas oportunidades de vendas
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lead
        </Button>
      </div>

      <div className="flex items-center justify-center h-[60vh] border border-dashed border-border rounded-xl bg-card/50">
        <div className="text-center">
          <p className="text-muted-foreground">Kanban em desenvolvimento</p>
          <p className="text-sm text-muted-foreground mt-1">
            Arraste e solte seus leads entre os estágios
          </p>
        </div>
      </div>
    </div>
  );
}
