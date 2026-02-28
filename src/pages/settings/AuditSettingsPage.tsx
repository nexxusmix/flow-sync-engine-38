import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { EventLog } from "@/types/settings";
import { ArrowLeft, ScrollText, Search, Filter, Download, User, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: 'Criado', color: 'bg-emerald-500/10 text-emerald-500' },
  update: { label: 'Atualizado', color: 'bg-blue-500/10 text-blue-500' },
  delete: { label: 'Excluído', color: 'bg-red-500/10 text-red-500' },
  sign: { label: 'Assinado', color: 'bg-violet-500/10 text-violet-500' },
  accept: { label: 'Aceito', color: 'bg-amber-500/10 text-amber-500' },
  send: { label: 'Enviado', color: 'bg-cyan-500/10 text-cyan-500' },
};

const ENTITY_LABELS: Record<string, string> = {
  workspace_settings: 'Workspace',
  user_roles: 'Papéis',
  contracts: 'Contratos',
  proposals: 'Propostas',
  projects: 'Projetos',
  revenues: 'Receitas',
  expenses: 'Despesas',
  content_items: 'Conteúdos',
};

export default function AuditSettingsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");

  useEffect(() => {
    loadLogs();
  }, [entityFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('event_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data || []) as unknown as EventLog[]);
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_type.toLowerCase().includes(searchLower) ||
      log.actor_name?.toLowerCase().includes(searchLower) ||
      log.entity_id?.toLowerCase().includes(searchLower)
    );
  });

  const getActionInfo = (action: string) => {
    return ACTION_LABELS[action] || { label: action, color: 'bg-muted text-muted-foreground' };
  };

  return (
    <DashboardLayout title="Auditoria">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-section-title font-light text-foreground">Auditoria</h1>
              <p className="text-caption text-muted-foreground">Histórico de ações no sistema</p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os módulos</SelectItem>
              {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs List */}
        <Card className="glass-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhum registro encontrado</div>
            ) : (
              <div className="divide-y divide-border">
                {filteredLogs.map((log) => {
                  const actionInfo = getActionInfo(log.action);
                  return (
                    <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                          <ScrollText className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={actionInfo.color}>{actionInfo.label}</Badge>
                            <span className="font-medium text-foreground">
                              {ENTITY_LABELS[log.entity_type] || log.entity_type}
                            </span>
                            {log.entity_id && (
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {log.entity_id.slice(0, 8)}...
                              </code>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.actor_name || 'Sistema'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
