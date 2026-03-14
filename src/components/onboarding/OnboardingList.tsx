import { useClientOnboarding } from "@/hooks/useClientOnboarding";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

const statusMap: Record<string, { label: string; color: string }> = {
  in_progress: { label: "Em andamento", color: "text-primary bg-primary/10" },
  completed: { label: "Concluído", color: "text-emerald-600 bg-emerald-500/10" },
  blocked: { label: "Bloqueado", color: "text-destructive bg-destructive/10" },
  paused: { label: "Pausado", color: "text-muted-foreground bg-muted" },
};

const serviceMap: Record<string, string> = {
  social_media: "Social Media",
  trafego_pago: "Tráfego Pago",
  branding: "Branding",
  development: "Desenvolvimento",
  general: "Geral",
};

interface Props {
  onSelect: (id: string) => void;
}

export function OnboardingList({ onSelect }: Props) {
  const { onboardings, isLoading } = useClientOnboarding();

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  if (onboardings.length === 0) {
    return (
      <div className="text-center py-20 space-y-2">
        <span className="material-symbols-rounded text-4xl text-muted-foreground/50">rocket_launch</span>
        <p className="text-sm text-muted-foreground">Nenhum onboarding ativo ainda</p>
        <p className="text-xs text-muted-foreground">Crie seu primeiro onboarding para começar</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 mt-4">
      {onboardings.map((ob) => {
        const st = statusMap[ob.status] || statusMap.in_progress;
        return (
          <button
            key={ob.id}
            onClick={() => onSelect(ob.id)}
            className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all duration-200 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground truncate">{ob.client_name}</h3>
                  <span className={cn("text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full", st.color)}>
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{serviceMap[ob.service_type] || ob.service_type}</span>
                  <span>Início: {format(new Date(ob.started_at), "dd MMM yyyy", { locale: ptBR })}</span>
                  {ob.due_date && <span>Prazo: {format(new Date(ob.due_date), "dd MMM yyyy", { locale: ptBR })}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-lg font-semibold text-foreground">{ob.progress}%</span>
                </div>
              </div>
            </div>
            <Progress value={ob.progress} className="h-1.5 mt-3" />
          </button>
        );
      })}
    </div>
  );
}
