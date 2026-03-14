import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { MaterialRequest } from "@/hooks/useClientOnboarding";

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "Pendente", color: "text-amber-600 bg-amber-500/10", icon: "schedule" },
  received: { label: "Recebido", color: "text-emerald-600 bg-emerald-500/10", icon: "check_circle" },
  validated: { label: "Validado", color: "text-primary bg-primary/10", icon: "verified" },
  rejected: { label: "Rejeitado", color: "text-destructive bg-destructive/10", icon: "cancel" },
};

const typeIcons: Record<string, string> = {
  file: "upload_file",
  access: "key",
  link: "link",
  document: "description",
};

interface Props {
  materials: MaterialRequest[];
  onUpdateStatus: (id: string, status: string) => void;
}

export function OnboardingMaterials({ materials, onUpdateStatus }: Props) {
  if (materials.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-10">Nenhum material solicitado</p>;
  }

  const pending = materials.filter((m) => m.status === "pending").length;
  const received = materials.filter((m) => m.status !== "pending").length;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="material-symbols-rounded text-sm text-amber-500">schedule</span>
          {pending} pendentes
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-rounded text-sm text-emerald-500">check_circle</span>
          {received} recebidos
        </span>
      </div>

      <div className="space-y-2">
        {materials.map((mat) => {
          const st = statusConfig[mat.status] || statusConfig.pending;
          const icon = typeIcons[mat.item_type] || "description";

          return (
            <div key={mat.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <span className="material-symbols-rounded text-lg text-muted-foreground">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{mat.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn("text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded", st.color)}>
                    {st.label}
                  </span>
                  {mat.is_required && <span className="text-[10px] text-muted-foreground">Obrigatório</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {mat.status === "pending" && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onUpdateStatus(mat.id, "received")}>
                    Marcar recebido
                  </Button>
                )}
                {mat.status === "received" && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onUpdateStatus(mat.id, "validated")}>
                    Validar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
