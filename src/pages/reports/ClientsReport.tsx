import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  UserCheck, ArrowLeft, Download, ChevronRight, AlertCircle, FolderKanban, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";

interface ClientRow {
  id: string;
  name: string;
  activeProjects: number;
  projectsInReview: number;
  clientPendencies: number;
  lastUpdate?: string;
}

export default function ClientsReport() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get unique clients from contracts
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, client_name, status, updated_at')
        .order('updated_at', { ascending: false });

      // Group by client
      const clientMap = new Map<string, ClientRow>();
      
      (contracts || []).forEach(c => {
        const clientName = c.client_name || 'Sem cliente';
        const existing = clientMap.get(clientName);
        
        if (existing) {
          existing.activeProjects++;
          if (c.status === 'sent' || c.status === 'viewed') {
            existing.projectsInReview++;
          }
          if (!existing.lastUpdate || c.updated_at > existing.lastUpdate) {
            existing.lastUpdate = c.updated_at;
          }
        } else {
          clientMap.set(clientName, {
            id: c.id,
            name: clientName,
            activeProjects: 1,
            projectsInReview: c.status === 'sent' || c.status === 'viewed' ? 1 : 0,
            clientPendencies: 0,
            lastUpdate: c.updated_at,
          });
        }
      });

      setClients(Array.from(clientMap.values()));
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Relatório de Clientes">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Relatório de Clientes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/relatorios')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Clientes</h1>
              <p className="text-sm text-muted-foreground">Reduzir ansiedade e cobrança</p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-semibold text-foreground">{clients.length}</p>
              <p className="text-xs text-muted-foreground">Total de Clientes</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-semibold text-amber-500">
                {clients.filter(c => c.projectsInReview > 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Com Projetos em Revisão</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-semibold text-blue-500">
                {clients.reduce((sum, c) => sum + c.activeProjects, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Projetos Ativos Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Projetos Ativos</TableHead>
                <TableHead>Em Revisão</TableHead>
                <TableHead>Pendências</TableHead>
                <TableHead>Última Atualização</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-cyan-500" />
                        </div>
                        <span className="font-medium text-foreground">{client.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FolderKanban className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{client.activeProjects}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.projectsInReview > 0 ? (
                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                          {client.projectsInReview}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.clientPendencies > 0 ? (
                        <span className="text-red-500 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {client.clientPendencies}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.lastUpdate 
                        ? format(new Date(client.lastUpdate), 'dd/MM/yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
