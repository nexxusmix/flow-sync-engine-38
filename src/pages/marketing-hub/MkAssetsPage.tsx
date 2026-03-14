/**
 * MkAssetsPage — Enhanced asset library with tags, categories, and content linking
 */
import { useEffect, useState, useRef, useMemo } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkEmptyState } from "@/components/marketing-hub/mk-ui";
import { supabase } from "@/integrations/supabase/client";
import { MarketingAsset, ASSET_TYPES, AssetType } from "@/types/marketing";
import { motion } from "framer-motion";
import {
  Upload, Search, Film, FileText, MoreVertical, Trash2,
  Tag, Link2, FolderOpen, CheckSquare, Square, Download, X, Grid3X3, List
} from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "general", label: "Geral" },
  { value: "brand", label: "Marca" },
  { value: "campaign", label: "Campanha" },
  { value: "template", label: "Template" },
  { value: "reference", label: "Referência" },
  { value: "deliverable", label: "Entregável" },
];

export default function MkAssetsPage() {
  const [assets, setAssets] = useState<(MarketingAsset & { category?: string; description?: string; campaign_id?: string; content_item_id?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [editAsset, setEditAsset] = useState<typeof assets[0] | null>(null);
  const [editForm, setEditForm] = useState({ title: "", category: "general", description: "", tags: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("marketing_assets").select("*").order("created_at", { ascending: false });
      if (data) setAssets(data as any[]);
      setLoading(false);
    })();
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const path = `assets/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("marketing-assets").upload(path, file);
      if (uploadErr) { toast.error(`Erro: ${file.name}`); continue; }
      const { data: urlData } = supabase.storage.from("marketing-assets").getPublicUrl(path);
      const guessType: AssetType = file.type.startsWith("image") ? "photo" : file.type.startsWith("video") ? "video" : "doc";
      const { data: newAsset } = await supabase.from("marketing_assets").insert([{
        title: file.name,
        type: guessType,
        storage_path: path,
        public_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        category: "general",
      }]).select().single();
      if (newAsset) setAssets(prev => [newAsset as any, ...prev]);
    }
    toast.success("Upload concluído!");
  };

  const handleDeleteAsset = async (asset: typeof assets[0]) => {
    if (asset.storage_path) {
      await supabase.storage.from("marketing-assets").remove([asset.storage_path]);
    }
    await supabase.from("marketing_assets").delete().eq("id", asset.id);
    setAssets(prev => prev.filter(a => a.id !== asset.id));
    toast.success("Asset excluído!");
  };

  const handleBulkDelete = async () => {
    const toDelete = assets.filter(a => selectedIds.has(a.id));
    const paths = toDelete.filter(a => a.storage_path).map(a => a.storage_path!);
    if (paths.length) await supabase.storage.from("marketing-assets").remove(paths);
    const ids = [...selectedIds];
    for (const id of ids) {
      await supabase.from("marketing_assets").delete().eq("id", id);
    }
    setAssets(prev => prev.filter(a => !selectedIds.has(a.id)));
    setSelectedIds(new Set());
    setSelectionMode(false);
    toast.success(`${ids.length} assets excluídos`);
  };

  const handleBulkDownload = () => {
    const toDownload = assets.filter(a => selectedIds.has(a.id) && a.public_url);
    toDownload.forEach((a, i) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = a.public_url!;
        link.download = a.title;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, i * 300);
    });
  };

  const handleEditSave = async () => {
    if (!editAsset) return;
    const tags = editForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from("marketing_assets").update({
      title: editForm.title,
      category: editForm.category,
      description: editForm.description,
      tags,
    } as any).eq("id", editAsset.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    setAssets(prev => prev.map(a =>
      a.id === editAsset.id ? { ...a, title: editForm.title, category: editForm.category, description: editForm.description, tags } : a
    ));
    setEditAsset(null);
    toast.success("Asset atualizado!");
  };

  const openEdit = (asset: typeof assets[0]) => {
    setEditAsset(asset);
    setEditForm({
      title: asset.title,
      category: (asset as any).category || "general",
      description: (asset as any).description || "",
      tags: (asset.tags || []).join(", "),
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => assets.filter(a => {
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (categoryFilter !== "all" && (a as any).category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !(a.tags || []).some(t => t.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [assets, typeFilter, categoryFilter, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach(a => {
      const cat = (a as any).category || "general";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [assets]);

  return (
    <MkAppShell title="Assets & Mídia" sectionCode="07" sectionLabel="Media_Library">
      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] uppercase tracking-wider font-medium transition-all whitespace-nowrap",
              categoryFilter === "all" ? "bg-primary/10 border-primary/30 text-primary" : "border-border/30 text-muted-foreground hover:text-foreground/60"
            )}
          >
            Todos <span className="text-[9px] font-mono">{assets.length}</span>
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(categoryFilter === cat.value ? "all" : cat.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] uppercase tracking-wider font-medium transition-all whitespace-nowrap",
                categoryFilter === cat.value ? "bg-primary/10 border-primary/30 text-primary" : "border-border/30 text-muted-foreground hover:text-foreground/60"
              )}
            >
              {cat.label} <span className="text-[9px] font-mono">{categoryCounts[cat.value] || 0}</span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="font-mono text-primary">{filtered.length}</span>
            <span>arquivos</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou tag..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted/20 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="py-2 px-3 rounded-lg bg-muted/20 border border-border/30 text-xs text-foreground/60 focus:outline-none">
              <option value="all">Tipo</option>
              {ASSET_TYPES.map(t => <option key={t.type} value={t.type}>{t.name}</option>)}
            </select>
            <div className="flex rounded-lg border border-border/30 overflow-hidden">
              <button onClick={() => setView("grid")} className={cn("p-2 transition-colors", view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground/40")}>
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setView("list")} className={cn("p-2 transition-colors", view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground/40")}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()); }}
              className={cn(
                "px-3 py-2 rounded-lg border text-[10px] uppercase tracking-wider font-medium transition-all",
                selectionMode ? "bg-primary/10 border-primary/30 text-primary" : "border-border/30 text-muted-foreground"
              )}
            >
              {selectionMode ? "Cancelar" : "Selecionar"}
            </button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0">
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectionMode && selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20"
        >
          <span className="text-xs font-medium text-primary">{selectedIds.size} selecionados</span>
          <button onClick={handleBulkDownload} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-[10px] font-medium hover:bg-primary/30 transition-colors">
            <Download className="w-3 h-3" /> Baixar
          </button>
          <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-[10px] font-medium hover:bg-destructive/20 transition-colors">
            <Trash2 className="w-3 h-3" /> Excluir
          </button>
        </motion.div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-primary"); }}
        onDragLeave={e => e.currentTarget.classList.remove("border-primary")}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("border-primary"); handleUpload(e.dataTransfer.files); }}
        className="border-2 border-dashed border-border/30 rounded-2xl p-5 mb-6 text-center transition-colors"
      >
        <Upload className="w-7 h-7 text-muted-foreground/20 mx-auto mb-1" />
        <p className="text-xs text-muted-foreground/30">Arraste arquivos aqui</p>
      </div>

      {filtered.length === 0 ? (
        <MkEmptyState icon="perm_media" title="Nenhum asset" description="Faça upload de arquivos para sua biblioteca." action={{ label: "Upload", onClick: () => fileRef.current?.click() }} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((asset, i) => (
            <motion.div key={asset.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.02 }}>
              <AssetCardGrid
                asset={asset}
                onDelete={handleDeleteAsset}
                onEdit={openEdit}
                selectionMode={selectionMode}
                selected={selectedIds.has(asset.id)}
                onToggle={() => toggleSelect(asset.id)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((asset, i) => (
            <AssetCardList
              key={asset.id}
              asset={asset}
              onDelete={handleDeleteAsset}
              onEdit={openEdit}
              selectionMode={selectionMode}
              selected={selectedIds.has(asset.id)}
              onToggle={() => toggleSelect(asset.id)}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editAsset} onOpenChange={() => setEditAsset(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">Editar Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Nome</Label>
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="mt-1 bg-muted/20 border-border text-foreground text-xs h-9" />
            </div>
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Categoria</Label>
              <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-muted/20 border border-border text-xs text-foreground/70 focus:outline-none">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Descrição</Label>
              <Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                className="mt-1 bg-muted/20 border-border text-foreground text-xs h-9" placeholder="Breve descrição..." />
            </div>
            <div>
              <Label className="text-muted-foreground text-[10px] uppercase tracking-wider">Tags (separadas por vírgula)</Label>
              <Input value={editForm.tags} onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))}
                className="mt-1 bg-muted/20 border-border text-foreground text-xs h-9" placeholder="marca, campanha-q1, logo..." />
            </div>
            <button onClick={handleEditSave}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
              Salvar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </MkAppShell>
  );
}

// Grid card
function AssetCardGrid({ asset, onDelete, onEdit, selectionMode, selected, onToggle }: {
  asset: any; onDelete: (a: any) => void; onEdit: (a: any) => void;
  selectionMode: boolean; selected: boolean; onToggle: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isImage = asset.mime_type?.startsWith("image");
  const isVideo = asset.mime_type?.startsWith("video");

  return (
    <>
      <MkCard hover className={cn("p-0 overflow-hidden relative", selected && "ring-2 ring-primary")}>
        {selectionMode && (
          <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="absolute top-2 left-2 z-10 p-0.5">
            {selected
              ? <CheckSquare className="w-5 h-5 text-primary" />
              : <Square className="w-5 h-5 text-muted-foreground/40" />
            }
          </button>
        )}
        <div className="aspect-square bg-muted/5 flex items-center justify-center relative group">
          {isImage && asset.public_url ? (
            <img src={asset.public_url} alt={asset.title} className="w-full h-full object-cover" />
          ) : isVideo ? (
            <Film className="w-8 h-8 text-muted-foreground/20" />
          ) : (
            <FileText className="w-8 h-8 text-muted-foreground/20" />
          )}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg bg-background/80 text-muted-foreground hover:text-foreground transition-colors">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(asset)}>
                  <Tag className="w-3.5 h-3.5 mr-2" /> Editar
                </DropdownMenuItem>
                {asset.public_url && (
                  <DropdownMenuItem onClick={() => window.open(asset.public_url, '_blank')}>
                    <Download className="w-3.5 h-3.5 mr-2" /> Baixar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="p-3">
          <p className="text-xs text-foreground/70 truncate">{asset.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] text-muted-foreground/40">{ASSET_TYPES.find(t => t.type === asset.type)?.name || asset.type}</span>
            {asset.category && asset.category !== "general" && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
                {CATEGORIES.find(c => c.value === asset.category)?.label || asset.category}
              </span>
            )}
          </div>
          {asset.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {asset.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground">{tag}</span>
              ))}
              {asset.tags.length > 3 && <span className="text-[8px] text-muted-foreground/30">+{asset.tags.length - 3}</span>}
            </div>
          )}
        </div>
      </MkCard>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir Asset</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">Excluir "{asset.title}" permanentemente?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => onDelete(asset)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// List card
function AssetCardList({ asset, onDelete, onEdit, selectionMode, selected, onToggle }: {
  asset: any; onDelete: (a: any) => void; onEdit: (a: any) => void;
  selectionMode: boolean; selected: boolean; onToggle: () => void;
}) {
  const isImage = asset.mime_type?.startsWith("image");
  const fileSize = asset.file_size ? (asset.file_size / 1024 / 1024).toFixed(1) + " MB" : "";

  return (
    <div className={cn(
      "flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-all hover:bg-muted/5",
      selected ? "border-primary/30 bg-primary/5" : "border-border/20"
    )}>
      {selectionMode && (
        <button onClick={onToggle}>
          {selected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground/30" />}
        </button>
      )}
      <div className="w-10 h-10 rounded-lg bg-muted/10 flex items-center justify-center shrink-0 overflow-hidden">
        {isImage && asset.public_url ? (
          <img src={asset.public_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-4 h-4 text-muted-foreground/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground/80 truncate">{asset.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-muted-foreground/40">{ASSET_TYPES.find(t => t.type === asset.type)?.name}</span>
          {fileSize && <span className="text-[9px] text-muted-foreground/30">{fileSize}</span>}
          {asset.tags?.slice(0, 2).map((tag: string) => (
            <span key={tag} className="text-[8px] px-1 py-0.5 rounded bg-muted/20 text-muted-foreground">{tag}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(asset)} className="p-1.5 rounded text-muted-foreground/40 hover:text-foreground transition-colors">
          <Tag className="w-3.5 h-3.5" />
        </button>
        {asset.public_url && (
          <a href={asset.public_url} download={asset.title} target="_blank" rel="noopener" className="p-1.5 rounded text-muted-foreground/40 hover:text-foreground transition-colors">
            <Download className="w-3.5 h-3.5" />
          </a>
        )}
        <button onClick={() => onDelete(asset)} className="p-1.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
