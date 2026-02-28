import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, Link2, Image, Video, FileText, Music,
  Trash2, Download, Eye, Plus, X, FolderOpen, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ContentAsset {
  id: string;
  content_item_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  public_url: string | null;
  created_at: string;
}

interface LibraryAsset {
  name: string;
  id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const LIBRARY_FOLDERS = [
  { id: 'brand', name: 'Brand / Squad' },
  { id: 'templates', name: 'Templates' },
  { id: 'luts', name: 'LUTs' },
  { id: 'lower-thirds', name: 'Lower Thirds' },
  { id: 'intros', name: 'Intros' },
  { id: 'sfx', name: 'SFX' },
];

function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'aac', 'ogg'].includes(ext)) return 'audio';
  return 'document';
}

function getFileIcon(fileType: string | null) {
  switch (fileType) {
    case 'image': return <Image className="w-6 h-6" />;
    case 'video': return <Video className="w-6 h-6" />;
    case 'audio': return <Music className="w-6 h-6" />;
    default: return <FileText className="w-6 h-6" />;
  }
}

function AssetPreview({ asset }: { asset: ContentAsset }) {
  const isImage = asset.file_type === 'image';
  const isVideo = asset.file_type === 'video';

  return (
    <div className="relative w-full h-full bg-muted/30 flex items-center justify-center">
      {isImage && asset.public_url ? (
        <img 
          src={asset.public_url} 
          alt={asset.file_name} 
          className="w-full h-full object-cover"
        />
      ) : isVideo && asset.public_url ? (
        <video 
          src={asset.public_url} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-muted-foreground">
          {getFileIcon(asset.file_type)}
        </div>
      )}
    </div>
  );
}

interface ContentAssetsTabProps {
  contentItemId: string;
}

export function ContentAssetsTab({ contentItemId }: ContentAssetsTabProps) {
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('brand');
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch linked assets
  useEffect(() => {
    fetchAssets();
  }, [contentItemId]);

  // Fetch library assets when folder changes
  useEffect(() => {
    if (libraryOpen) {
      fetchLibraryAssets();
    }
  }, [selectedFolder, libraryOpen]);

  const fetchAssets = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('content_assets')
      .select('*')
      .eq('content_item_id', contentItemId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setAssets(data as ContentAsset[]);
    }
    setIsLoading(false);
  };

  const fetchLibraryAssets = async () => {
    setLibraryLoading(true);
    const { data, error } = await supabase.storage
      .from('marketing-assets')
      .list(selectedFolder, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });
    
    if (data) {
      setLibraryAssets(data.filter(f => f.name !== '.emptyFolderPlaceholder') as LibraryAsset[]);
    }
    setLibraryLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      const timestamp = Date.now();
      const filePath = `content/${contentItemId}/${timestamp}_${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('marketing-assets')
        .upload(filePath, file);
      
      if (uploadError) {
        toast.error(`Erro ao fazer upload de ${file.name}`);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('marketing-assets')
        .getPublicUrl(filePath);

      // Insert into content_assets table
      const { error: insertError } = await supabase
        .from('content_assets')
        .insert({
          content_item_id: contentItemId,
          file_name: file.name,
          file_path: filePath,
          file_type: getFileType(file.name),
          file_size: file.size,
          public_url: urlData.publicUrl,
        });

      if (insertError) {
        toast.error(`Erro ao vincular ${file.name}`);
      }
    }
    
    toast.success('Upload concluído');
    fetchAssets();
    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLinkFromLibrary = async (libraryAsset: LibraryAsset) => {
    const filePath = `${selectedFolder}/${libraryAsset.name}`;
    
    // Check if already linked
    const existingAsset = assets.find(a => a.file_path === filePath);
    if (existingAsset) {
      toast.error('Este asset já está vinculado');
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('marketing-assets')
      .getPublicUrl(filePath);

    // Insert into content_assets table
    const { error } = await supabase
      .from('content_assets')
      .insert({
        content_item_id: contentItemId,
        file_name: libraryAsset.name,
        file_path: filePath,
        file_type: getFileType(libraryAsset.name),
        public_url: urlData.publicUrl,
      });

    if (error) {
      toast.error('Erro ao vincular asset');
    } else {
      toast.success('Asset vinculado com sucesso');
      fetchAssets();
    }
  };

  const handleUnlink = async (asset: ContentAsset) => {
    // Only remove from content_assets table, don't delete from storage
    const { error } = await supabase
      .from('content_assets')
      .delete()
      .eq('id', asset.id);
    
    if (error) {
      toast.error('Erro ao desvincular asset');
    } else {
      toast.success('Asset desvinculado (arquivo preservado na biblioteca)');
      fetchAssets();
    }
  };

  const handlePreview = (asset: ContentAsset) => {
    if (asset.public_url) {
      window.open(asset.public_url, '_blank');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredLibraryAssets = libraryAssets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div
        className="glass-card rounded-xl p-6"
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-primary'); }}
        onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary'); }}
        onDrop={async (e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('ring-2', 'ring-primary');
          const files = e.dataTransfer.files;
          if (files && files.length > 0 && fileInputRef.current) {
            const dt = new DataTransfer();
            Array.from(files).forEach(f => dt.items.add(f));
            fileInputRef.current.files = dt.files;
            fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-medium text-foreground">Assets Vinculados</h3>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*/*"
              className="hidden"
              onChange={handleUpload}
            />
            
            <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Link2 className="w-4 h-4 mr-2" />
                  Da Biblioteca
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Vincular da Biblioteca</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {/* Folders sidebar */}
                  <div className="col-span-1 space-y-1">
                    {LIBRARY_FOLDERS.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-xs",
                          selectedFolder === folder.id 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        <FolderOpen className="w-4 h-4" />
                        {folder.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Assets grid */}
                  <div className="col-span-3">
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    {libraryLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : filteredLibraryAssets.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        Nenhum asset encontrado
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                        {filteredLibraryAssets.map((asset) => {
                          const isLinked = assets.some(a => a.file_path === `${selectedFolder}/${asset.name}`);
                          const fileType = getFileType(asset.name);
                          const { data } = supabase.storage.from('marketing-assets').getPublicUrl(`${selectedFolder}/${asset.name}`);
                          
                          return (
                            <button
                              key={asset.id || asset.name}
                              onClick={() => !isLinked && handleLinkFromLibrary(asset)}
                              disabled={isLinked}
                              className={cn(
                                "relative rounded-lg overflow-hidden border transition-all",
                                isLinked 
                                  ? "opacity-50 cursor-not-allowed border-muted" 
                                  : "border-transparent hover:border-primary cursor-pointer"
                              )}
                            >
                              <AspectRatio ratio={16/9}>
                                {fileType === 'image' ? (
                                  <img 
                                    src={data.publicUrl} 
                                    alt={asset.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                                    {getFileIcon(fileType)}
                                  </div>
                                )}
                              </AspectRatio>
                              <div className="p-2 bg-background/80">
                                <p className="text-[10px] truncate">{asset.name}</p>
                                {isLinked && (
                                  <span className="text-[9px] text-primary">Já vinculado</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              size="sm" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Enviando...' : 'Novo Upload'}
            </Button>
          </div>
        </div>

        {/* Assets list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nenhum asset vinculado</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Faça upload ou vincule da Biblioteca
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
                <Link2 className="w-4 h-4 mr-2" />
                Da Biblioteca
              </Button>
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div 
                key={asset.id}
                className="glass-card rounded-lg overflow-hidden group border border-transparent hover:border-primary/20 transition-all"
              >
                {/* Preview */}
                <div className="relative">
                  <AspectRatio ratio={16/9}>
                    <AssetPreview asset={asset} />
                  </AspectRatio>
                  
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => handlePreview(asset)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {asset.public_url && (
                      <Button size="sm" variant="secondary" asChild>
                        <a href={asset.public_url} download={asset.file_name}>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleUnlink(asset)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-3 space-y-1">
                  <p className="text-[11px] text-foreground truncate font-medium">{asset.file_name}</p>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {getFileIcon(asset.file_type)}
                      <span className="capitalize">{asset.file_type || 'arquivo'}</span>
                    </span>
                    <span>{formatFileSize(asset.file_size)}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground/70">
                    {new Date(asset.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}