/**
 * PortalDocumentsTab - Documentos, contratos e arquivos do portal
 * Exibe documentos compartilhados organizados por tipo com download
 */

import { memo, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, Download, Eye, Search, Filter, FolderOpen,
  FileCheck, FileSignature, File, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PortalFile, PortalDeliverable } from "@/hooks/useClientPortalEnhanced";

interface PortalDocumentsTabProps {
  files: PortalFile[];
  deliverables: PortalDeliverable[];
}

type DocCategory = "all" | "contract" | "proposal" | "deliverable" | "report" | "other";

const CATEGORY_CONFIG: Record<DocCategory, { label: string; icon: typeof FileText }> = {
  all: { label: "Todos", icon: FolderOpen },
  contract: { label: "Contratos", icon: FileSignature },
  proposal: { label: "Propostas", icon: FileCheck },
  deliverable: { label: "Entregas", icon: File },
  report: { label: "Relatórios", icon: FileText },
  other: { label: "Outros", icon: File },
};

function categorizeFile(file: PortalFile): DocCategory {
  const name = (file.name || "").toLowerCase();
  const folder = (file.folder || "").toLowerCase();
  if (name.includes("contrat") || folder.includes("contrat")) return "contract";
  if (name.includes("propost") || folder.includes("propost")) return "proposal";
  if (name.includes("relat") || folder.includes("relat")) return "report";
  if (name.includes("entreg") || folder.includes("entreg")) return "deliverable";
  return "other";
}

function getFileIcon(type: string | null) {
  if (type?.includes("pdf")) return <FileText className="w-5 h-5 text-destructive" />;
  if (type?.includes("image")) return <File className="w-5 h-5 text-primary" />;
  return <File className="w-5 h-5 text-muted-foreground" />;
}

function triggerDownload(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", name);
  a.setAttribute("target", "_blank");
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function PortalDocumentsTabComponent({ files, deliverables }: PortalDocumentsTabProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DocCategory>("all");

  // Combine files + deliverables with file_url into a unified doc list
  const allDocs = [
    ...files.filter(f => f.visible_in_portal).map(f => ({
      id: f.id,
      name: f.name,
      type: f.file_type,
      url: f.file_url,
      folder: f.folder,
      category: categorizeFile(f),
      created_at: f.created_at,
    })),
    ...deliverables
      .filter(d => d.file_url && !d.youtube_url && !d.type?.includes("video"))
      .map(d => ({
        id: d.id,
        name: d.title,
        type: d.type,
        url: d.file_url!,
        folder: d.material_category || "Entregas",
        category: "deliverable" as DocCategory,
        created_at: d.created_at,
      })),
  ];

  const filtered = allDocs
    .filter(d => category === "all" || d.category === category)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()));

  const categoryCounts = allDocs.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (allDocs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card border border-border rounded-xl p-12 text-center"
      >
        <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Nenhum documento disponível</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Documentos, contratos e propostas aparecerão aqui quando forem compartilhados pela equipe.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(CATEGORY_CONFIG) as DocCategory[]).map(cat => {
          const config = CATEGORY_CONFIG[cat];
          const count = cat === "all" ? allDocs.length : (categoryCounts[cat] || 0);
          if (cat !== "all" && count === 0) return null;
          return (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setCategory(cat)}
            >
              <config.icon className="w-3.5 h-3.5 mr-1.5" />
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Documents list */}
      <div className="space-y-2">
        {filtered.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getFileIcon(doc.type)}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground capitalize">{doc.folder}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {doc.url && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => window.open(doc.url, "_blank")}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => triggerDownload(doc.url, doc.name)}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Baixar
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhum documento encontrado para o filtro selecionado.
          </div>
        )}
      </div>
    </div>
  );
}

export const PortalDocumentsTab = memo(PortalDocumentsTabComponent);
