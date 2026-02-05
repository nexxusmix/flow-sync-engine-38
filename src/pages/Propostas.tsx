import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Propostas() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propostas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crie e acompanhe suas propostas comerciais
          </p>
        </div>
        <Button className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Nova Proposta
        </Button>
      </div>

      <div className="bento-card flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Lista de propostas em desenvolvimento</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Gere propostas profissionais em minutos
          </p>
        </div>
      </div>
    </div>
  );
}
