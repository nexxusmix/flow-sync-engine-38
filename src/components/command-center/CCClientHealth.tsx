import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, Users, TrendingDown, Shield } from 'lucide-react';
import { formatCurrencyBRL } from '@/utils/format';
import { motion } from 'framer-motion';
import { sc } from '@/lib/colors';
import type { ClientHealthEntry } from '@/hooks/useCommandCenter';

interface Props {
  clients: ClientHealthEntry[];
}

function healthColor(score: number) {
  return sc.score(score).text;
}

function healthBg(score: number) {
  return sc.score(score).bg;
}

export function CCClientHealth({ clients }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'attention'>('all');

  const filtered = clients
    .filter(c => filter === 'all' || c.alerts.length > 0)
    .filter(c => c.client_name.toLowerCase().includes(search.toLowerCase()));

  const atRiskCount = clients.filter(c => c.alerts.length > 0).length;

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card p-4 text-center">
          <Users className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-semibold text-foreground">{clients.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Total Clientes</p>
        </Card>
        <Card className="glass-card p-4 text-center border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive mx-auto mb-1" />
          <p className="text-lg font-semibold text-destructive">{atRiskCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Em Atenção</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <TrendingDown className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
          <p className="text-lg font-semibold text-foreground">
            {formatCurrencyBRL(clients.reduce((s, c) => s + c.overdueRevenue, 0))}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase">Receita Vencida</p>
        </Card>
        <Card className="glass-card p-4 text-center">
          <Shield className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-semibold text-foreground">
            {clients.length > 0 ? Math.round(clients.reduce((s, c) => s + c.avgHealthScore, 0) / clients.length) : 0}%
          </p>
          <p className="text-[10px] text-muted-foreground uppercase">Saúde Média</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-1">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-md text-xs transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            Todos
          </button>
          <button onClick={() => setFilter('attention')} className={`px-3 py-1.5 rounded-md text-xs transition-colors ${filter === 'attention' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            Em Atenção ({atRiskCount})
          </button>
        </div>
      </div>

      {/* Client List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card className="glass-card p-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado.</Card>
        )}
        {filtered.map((client) => (
          <Card key={client.client_name} className={`glass-card p-4 ${client.alerts.length > 0 ? 'border-destructive/20' : ''}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              {/* Name + Health */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-xl ${healthBg(client.avgHealthScore)} flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-sm font-bold ${healthColor(client.avgHealthScore)}`}>{client.avgHealthScore}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{client.client_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {client.activeProjects} ativo(s) · {client.pendingTasks} tarefas pendentes
                  </p>
                </div>
              </div>

              {/* Financials */}
              <div className="flex items-center gap-4 text-xs">
                {client.pendingRevenue > 0 && (
                  <div>
                    <p className="text-muted-foreground text-[10px]">A receber</p>
                    <p className="font-medium text-foreground">{formatCurrencyBRL(client.pendingRevenue)}</p>
                  </div>
                )}
                {client.overdueRevenue > 0 && (
                  <div>
                    <p className="text-muted-foreground text-[10px]">Vencido</p>
                    <p className="font-medium text-destructive">{formatCurrencyBRL(client.overdueRevenue)}</p>
                  </div>
                )}
              </div>

              {/* Alerts */}
              {client.alerts.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {client.alerts.map((alert, i) => (
                    <Badge key={i} variant="destructive" className="text-[10px] font-normal">
                      {alert}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
