import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMarketingStore } from "@/stores/marketingStore";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, FolderOpen, Image, Video, FileText, Music,
  MoreHorizontal, Trash2, Download, Eye, Grid, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FOLDERS = [
  { id: 'brand', name: 'Brand / Squad', icon: 'palette' },
  { id: 'templates', name: 'Templates', icon: 'dashboard' },
  { id: 'luts', name: 'LUTs', icon: 'gradient' },
  { id: 'lower-thirds', name: 'Lower Thirds', icon: 'subtitles' },
  { id: 'intros', name: 'Intros', icon: 'play_circle' },
  { id: 'sfx', name: 'SFX', icon: 'music_note' },
];

interface Asset {
  name: string;
  id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

function AssetCard({ 
  asset, 
  folder,
  onDelete,
  onPreview,
}: { 
  asset: Asset;
  folder: string;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const isImage = asset.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = asset.name.match(/\.(mp4|mov|webm)$/i);
  const isPdf = asset.name.match(/\.pdf$/i);
  const isAudio = asset.name.match(/\.(mp3|wav|aac)$/i);

  const getPublicUrl = () => {
    const { data } = supabase.storage.from('marketing-assets').getPublicUrl(`${folder}/${asset.name}`);
    return data.publicUrl;
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden group border border-transparent hover:border-primary/20 transition-all">
      {/* Preview Area */}
      <div className="relative aspect-video bg-muted/30 flex items-center justify-center">
        {isImage ? (
          <img 
            src={getPublicUrl()} 
            alt={asset.name} 
            className="w-full h-full object-cover"
          />
        ) : isVideo ? (
          <video 
            src={getPublicUrl()} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center text-muted-foreground">
            {isPdf && <FileText className="w-8 h-8" />}
            {isAudio && <Music className="w-8 h-8" />}
            {!isPdf && !isAudio && <FolderOpen className="w-8 h-8" />}
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={onPreview}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <a href={getPublicUrl()} download={asset.name}>
              <Download className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex items-center justify-between gap-2">
        <p className="text-[11px] text-foreground truncate flex-1">{asset.name}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={getPublicUrl()} download={asset.name}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-500">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [selectedFolder, setSelectedFolder] = useState('brand');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAssets();
  }, [selectedFolder]);

  const fetchAssets = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.storage
      .from('marketing-assets')
      .list(selectedFolder, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });
    
    if (data) {
      setAssets(data.filter(f => f.name !== '.emptyFolderPlaceholder') as Asset[]);
    }
    setIsLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    
    for (const file of Array.from(files)) {
      const filePath = `${selectedFolder}/${file.name}`;
      const { error } = await supabase.storage
        .from('marketing-assets')
        .upload(filePath, file, { upsert: true });
      
      if (error) {
        toast.error(`Erro ao fazer upload de ${file.name}`);
      }
    }
    
    toast.success('Upload concluído');
    fetchAssets();
    setIsLoading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (asset: Asset) => {
    const { error } = await supabase.storage
      .from('marketing-assets')
      .remove([`${selectedFolder}/${asset.name}`]);
    
    if (error) {
      toast.error('Erro ao excluir arquivo');
    } else {
      toast.success('Arquivo excluído');
      fetchAssets();
    }
  };

  const handlePreview = (asset: Asset) => {
    const { data } = supabase.storage.from('marketing-assets').getPublicUrl(`${selectedFolder}/${asset.name}`);
    window.open(data.publicUrl, '_blank');
  };

  return (
    <DashboardLayout title="Biblioteca de Assets">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-medium text-foreground tracking-tight">Biblioteca</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Assets e recursos para produção
            </p>
          </div>
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf"
              className="hidden"
              onChange={handleUpload}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              <Upload className="w-4 h-4 mr-2" />
              {isLoading ? 'Enviando...' : 'Upload'}
            </Button>
          </div>
        </div>

        {/* Folders & Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Folders */}
          <div className="col-span-12 md:col-span-3 lg:col-span-2">
            <div className="glass-card rounded-xl p-4 space-y-1">
              {FOLDERS.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all",
                    selectedFolder === folder.id 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <span className="material-symbols-outlined text-lg">{folder.icon}</span>
                  <span className="text-sm">{folder.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="col-span-12 md:col-span-9 lg:col-span-10">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {assets.length} arquivos em {FOLDERS.find(f => f.id === selectedFolder)?.name}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Assets Grid */}
            {isLoading ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm">Carregando...</p>
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Pasta vazia</p>
                <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Fazer primeiro upload
                </Button>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                  : "space-y-2"
              )}>
                {assets.map((asset) => (
                  <AssetCard
                    key={asset.id || asset.name}
                    asset={asset}
                    folder={selectedFolder}
                    onDelete={() => handleDelete(asset)}
                    onPreview={() => handlePreview(asset)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
