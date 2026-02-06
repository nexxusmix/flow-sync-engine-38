import { useState } from "react";
import { Package, MoreHorizontal, Eye, Copy, Trash2, Sparkles, Calendar, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { CreativePackage } from "@/types/creative-packages";
import { cn } from "@/lib/utils";
import { useExportPdf } from "@/hooks/useExportPdf";

interface CreativePackagesListProps {
  packages: CreativePackage[];
  onRefresh: () => void;
  onOpenPackage: (pkg: CreativePackage) => void;
}

export function CreativePackagesList({
  packages,
  onRefresh,
  onOpenPackage,
}: CreativePackagesListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  
  const { exportCreativePackage } = useExportPdf();

  const handleExport = async (pkg: CreativePackage, e: React.MouseEvent) => {
    e.stopPropagation();
    setExportingId(pkg.id);
    
    const result = await exportCreativePackage(pkg.id);
    
    if (result?.public_url) {
      window.open(result.public_url, '_blank');
    }
    
    setExportingId(null);
  };

  const handleDuplicate = async (pkg: CreativePackage) => {
    // Find next version number
    const versionMatch = pkg.title.match(/v(\d+)/);
    const currentVersion = versionMatch ? parseInt(versionMatch[1]) : 1;
    const newTitle = versionMatch 
      ? pkg.title.replace(/v\d+/, `v${currentVersion + 1}`)
      : `${pkg.title} v2`;

    try {
      const { error } = await supabase
        .from("campaign_creative_packages")
        .insert([{
          campaign_id: pkg.campaign_id,
          title: newTitle,
          package_json: pkg.package_json as Json,
        }]);

      if (error) throw error;

      toast.success(`Pacote duplicado como "${newTitle}"`);
      onRefresh();
    } catch (error) {
      console.error("Error duplicating package:", error);
      toast.error("Erro ao duplicar pacote");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("campaign_creative_packages")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("Pacote excluído");
      onRefresh();
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Erro ao excluir pacote");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getOutputCount = (pkg: CreativePackage) => {
    const json = pkg.package_json;
    let count = 0;
    if (json.concept) count++;
    if (json.script) count++;
    if (json.storyboard?.length) count++;
    if (json.shotlist?.length) count++;
    if (json.moodboard) count++;
    if (json.captionVariations?.length) count++;
    if (json.hashtags?.length) count++;
    return count;
  };

  if (packages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Nenhum pacote criativo</p>
        <p className="text-xs mt-1">
          Crie pacotes no Studio Criativo e vincule a esta campanha.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={cn(
              "p-4 rounded-lg border border-border bg-card/50",
              "hover:border-primary/30 hover:bg-card transition-all cursor-pointer"
            )}
            onClick={() => onOpenPackage(pkg)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">{pkg.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(pkg.created_at)}
                    </span>
                    {pkg.studio_run_id && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                        <Sparkles className="w-2.5 h-2.5 mr-1" />
                        Studio
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {getOutputCount(pkg)} output(s)
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpenPackage(pkg); }}>
                      <Eye className="w-4 h-4 mr-2" />
                      Abrir
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => handleExport(pkg, e)}
                      disabled={exportingId === pkg.id}
                    >
                      {exportingId === pkg.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {exportingId === pkg.id ? "Exportando..." : "Exportar PDF"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(pkg); }}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); setDeleteId(pkg.id); }}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pacote Criativo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pacote será removido permanentemente,
              mas os assets do bucket não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
