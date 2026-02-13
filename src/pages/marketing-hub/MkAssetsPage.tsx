import { useEffect, useState, useRef } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkEmptyState, MkStatusBadge } from "@/components/marketing-hub/mk-ui";
import { supabase } from "@/integrations/supabase/client";
import { MarketingAsset, ASSET_TYPES, AssetType } from "@/types/marketing";
import { motion } from "framer-motion";
import { Upload, Search, Image, Film, FileText, File, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function MkAssetsPage() {
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("marketing_assets").select("*").order("created_at", { ascending: false });
      if (data) setAssets(data as unknown as MarketingAsset[]);
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
      }]).select().single();
      if (newAsset) setAssets(prev => [newAsset as unknown as MarketingAsset, ...prev]);
    }
    toast.success("Upload concluído!");
  };

  const handleDeleteAsset = async (asset: MarketingAsset) => {
    if (asset.storage_path) {
      await supabase.storage.from("marketing-assets").remove([asset.storage_path]);
    }
    const { error } = await supabase.from("marketing_assets").delete().eq("id", asset.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setAssets(prev => prev.filter(a => a.id !== asset.id));
    toast.success("Asset excluído!");
  };

  const filtered = assets.filter(a => {
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <MkAppShell title="Assets & Mídia">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Assets & Mídia</h1>
          <p className="text-sm text-white/30 mt-1">{assets.length} arquivos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[hsl(210,100%,55%)]/40" />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/60 focus:outline-none">
            <option value="all">Todos</option>
            {ASSET_TYPES.map(t => <option key={t.type} value={t.type}>{t.name}</option>)}
          </select>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(210,100%,55%)] text-white text-sm font-medium hover:bg-[hsl(210,100%,50%)] transition-colors shrink-0">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-[hsl(210,100%,55%)]"); }}
        onDragLeave={e => e.currentTarget.classList.remove("border-[hsl(210,100%,55%)]")}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("border-[hsl(210,100%,55%)]"); handleUpload(e.dataTransfer.files); }}
        className="border-2 border-dashed border-white/[0.06] rounded-2xl p-6 mb-6 text-center transition-colors"
      >
        <Upload className="w-8 h-8 text-white/15 mx-auto mb-2" />
        <p className="text-sm text-white/25">Arraste arquivos aqui ou clique em Upload</p>
      </div>

      {filtered.length === 0 ? (
        <MkEmptyState icon="perm_media" title="Nenhum asset" description="Faça upload de arquivos para sua biblioteca." action={{ label: "Upload", onClick: () => fileRef.current?.click() }} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((asset, i) => (
             <motion.div key={asset.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}>
               <AssetCard asset={asset} onDelete={handleDeleteAsset} />
            </motion.div>
          ))}
        </div>
      )}
    </MkAppShell>
  );
}

function AssetCard({ asset, onDelete }: { asset: MarketingAsset; onDelete: (a: MarketingAsset) => void }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isImage = asset.mime_type?.startsWith("image");
  const isVideo = asset.mime_type?.startsWith("video");
  return (
    <>
      <MkCard hover className="p-0 overflow-hidden">
        <div className="aspect-square bg-white/[0.02] flex items-center justify-center relative group">
          {isImage && asset.public_url ? (
            <img src={asset.public_url} alt={asset.title} className="w-full h-full object-cover" />
          ) : isVideo ? (
            <Film className="w-8 h-8 text-white/15" />
          ) : (
            <FileText className="w-8 h-8 text-white/15" />
          )}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg bg-black/60 text-white/60 hover:text-white transition-colors">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="p-3">
          <p className="text-xs text-white/60 truncate">{asset.title}</p>
          <p className="text-[10px] text-white/20 mt-0.5">{ASSET_TYPES.find(t => t.type === asset.type)?.name || asset.type}</p>
        </div>
      </MkCard>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{asset.title}"? O arquivo será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(asset)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
