import { useBillingUsage } from '@/hooks/useBilling';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useMemo } from 'react';

const USAGE_LABELS: Record<string, { label: string; icon: string }> = {
  ai_tokens: { label: 'Tokens de IA', icon: 'psychology' },
  automations: { label: 'Automações executadas', icon: 'manufacturing' },
  storage_mb: { label: 'Armazenamento (MB)', icon: 'cloud' },
  users: { label: 'Usuários', icon: 'group' },
  projects: { label: 'Projetos', icon: 'movie_filter' },
  clients: { label: 'Clientes', icon: 'groups' },
  campaigns: { label: 'Campanhas', icon: 'campaign' },
  contents: { label: 'Conteúdos', icon: 'edit_note' },
};

export function BillingUsage() {
  const { data: events = [], isLoading } = useBillingUsage();

  const aggregated = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach(e => {
      map.set(e.usage_key, (map.get(e.usage_key) || 0) + Number(e.amount));
    });
    return Array.from(map.entries()).map(([key, total]) => ({
      key,
      total,
      ...(USAGE_LABELS[key] || { label: key, icon: 'data_usage' }),
    }));
  }, [events]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (aggregated.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <span className="material-symbols-rounded text-4xl text-muted-foreground/40">speed</span>
        <p className="text-sm text-muted-foreground">Nenhum evento de consumo registrado neste período.</p>
        <p className="text-xs text-muted-foreground/60">O consumo de IA, automações e outros recursos aparecerá aqui.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {aggregated.map(u => (
        <div key={u.key} className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-rounded text-primary text-[18px]">{u.icon}</span>
            <span className="text-sm font-medium text-foreground">{u.label}</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-foreground">{u.total.toLocaleString('pt-BR')}</span>
            <span className="text-xs text-muted-foreground">usado no período</span>
          </div>
          <Progress value={Math.min((u.total / 1000) * 100, 100)} className="h-1.5" />
        </div>
      ))}
    </div>
  );
}
