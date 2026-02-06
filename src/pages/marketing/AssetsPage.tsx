import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BrandKit, MarketingAsset, ASSET_TYPES, AssetType, ColorItem, FontItem } from "@/types/marketing";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { 
  Plus, Search, Upload, Palette, Type, Image, 
  FileText, Trash2, ExternalLink, FolderOpen, X,
  Edit, Loader2
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BrandKitFormData {
  name: string;
  tone_of_voice: string;
  do_list: string;
  dont_list: string;
  colors: ColorItem[];
  fonts: FontItem[];
  logo_url: string | null;
}

const defaultFormData: BrandKitFormData = {
  name: '',
  tone_of_voice: '',
  do_list: '',
  dont_list: '',
  colors: [],
  fonts: [],
  logo_url: null,
};

// Validate hex color
const isValidHex = (hex: string): boolean => {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
};

// Normalize hex to 6-digit uppercase
const normalizeHex = (hex: string): string => {
  if (!hex.startsWith('#')) hex = '#' + hex;
  hex = hex.toUpperCase();
  if (hex.length === 4) {
    // Convert #RGB to #RRGGBB
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
};

export default function AssetsPage() {
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedBrandKit, setSelectedBrandKit] = useState<BrandKit | null>(null);
  
  // Brand Kit Form State
  const [isBrandKitFormOpen, setIsBrandKitFormOpen] = useState(false);
  const [editingBrandKit, setEditingBrandKit] = useState<BrandKit | null>(null);
  const [brandKitFormData, setBrandKitFormData] = useState<BrandKitFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [newColorHex, setNewColorHex] = useState('');
  const [newColorName, setNewColorName] = useState('');

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

  // Open form for creating new Brand Kit
  const openNewBrandKitForm = () => {
    setEditingBrandKit(null);
    setBrandKitFormData(defaultFormData);
    setLogoFile(null);
    setLogoPreview(null);
    setNewColorHex('');
    setNewColorName('');
    setIsBrandKitFormOpen(true);
  };

  // Open form for editing existing Brand Kit
  const openEditBrandKitForm = (kit: BrandKit) => {
    setEditingBrandKit(kit);
    setBrandKitFormData({
      name: kit.name,
      tone_of_voice: kit.tone_of_voice || '',
      do_list: kit.do_list || '',
      dont_list: kit.dont_list || '',
      colors: kit.colors || [],
      fonts: kit.fonts || [],
      logo_url: kit.logo_url || null,
    });
    setLogoFile(null);
    setLogoPreview(kit.logo_url || null);
    setNewColorHex('');
    setNewColorName('');
    setSelectedBrandKit(null);
    setIsBrandKitFormOpen(true);
  };

  // Handle logo file selection
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(png|jpeg|jpg|svg\+xml)$/)) {
        toast.error('Apenas PNG, JPG ou SVG são permitidos');
        return;
      }
      setLogoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setBrandKitFormData({ ...brandKitFormData, logo_url: null });
  };

  // Add color
  const handleAddColor = () => {
    let hex = newColorHex.trim();
    if (!hex) return;
    
    // Add # if missing
    if (!hex.startsWith('#')) hex = '#' + hex;
    
    if (!isValidHex(hex)) {
      toast.error('Cor inválida. Use formato #RGB ou #RRGGBB');
      return;
    }
    
    const normalizedHex = normalizeHex(hex);
    
    // Check if color already exists
    if (brandKitFormData.colors.some(c => c.hex.toUpperCase() === normalizedHex)) {
      toast.error('Esta cor já foi adicionada');
      return;
    }

    setBrandKitFormData({
      ...brandKitFormData,
      colors: [...brandKitFormData.colors, { 
        hex: normalizedHex, 
        name: newColorName.trim() || `Cor ${brandKitFormData.colors.length + 1}` 
      }],
    });
    setNewColorHex('');
    setNewColorName('');
  };

  // Remove color
  const handleRemoveColor = (index: number) => {
    setBrandKitFormData({
      ...brandKitFormData,
      colors: brandKitFormData.colors.filter((_, i) => i !== index),
    });
  };

  // Submit Brand Kit form
  const handleSubmitBrandKit = async () => {
    if (!brandKitFormData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      let logoUrl = brandKitFormData.logo_url;

      // Upload new logo if selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const kitId = editingBrandKit?.id || crypto.randomUUID();
        const filePath = `brand-kits/${kitId}/logo.${fileExt}`;

        // Delete old logo if exists
        if (editingBrandKit?.logo_url) {
          const oldPath = editingBrandKit.logo_url.split('/').slice(-3).join('/');
          await supabase.storage.from('marketing-assets').remove([oldPath]);
        }

        const { error: uploadError } = await supabase.storage
          .from('marketing-assets')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('marketing-assets')
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
      }

      const payload = {
        name: brandKitFormData.name.trim(),
        tone_of_voice: brandKitFormData.tone_of_voice || null,
        do_list: brandKitFormData.do_list || null,
        dont_list: brandKitFormData.dont_list || null,
        colors: brandKitFormData.colors as unknown as Json,
        fonts: brandKitFormData.fonts as unknown as Json,
        logo_url: logoUrl,
      };

      if (editingBrandKit) {
        // Update existing
        const { data, error } = await supabase
          .from('brand_kits')
          .update(payload)
          .eq('id', editingBrandKit.id)
          .select()
          .single();

        if (error) throw error;
        
        setBrandKits(brandKits.map(k => k.id === editingBrandKit.id ? data as unknown as BrandKit : k));
        toast.success('Brand Kit atualizado');
      } else {
        // Create new
        const { data, error } = await supabase
          .from('brand_kits')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        setBrandKits([data as unknown as BrandKit, ...brandKits]);
        toast.success('Brand Kit criado');
      }

      setIsBrandKitFormOpen(false);
      setBrandKitFormData(defaultFormData);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error: any) {
      console.error('Error saving brand kit:', error);
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setIsSubmitting(false);
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

  const handleDeleteBrandKit = async (id: string) => {
    const kit = brandKits.find(k => k.id === id);
    if (kit?.logo_url) {
      // Try to remove logo from storage
      const logoPath = kit.logo_url.split('/').slice(-3).join('/');
      await supabase.storage.from('marketing-assets').remove([logoPath]);
    }
    await supabase.from('brand_kits').delete().eq('id', id);
    setBrandKits(brandKits.filter(k => k.id !== id));
    setSelectedBrandKit(null);
    toast.success('Brand Kit excluído');
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
              <Button onClick={openNewBrandKitForm}>
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
                <Button variant="outline" className="mt-4" onClick={openNewBrandKitForm}>
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

        {/* Brand Kit Form Dialog (Create/Edit) */}
        <Dialog open={isBrandKitFormOpen} onOpenChange={setIsBrandKitFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingBrandKit ? 'Editar Brand Kit' : 'Novo Brand Kit'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Logo Upload */}
              <div>
                <Label>Logo</Label>
                <div className="mt-2">
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-24 h-24 object-contain rounded-lg border border-border bg-muted/30"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 w-6 h-6"
                        onClick={handleRemoveLogo}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Upload</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".png,.jpg,.jpeg,.svg"
                        onChange={handleLogoFileChange}
                      />
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">PNG, JPG ou SVG</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <Label>Nome *</Label>
                <Input
                  value={brandKitFormData.name}
                  onChange={(e) => setBrandKitFormData({ ...brandKitFormData, name: e.target.value })}
                  placeholder="Ex: Cliente ABC"
                />
              </div>

              {/* Colors */}
              <div>
                <Label>Cores</Label>
                <div className="mt-2 space-y-3">
                  {/* Existing colors */}
                  {brandKitFormData.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <TooltipProvider>
                        {brandKitFormData.colors.map((color, index) => (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <div className="relative group">
                                <div
                                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <button
                                  type="button"
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                  onClick={() => handleRemoveColor(index)}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono text-xs">{color.hex}</p>
                              {color.name && <p className="text-xs">{color.name}</p>}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                  )}

                  {/* Add new color */}
                  <div className="flex gap-2">
                    <Input
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      placeholder="#FFFFFF"
                      className="w-28 font-mono"
                    />
                    <Input
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="Nome (opcional)"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={handleAddColor}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tone of Voice */}
              <div>
                <Label>Tom de Voz</Label>
                <Textarea
                  value={brandKitFormData.tone_of_voice}
                  onChange={(e) => setBrandKitFormData({ ...brandKitFormData, tone_of_voice: e.target.value })}
                  placeholder="Descreva como a marca deve se comunicar..."
                  rows={3}
                />
              </div>

              {/* Do's */}
              <div>
                <Label>PODE (Do's)</Label>
                <Textarea
                  value={brandKitFormData.do_list}
                  onChange={(e) => setBrandKitFormData({ ...brandKitFormData, do_list: e.target.value })}
                  placeholder="O que pode fazer na comunicação..."
                  rows={2}
                />
              </div>

              {/* Don'ts */}
              <div>
                <Label>NÃO PODE (Don'ts)</Label>
                <Textarea
                  value={brandKitFormData.dont_list}
                  onChange={(e) => setBrandKitFormData({ ...brandKitFormData, dont_list: e.target.value })}
                  placeholder="O que evitar na comunicação..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBrandKitFormOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitBrandKit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingBrandKit ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Brand Kit Detail Dialog */}
        <Dialog open={!!selectedBrandKit} onOpenChange={() => setSelectedBrandKit(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedBrandKit?.logo_url && (
                  <img 
                    src={selectedBrandKit.logo_url} 
                    alt={selectedBrandKit.name} 
                    className="w-10 h-10 object-contain rounded"
                  />
                )}
                {selectedBrandKit?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedBrandKit && (
              <div className="space-y-4 py-4">
                {/* Colors Preview */}
                {selectedBrandKit.colors && selectedBrandKit.colors.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Cores</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <TooltipProvider>
                        {selectedBrandKit.colors.map((color, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <div
                                className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                                style={{ backgroundColor: color.hex }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono text-xs">{color.hex}</p>
                              {color.name && <p className="text-xs">{color.name}</p>}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                  </div>
                )}

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
            <DialogFooter className="gap-2">
              <Button 
                variant="destructive" 
                onClick={() => selectedBrandKit && handleDeleteBrandKit(selectedBrandKit.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
              <Button onClick={() => selectedBrandKit && openEditBrandKitForm(selectedBrandKit)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </DialogFooter>
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
        {kit.logo_url ? (
          <img 
            src={kit.logo_url} 
            alt={kit.name} 
            className="w-12 h-12 object-contain rounded-xl border border-border bg-muted/30"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette className="w-6 h-6 text-primary" />
          </div>
        )}
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

      {/* Colors Preview with Tooltip */}
      {kit.colors && kit.colors.length > 0 && (
        <div className="flex items-center gap-1 mt-4">
          <TooltipProvider>
            {kit.colors.slice(0, 5).map((color, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div 
                    className="w-6 h-6 rounded border border-border cursor-pointer"
                    style={{ backgroundColor: color.hex }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{color.hex}</p>
                  {color.name && <p className="text-xs">{color.name}</p>}
                </TooltipContent>
              </Tooltip>
            ))}
            {kit.colors.length > 5 && (
              <span className="text-xs text-muted-foreground ml-1">+{kit.colors.length - 5}</span>
            )}
          </TooltipProvider>
        </div>
      )}
    </Card>
  );
}
