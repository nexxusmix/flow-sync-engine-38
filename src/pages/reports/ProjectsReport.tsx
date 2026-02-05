import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderKanban, ArrowLeft, Download, ChevronRight, AlertTriangle, DollarSign, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";

interface ProjectRow {
  id: string;
  name: string;
  client: string;
  stage: string;
  daysDelayed: number;
  hasBlocks: boolean;
  nextDelivery?: string;
  financialStatus: 'ok' | 'attention' | 'blocked';
}

export default function ProjectsReport() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch contracts as proxy for projects
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id, project_name, client_name, status')
        .order('created_at', { ascending: false });

      const projectRows: ProjectRow[] = (contracts || []).map(c => ({
        id: c.id,
        name: c.project_name || 'Sem nome',
        client: c.client_name || '-',
        stage: c.status || 'draft',
        daysDelayed: 0,
        hasBlocks: false,
        financialStatus: c.status === 'signed' ? 'ok' : 'attention',
      }));

      setProjects(projectRows);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Erro ao carregar projetos");
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    ok: 'text-emerald-500 bg-emerald-500/10',
    attention: 'text-amber-500 bg-amber-500/10',
    blocked: 'text-red-500 bg-red-500/10',
  };

  const statusLabels = {
    ok: 'OK',
    attention: 'Atenção',
    blocked: 'Bloqueado',
  };

  if (loading) {
    return (
      <DashboardLayout title="Relatório de Projetos">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Relatório de Projetos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/relatorios')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-light text-foreground">Projetos</h1>
              <p className="text-sm text-muted-foreground">Visão geral e drill-down</p>
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
              <p className="text-3xl font-semibold text-foreground">{projects.length}</p>
              <p className="text-xs text-muted-foreground">Total de Projetos</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-semibold text-amber-500">
                {projects.filter(p => p.financialStatus === 'attention').length}
              </p>
              <p className="text-xs text-muted-foreground">Atenção</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-semibold text-red-500">
                {projects.filter(p => p.financialStatus === 'blocked').length}
              </p>
              <p className="text-xs text-muted-foreground">Bloqueados</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Atraso</TableHead>
                <TableHead>Bloqueios</TableHead>
                <TableHead>Financeiro</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum projeto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderKanban className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{project.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{project.client}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {project.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.daysDelayed > 0 ? (
                        <span className="text-red-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {project.daysDelayed}d
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.hasBlocks ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[project.financialStatus]}>
                        {statusLabels[project.financialStatus]}
                      </Badge>
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
