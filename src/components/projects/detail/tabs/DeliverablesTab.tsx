import { useState } from "react";
import { ProjectWithStages } from "@/hooks/useProjects";
import { useDeliverables, Deliverable, DELIVERABLE_STATUSES, DELIVERABLE_TYPES } from "@/hooks/useDeliverables";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Plus, Inbox, FileVideo, FileImage, FileText, File, Link2, Package,
  MoreHorizontal, Edit, Trash2, ExternalLink, Loader2, Upload, Search
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeliverablesTabProps {
  project: ProjectWithStages;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  video: FileVideo, image: FileImage, pdf: FileText, file: File, link: Link2, package: Package,
};

function getStatusInfo(status: string) {
  return DELIVERABLE_STATUSES.find(s => s.key === status) || DELIVERABLE_STATUSES[0];
}

function detectLinkProvider(url: string): string {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/vimeo\.com/i.test(url)) return "vimeo";
  if (/drive\.google/i.test(url)) return "drive";
  return "generic";
}

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

export function DeliverablesTab({ project }: DeliverablesTabProps) {
  const { deliverables, isLoading, createDeliverable, updateDeliverable, deleteDeliverable, uploadFile } = useDeliverables(project.id);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form state
  const [form, setForm] = useState({ name: "", description: "", type: "file", priority: "normal", status: "not_started", due_date: "", link_url: "" });
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setForm({ name: "", description: "", type: "file", priority: "normal", status: "not_started", due_date: "", link_url: "" });
    setUploadingFiles([]);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setIsUploading(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let mimeType: string | null = null;
      let fileSize: number | null = null;
      let thumbnailUrl: string | null = null;
      let linkUrl: string | null = null;
      let linkProvider: string | null = null;

      if (form.type === "link" && form.link_url) {
        linkUrl = form.link_url;
        linkProvider = detectLinkProvider(form.link_url);
        thumbnailUrl = getYoutubeThumbnail(form.link_url);
      } else if (uploadingFiles.length > 0) {
        const file = uploadingFiles[0];
        const result = await uploadFile(file);
        fileUrl = result.url;
        fileName = file.name;
        mimeType = file.type;
        fileSize = file.size;
        if (file.type.startsWith("image/")) thumbnailUrl = result.url;
      }

      await createDeliverable.mutateAsync({
        name: form.name,
        description: form.description || null,
        type: form.type,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null,
        file_url: fileUrl,
        file_name: fileName,
        mime_type: mimeType,
        file_size: fileSize,
        thumbnail_url: thumbnailUrl,
        link_url: linkUrl,
        link_provider: linkProvider,
      } as any);

      // Create additional deliverables for extra files
      if (uploadingFiles.length > 1) {
        for (let i = 1; i < uploadingFiles.length; i++) {
          const file = uploadingFiles[i];
          const result = await uploadFile(file);
          await createDeliverable.mutateAsync({
            name: file.name.replace(/\.[^.]+$/, ""),
            type: file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "file",
            status: "not_started",
            priority: "normal",
            file_url: result.url,
            file_name: file.name,
            mime_type: file.type,
            file_size: file.size,
            thumbnail_url: file.type.startsWith("image/") ? result.url : null,
          } as any);
        }
      }

      setIsNewOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingDeliverable) return;
    await updateDeliverable.mutateAsync({
      id: editingDeliverable.id,
      name: form.name,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      type: form.type,
      due_date: form.due_date || null,
    } as any);
    setEditingDeliverable(null);
    resetForm();
  };

  const openEdit = (d: Deliverable) => {
    setForm({
      name: d.name,
      description: d.description || "",
      type: d.type,
      priority: d.priority,
      status: d.status,
      due_date: d.due_date || "",
      link_url: d.link_url || "",
    });
    setEditingDeliverable(d);
  };

  const filtered = deliverables.filter(d => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h3 className="font-semibold text-foreground whitespace-nowrap">Entregáveis</h3>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {DELIVERABLE_STATUSES.map(s => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setIsNewOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Entregável
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Nenhum entregável criado ainda.</p>
          <Button onClick={() => { resetForm(); setIsNewOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Entregável
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(d => {
            const statusInfo = getStatusInfo(d.status);
            const TypeIcon = TYPE_ICONS[d.type] || File;
            return (
              <div
                key={d.id}
                className="glass-card rounded-xl p-4 space-y-3 group hover:border-primary/20 transition-all"
              >
                {/* Thumbnail */}
                {d.thumbnail_url ? (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img src={d.thumbnail_url} alt={d.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
                    <TypeIcon className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}

                {/* Info */}
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    {d.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{d.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(d)}>
                        <Edit className="w-4 h-4 mr-2" />Editar
                      </DropdownMenuItem>
                      {(d.file_url || d.link_url) && (
                        <DropdownMenuItem onClick={() => window.open(d.file_url || d.link_url || "", "_blank")}>
                          <ExternalLink className="w-4 h-4 mr-2" />Abrir
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => deleteDeliverable.mutate(d.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />Arquivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", statusInfo.color)}>
                    {statusInfo.label}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    V{d.version_number}
                  </Badge>
                  {d.due_date && (
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(d.due_date), "dd MMM", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Deliverable Dialog */}
      <Dialog open={isNewOpen} onOpenChange={v => { if (!v) resetForm(); setIsNewOpen(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Entregável</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome do entregável" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Detalhes..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DELIVERABLE_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DELIVERABLE_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Data Limite</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>

            {form.type === "link" ? (
              <div>
                <Label>URL</Label>
                <Input value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
              </div>
            ) : (
              <div>
                <Label>Arquivos</Label>
                <div className="border border-dashed border-border rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={e => setUploadingFiles(Array.from(e.target.files || []))}
                    className="hidden"
                    id="deliverable-upload"
                  />
                  <label htmlFor="deliverable-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {uploadingFiles.length > 0
                        ? `${uploadingFiles.length} arquivo(s) selecionado(s)`
                        : "Clique para selecionar arquivos"}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim() || isUploading || createDeliverable.isPending}>
              {(isUploading || createDeliverable.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDeliverable} onOpenChange={v => { if (!v) { setEditingDeliverable(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Entregável</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DELIVERABLE_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DELIVERABLE_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Data Limite</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingDeliverable(null); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={!form.name.trim() || updateDeliverable.isPending}>
              {updateDeliverable.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
