import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const filters = ["Todas", "A Receber", "Recebido", "Atrasado"];

export default function Financeiro() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="polo-label">Finanças</span>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Financeiro</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Controle suas cobranças e pagamentos
          </p>
        </div>
        <Button className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Nova Cobrança
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="p-2 rounded-xl bg-card border border-border">
          <Filter className="h-4 w-4 text-muted-foreground" />
        </div>
        {filters.map((filter, index) => (
          <button
            key={filter}
            className={index === 0 ? "polo-pill-active" : "polo-pill"}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="polo-card flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Módulo financeiro em desenvolvimento</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Cobrança automática com régua de inadimplência
          </p>
        </div>
      </div>
    </div>
  );
}
