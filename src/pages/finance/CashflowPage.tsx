import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useFinancialStore } from "@/stores/financialStore";
import { 
  ArrowUpRight, ArrowDownRight, Filter, Calendar, Wallet
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function CashflowPage() {
  const { 
    revenues, 
    expenses, 
    fetchRevenues, 
    fetchExpenses,
    getCashflow,
    getStats,
  } = useFinancialStore();

  const [periodFilter, setPeriodFilter] = useState<string>('all');

  useEffect(() => {
    fetchRevenues();
    fetchExpenses();
  }, []);

  const cashflow = getCashflow();
  const stats = getStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
    }).format(value);
  };

  const filteredCashflow = cashflow.filter(entry => {
    if (periodFilter === 'all') return true;
    const entryDate = new Date(entry.date);
    const now = new Date();
    
    if (periodFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return entryDate >= weekAgo;
    }
    if (periodFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return entryDate >= monthAgo;
    }
    if (periodFilter === 'quarter') {
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return entryDate >= quarterAgo;
    }
    return true;
  });

  // Group by date
  const groupedCashflow = filteredCashflow.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, typeof cashflow>);

  const sortedDates = Object.keys(groupedCashflow).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <DashboardLayout title="Caixa">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Extrato de Caixa</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Histórico de entradas e saídas realizadas
            </p>
          </div>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Current Balance */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Atual</p>
              <h2 className={`text-3xl font-semibold mt-1 ${
                stats.currentBalance >= 0 ? 'text-primary' : 'text-destructive'
              }`}>
                {formatCurrency(stats.currentBalance)}
              </h2>
            </div>
            <div className="p-4 rounded-2xl bg-primary/10">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </div>
        </Card>

        {/* Cashflow Timeline */}
        <Card className="glass-card divide-y divide-border">
          {sortedDates.map((date) => (
            <div key={date}>
              {/* Date Header */}
              <div className="px-4 py-3 bg-muted/30 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {new Date(date).toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long' 
                  })}
                </span>
              </div>
              
              {/* Entries for this date */}
              {groupedCashflow[date].map((entry) => (
                <div 
                  key={entry.id} 
                  className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      entry.type === 'revenue' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      {entry.type === 'revenue' ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{entry.description}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {entry.category && (
                          <Badge variant="outline" className="text-xs">
                            {entry.category}
                          </Badge>
                        )}
                        {entry.project_name && (
                          <span className="text-xs text-muted-foreground">
                            {entry.project_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-semibold ${
                      entry.type === 'revenue' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {entry.type === 'revenue' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </p>
                    {entry.running_balance !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Saldo: {formatCurrency(entry.running_balance)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {filteredCashflow.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma movimentação no período selecionado</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
