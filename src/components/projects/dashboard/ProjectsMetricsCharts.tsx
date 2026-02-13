import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ProjectWithStages } from '@/hooks/useProjects';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip 
} from 'recharts';
import { TrendingUp, FolderCheck, AlertTriangle, DollarSign } from 'lucide-react';
import { PROJECT_STAGES } from '@/data/projectTemplates';

interface ProjectsMetricsChartsProps {
  projects: ProjectWithStages[];
}

const STATUS_COLORS = {
  active: 'hsl(var(--primary))',
  paused: 'hsl(45, 93%, 47%)',
  completed: 'hsl(142, 76%, 36%)',
  archived: 'hsl(var(--muted-foreground))',
};

const STATUS_LABELS = {
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Concluído',
  archived: 'Arquivado',
};

export function ProjectsMetricsCharts({ projects }: ProjectsMetricsChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const metrics = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const withBlock = projects.filter(p => p.has_payment_block).length;
    const totalValue = projects.reduce((acc, p) => acc + (p.contract_value || 0), 0);
    
    return { total, active, completed, withBlock, totalValue };
  }, [projects]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = { active: 0, paused: 0, completed: 0, archived: 0 };
    projects.forEach(p => {
      const status = p.status || 'active';
      if (counts[status] !== undefined) counts[status]++;
    });
    
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
        value: count,
        fill: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.active,
      }));
  }, [projects]);

  const stageData = useMemo(() => {
    const stageCounts: Record<string, number> = {};
    projects.filter(p => p.status === 'active').forEach(p => {
      const stage = p.stage_current || 'roteiro';
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });
    
    return PROJECT_STAGES
      .filter(stage => stageCounts[stage.type])
      .map(stage => ({
        name: stage.name,
        value: stageCounts[stage.type] || 0,
        fill: 'hsl(var(--primary))',
      }));
  }, [projects]);

  const healthDistribution = useMemo(() => {
    const ranges = [
      { name: 'Crítico (0-50)', min: 0, max: 50, count: 0, fill: 'hsl(0, 84%, 60%)' },
      { name: 'Atenção (51-70)', min: 51, max: 70, count: 0, fill: 'hsl(45, 93%, 47%)' },
      { name: 'Bom (71-90)', min: 71, max: 90, count: 0, fill: 'hsl(var(--primary))' },
      { name: 'Excelente (91-100)', min: 91, max: 100, count: 0, fill: 'hsl(142, 76%, 36%)' },
    ];
    
    projects.filter(p => p.status === 'active').forEach(p => {
      const health = p.health_score || 0;
      const range = ranges.find(r => health >= r.min && health <= r.max);
      if (range) range.count++;
    });
    
    return ranges.filter(r => r.count > 0).map(r => ({
      name: r.name,
      value: r.count,
      fill: r.fill,
    }));
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-medium text-foreground">{metrics.active}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-medium text-foreground">{metrics.completed}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-medium text-foreground">{metrics.withBlock}</p>
              <p className="text-xs text-muted-foreground">Bloqueados</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground truncate">{formatCurrency(metrics.totalValue)}</p>
              <p className="text-xs text-muted-foreground">Valor Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Pie Chart */}
        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Por Status</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
              Sem projetos
            </div>
          )}
        </Card>

        {/* Stage Bar Chart */}
        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Por Etapa (Ativos)</h3>
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stageData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
              Sem projetos ativos
            </div>
          )}
        </Card>

        {/* Health Distribution */}
        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Saúde dos Projetos</h3>
          {healthDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={healthDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {healthDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {healthDistribution.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-[10px] text-muted-foreground">{d.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
              Sem dados
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
