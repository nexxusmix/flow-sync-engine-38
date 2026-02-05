import { useProjectsStore } from "@/stores/projectsStore";
import { getProjectStats, getProjectsByStage } from "@/data/projectsMockData";
import { 
  Briefcase, 
  TrendingUp, 
  AlertTriangle, 
  Ban, 
  Activity,
  DollarSign
} from "lucide-react";

export function ProjectsDashboard() {
  const stats = getProjectStats();
  const stageDistribution = getProjectsByStage();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {/* Value Metrics */}
      <div className="glass-card rounded-2xl p-4 col-span-2 md:col-span-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
        </div>
        <p className="text-lg md:text-xl font-bold text-foreground">{formatCurrency(stats.valorTotal)}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Em Produção</p>
      </div>

      {/* Health Score */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
        <p className="text-lg md:text-xl font-bold text-foreground">{stats.healthMedia}%</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Saúde Média</p>
      </div>

      {/* Total Projects */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
        </div>
        <p className="text-lg md:text-xl font-bold text-foreground">{stats.total}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Projetos</p>
      </div>

      {/* Ok */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
        <p className="text-lg md:text-xl font-bold text-foreground">{stats.ok}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">No Prazo</p>
      </div>

      {/* At Risk */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
        </div>
        <p className="text-lg md:text-xl font-bold text-foreground">{stats.emRisco}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Em Risco</p>
      </div>

      {/* Blocked */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Ban className="w-4 h-4 text-red-500" />
          </div>
        </div>
        <p className="text-lg md:text-xl font-bold text-foreground">{stats.bloqueados}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bloqueados</p>
      </div>
    </div>
  );
}
