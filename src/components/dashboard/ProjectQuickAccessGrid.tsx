import { useState } from "react";
import { Link } from "react-router-dom";
import { Clapperboard, Search, ArrowRight, FolderOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface ProjectQuickItem {
  id: string;
  name: string;
  client_name: string;
  status: string;
  stage_current: string;
  health_score: number;
  updated_at?: string;
  logo_url?: string;
  cover_image_url?: string;
}

interface ProjectQuickAccessGridProps {
  projects: ProjectQuickItem[];
  isLoading?: boolean;
}

const stageLabels: Record<string, string> = {
  briefing: "Briefing",
  roteiro: "Roteiro",
  pre_producao: "Pré-produção",
  captacao: "Captação",
  edicao: "Edição",
  revisao: "Revisão",
  aprovacao: "Aprovação",
  entrega: "Entrega",
  pos_venda: "Pós-venda",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "text-emerald-500 bg-emerald-500/10" },
  paused: { label: "Pausado", className: "text-amber-500 bg-amber-500/10" },
  completed: { label: "Concluído", className: "text-primary bg-primary/10" },
  archived: { label: "Arquivado", className: "text-muted-foreground bg-muted" },
};

export function ProjectQuickAccessGrid({ projects, isLoading }: ProjectQuickAccessGridProps) {
  const [search, setSearch] = useState("");

  const filtered = projects.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const displayed = filtered.slice(0, 6);

  if (isLoading) {
    return (
      <div className="glass-card rounded-[2rem] p-6">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="glass-card rounded-[2rem] p-6"
      initial={{ opacity: 0, y: 25, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: 0.15, type: "spring", stiffness: 80, damping: 18 }}
      
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Clapperboard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-foreground uppercase tracking-wide">Projetos Ativos</h2>
            <p className="text-mono text-muted-foreground font-light">Acesso rápido</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar projeto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/50"
            />
          </div>
          <Link to="/projetos">
            <Button variant="ghost" size="sm" className="text-xs text-primary whitespace-nowrap">
              Ver todos <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid */}
      {displayed.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayed.map((project, idx) => {
            const st = statusConfig[project.status] || statusConfig.active;
            const stageName = stageLabels[project.stage_current] || project.stage_current;
            const healthColor =
              project.health_score >= 90
                ? "text-emerald-500"
                : project.health_score >= 70
                ? "text-amber-500"
                : "text-red-500";

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.2 + idx * 0.07, type: "spring", stiffness: 100, damping: 18 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <Link to={`/projetos/${project.id}`}>
                  <Card className="p-4 bg-muted/20 border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer group hover:shadow-[0_15px_40px_-15px_rgba(0,163,211,0.15)]">
                    <div className="flex items-start gap-3 mb-2">
                      {/* Project Logo */}
                      {(project.logo_url || project.cover_image_url) ? (
                        <img 
                          src={project.logo_url || project.cover_image_url} 
                          alt={project.name}
                          className="w-10 h-10 rounded-lg object-cover border border-border/50 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-border/50 flex items-center justify-center flex-shrink-0">
                          <Clapperboard className="w-4 h-4 text-primary/60" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {project.name}
                          </p>
                          <span className={`text-micro font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${st.className}`}>
                            {st.label}
                          </span>
                        </div>
                        {project.client_name && (
                          <p className="text-mono text-muted-foreground truncate">{project.client_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-muted-foreground">{stageName}</span>
                      <span className={`text-caption font-medium ${healthColor}`}>{project.health_score}%</span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
          <FolderOpen className="w-8 h-8 mb-3" />
          <p className="text-sm font-light">
            {search ? "Nenhum projeto encontrado" : "Nenhum projeto ativo ainda"}
          </p>
          {!search && (
            <Link to="/projetos">
              <Button className="mt-3" size="sm" variant="outline">
                Novo Projeto
              </Button>
            </Link>
          )}
        </div>
      )}
    </motion.div>
  );
}
