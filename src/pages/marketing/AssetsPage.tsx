import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BrandKit, MarketingAsset, ASSET_TYPES, AssetType } from "@/types/marketing";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, Search, Upload, Palette, Type, Image, 
  FileText, Trash2, ExternalLink, FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AssetsPage() {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isNewBrandKitOpen, setIsNewBrandKitOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedBrandKit, setSelectedBrandKit] = useState<BrandKit | null>(null);
  const [newBrandKit, setNewBrandKit] = useState({
    name: '',
    tone_of_voice: '',
    do_list: '',
    dont_list: '',
  });
  const [uploadData, setUploadData] = useState({
    title: '',
    type: 'photo' as AssetType,
    tags: '',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchBrandKits();
    fetchAssets();
  }, []);

  const fetchBrandKits = async () => {
    const { data } = await supabase
      .from('brand_kits')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setBrandKits(data as unknown as BrandKit[]);
  };

  const fetchAssets = async () => {
    const { data } = await supabase
      .from('marketing_assets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setAssets(data as MarketingAsset[]);
  };

  const filteredAssets = assets.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    return true;
  });

  const handleCreateBrandKit = async () => {
    if (!newBrandKit.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    const { data, error } = await supabase
      .from('brand_kits')
      .insert([{
        name: newBrandKit.name,
        tone_of_voice: newBrandKit.tone_of_voice || null,
        do_list: newBrandKit.do_list || null,
        dont_list: newBrandKit.dont_list || null,
      }])
      .select()
      .single();

    if (!error && data) {
      setBrandKits([data as unknown as BrandKit, ...brandKits]);
      setNewBrandKit({ name: '', tone_of_voice: '', do_list: '', dont_list: '' });
      setIsNewBrandKitOpen(false);
      toast.success('Brand Kit criado');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadData.title) {
      toast.error('Arquivo e título são obrigatórios');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('marketing-assets')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('marketing-assets')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('marketing_assets')
        .insert([{
          title: uploadData.title,
          type: uploadData.type,
          storage_path: filePath,
          public_url: publicUrl,
          file_size: uploadFile.size,
          mime_type: uploadFile.type,
          tags: uploadData.tags ? uploadData.tags.split(',').map(t => t.trim()) : [],
        }])
        .select()
        .single();

      if (!error && data) {
        setAssets([data as MarketingAsset, ...assets]);
        setUploadData({ title: '', type: 'photo', tags: '' });
        setUploadFile(null);
        setIsUploadOpen(false);
        toast.success('Asset enviado');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAsset = async (id: string, storagePath?: string) => {
    if (storagePath) {
      await supabase.storage.from('marketing-assets').remove([storagePath]);
    }
    await supabase.from('marketing_assets').delete().eq('id', id);
    setAssets(assets.filter(a => a.id !== id));
    toast.success('Asset excluído');
  };

  return (
    <DashboardLayout title="Assets & Brand Kits">
      <div className="space-y-6">
        <Tabs defaultValue="assets">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TabsList>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="brand-kits">Brand Kits</TabsTrigger>
            </TabsList>
          </div>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6 mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar assets..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {ASSET_TYPES.map((t) => (
                      <SelectItem key={t.type} value={t.type}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setIsUploadOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredAssets.map((asset) => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  onDelete={() => handleDeleteAsset(asset.id, asset.storage_path)}
                />
              ))}
            </div>

            {filteredAssets.length === 0 && (
              <Card className="glass-card p-12 text-center">
                <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum asset encontrado</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsUploadOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Fazer primeiro upload
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Brand Kits Tab */}
          <TabsContent value="brand-kits" className="space-y-6 mt-6">
            <div className="flex justify-end">
              <Button onClick={() => setIsNewBrandKitOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Brand Kit
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brandKits.map((kit) => (
                <BrandKitCard 
                  key={kit.id} 
                  kit={kit} 
                  onClick={() => setSelectedBrandKit(kit)}
                />
              ))}
            </div>

            {brandKits.length === 0 && (
              <Card className="glass-card p-12 text-center">
                <Palette className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum Brand Kit criado</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsNewBrandKitOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeiro Brand Kit
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Upload Dialog */}
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload de Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Arquivo</Label>
                <Input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                />
              </div>
              <div>
                <Label>Título *</Label>
                <Input
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  placeholder="Nome do asset"
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select 
                  value={uploadData.type} 
                  onValueChange={(v: AssetType) => setUploadData({ ...uploadData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => (
                      <SelectItem key={t.type} value={t.type}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                  placeholder="Ex: logo, cliente, 2024"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Enviando...' : 'Enviar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Brand Kit Dialog */}
        <Dialog open={isNewBrandKitOpen} onOpenChange={setIsNewBrandKitOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Brand Kit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={newBrandKit.name}
                  onChange={(e) => setNewBrandKit({ ...newBrandKit, name: e.target.value })}
                  placeholder="Ex: Cliente ABC"
                />
              </div>
              <div>
                <Label>Tom de Voz</Label>
                <Textarea
                  value={newBrandKit.tone_of_voice}
                  onChange={(e) => setNewBrandKit({ ...newBrandKit, tone_of_voice: e.target.value })}
                  placeholder="Descreva como a marca deve se comunicar..."
                  rows={3}
                />
              </div>
              <div>
                <Label>PODE (Do's)</Label>
                <Textarea
                  value={newBrandKit.do_list}
                  onChange={(e) => setNewBrandKit({ ...newBrandKit, do_list: e.target.value })}
                  placeholder="O que pode fazer na comunicação..."
                  rows={2}
                />
              </div>
              <div>
                <Label>NÃO PODE (Don'ts)</Label>
                <Textarea
                  value={newBrandKit.dont_list}
                  onChange={(e) => setNewBrandKit({ ...newBrandKit, dont_list: e.target.value })}
                  placeholder="O que evitar na comunicação..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewBrandKitOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateBrandKit}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Brand Kit Detail Dialog */}
        <Dialog open={!!selectedBrandKit} onOpenChange={() => setSelectedBrandKit(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedBrandKit?.name}</DialogTitle>
            </DialogHeader>
            {selectedBrandKit && (
              <div className="space-y-4 py-4">
                {selectedBrandKit.tone_of_voice && (
                  <div>
                    <Label className="text-muted-foreground">Tom de Voz</Label>
                    <p className="text-sm text-foreground mt-1">{selectedBrandKit.tone_of_voice}</p>
                  </div>
                )}
                {selectedBrandKit.do_list && (
                  <div>
                    <Label className="text-muted-foreground">PODE</Label>
                    <p className="text-sm text-foreground mt-1">{selectedBrandKit.do_list}</p>
                  </div>
                )}
                {selectedBrandKit.dont_list && (
                  <div>
                    <Label className="text-muted-foreground">NÃO PODE</Label>
                    <p className="text-sm text-foreground mt-1">{selectedBrandKit.dont_list}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function AssetCard({ asset, onDelete }: { asset: MarketingAsset; onDelete: () => void }) {
  const assetType = ASSET_TYPES.find(t => t.type === asset.type);
  const isImage = asset.mime_type?.startsWith('image/');
  const isVideo = asset.mime_type?.startsWith('video/');

  return (
    <Card className="glass-card overflow-hidden group">
      {/* Preview */}
      <div className="aspect-square bg-muted/30 flex items-center justify-center relative">
        {isImage && asset.public_url ? (
          <img 
            src={asset.public_url} 
            alt={asset.title} 
            className="w-full h-full object-cover"
          />
        ) : isVideo && asset.public_url ? (
          <video 
            src={asset.public_url}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-4xl text-muted-foreground">
            {assetType?.icon || 'folder'}
          </span>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {asset.public_url && (
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => window.open(asset.public_url, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-foreground truncate">{asset.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[9px]">{assetType?.name}</Badge>
          {asset.tags && asset.tags.length > 0 && (
            <span className="text-[10px] text-muted-foreground truncate">
              {asset.tags.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

function BrandKitCard({ kit, onClick }: { kit: BrandKit; onClick: () => void }) {
  return (
    <Card 
      className="glass-card p-6 cursor-pointer hover:border-primary/30 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Palette className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">{kit.name}</h3>
          <p className="text-xs text-muted-foreground">
            {new Date(kit.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {kit.tone_of_voice && (
        <p className="text-sm text-muted-foreground line-clamp-2">{kit.tone_of_voice}</p>
      )}

      {/* Colors Preview */}
      {kit.colors && kit.colors.length > 0 && (
        <div className="flex gap-1 mt-4">
          {kit.colors.slice(0, 5).map((color, i) => (
            <div 
              key={i}
              className="w-6 h-6 rounded"
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
