import { useState, useRef, useCallback } from "react";
import { ProjectWithStages } from "@/hooks/useProjects";
import { useProjectFiles, FileFolder, ProjectFile, FileCategory } from "@/hooks/useProjectFiles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { 
  Folder, FileVideo, FileImage, FileText, File, Upload,
  MoreVertical, Download, Trash2, Eye, EyeOff, FolderInput,
  Loader2, X, Sparkles, Plus, FolderPlus,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FilesTabProps {
  project: ProjectWithStages;
}

interface FileWithAI {
  file: File;
  suggestedFolder: string;
  suggestedName: string;
  confidence: number;
  isNewCategory: boolean;
  newCategoryName?: string;
  selectedFolder: string;
  isClassifying: boolean;
  mode: 'ai' | 'existing' | 'new';
  newCategoryInput: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'file-video': FileVideo,
  'folder': Folder,
  'file-image': FileImage,
  'file-text': FileText,
  'file': File,
};

function getCategoryIcon(icon: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[icon] || Folder;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return File;
  if (fileType.startsWith('video/')) return FileVideo;
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  return File;
}

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function classifyFile(fileName: string, fileType: string, mimeType: string, existingCategories: string[]): Promise<{
  suggestedFolder: string;
  suggestedName: string;
  confidence: number;
  isNewCategory: boolean;
  newCategoryName?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('classify-file', {
      body: { fileName, fileType, mimeType, existingCategories },
    });
    if (error) throw error;
    return data;
  } catch {
    return { suggestedFolder: 'outros', suggestedName: 'Outros', confidence: 0, isNewCategory: false };
  }
}

export function FilesTab({ project }: FilesTabProps) {
  const { 
    files, filesByFolder, categories, folderOrder, isLoading, 
    uploadFile, deleteFile, togglePortalVisibility, moveFile, createCategory,
    renameCategory, deleteCategory,
  } = useProjectFiles(project.id);
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [filesWithAI, setFilesWithAI] = useState<FileWithAI[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [fileToMove, setFileToMove] = useState<ProjectFile | null>(null);
  const [newFolder, setNewFolder] = useState<FileFolder>('outros');
  const [isDragging, setIsDragging] = useState(false);
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [renamingCategory, setRenamingCategory] = useState<FileCategory | null>(null);
  const [renameCategoryName, setRenameCategoryName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryMap = categories.reduce((acc, c) => {
    acc[c.slug] = c;
    return acc;
  }, {} as Record<string, FileCategory>);

  const existingSlugs = categories.map(c => c.slug);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const items: FileWithAI[] = rawFiles.map(f => ({
      file: f,
      suggestedFolder: 'outros',
      suggestedName: 'Outros',
      confidence: 0,
      isNewCategory: false,
      selectedFolder: 'outros',
      isClassifying: true,
      mode: 'ai' as const,
      newCategoryInput: '',
    }));
    setFilesWithAI(items);
    setUploadModalOpen(true);

    // Classify all files in parallel
    const results = await Promise.all(
      rawFiles.map(f => classifyFile(f.name, f.type.split('/')[0] || '', f.type, existingSlugs))
    );

    setFilesWithAI(prev => prev.map((item, i) => ({
      ...item,
      suggestedFolder: results[i].suggestedFolder,
      suggestedName: results[i].suggestedName,
      confidence: results[i].confidence,
      isNewCategory: results[i].isNewCategory,
      newCategoryName: results[i].newCategoryName,
      selectedFolder: results[i].suggestedFolder,
      isClassifying: false,
    })));
  };

  const handleUpload = async () => {
    if (filesWithAI.length === 0) return;
    setIsUploading(true);

    try {
      for (const item of filesWithAI) {
        let folder = item.selectedFolder;

        // If creating new category
        if (item.mode === 'new' && item.newCategoryInput.trim()) {
          const slug = slugify(item.newCategoryInput);
          folder = slug;
          // Create category if not exists
          if (!existingSlugs.includes(slug)) {
            await createCategory.mutateAsync({
              name: item.newCategoryInput.trim(),
              slug,
              projectId: project.id,
            });
          }
        } else if (item.mode === 'ai' && item.isNewCategory && item.newCategoryName) {
          const slug = slugify(item.newCategoryName);
          folder = slug;
          if (!existingSlugs.includes(slug)) {
            await createCategory.mutateAsync({
              name: item.newCategoryName,
              slug,
              projectId: project.id,
            });
          }
        }

        await uploadFile.mutateAsync({
          file: item.file,
          folder,
          projectId: project.id,
        });
      }
      setFilesWithAI([]);
      setUploadModalOpen(false);
    } finally {
      setIsUploading(false);
    }
  };

  const updateFileItem = (index: number, updates: Partial<FileWithAI>) => {
    setFilesWithAI(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const handleDelete = async (fileId: string) => {
    if (confirm('Tem certeza que deseja excluir este arquivo?')) {
      await deleteFile.mutateAsync(fileId);
    }
  };

  const handleTogglePortal = async (file: ProjectFile) => {
    await togglePortalVisibility.mutateAsync({ fileId: file.id, visible: !file.visible_in_portal });
  };

  const handleMoveFile = async () => {
    if (!fileToMove) return;
    await moveFile.mutateAsync({ fileId: fileToMove.id, newFolder });
    setMoveModalOpen(false);
    setFileToMove(null);
  };

  const openMoveModal = (file: ProjectFile) => {
    setFileToMove(file);
    setNewFolder(file.folder);
    setMoveModalOpen(true);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const slug = slugify(newCategoryName);
    await createCategory.mutateAsync({ name: newCategoryName.trim(), slug, projectId: project.id });
    setNewCategoryName('');
    setNewCategoryModalOpen(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback(async (e: React.DragEvent, _folder: FileFolder) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    // Show modal immediately with classifying state
    const items: FileWithAI[] = droppedFiles.map(f => ({
      file: f, suggestedFolder: 'outros', suggestedName: 'Outros',
      confidence: 0, isNewCategory: false, selectedFolder: 'outros',
      isClassifying: true, mode: 'ai' as const, newCategoryInput: '',
    }));
    setFilesWithAI(items);
    setUploadModalOpen(true);

    // Classify all in parallel
    const results = await Promise.all(
      droppedFiles.map(f => classifyFile(f.name, f.type.split('/')[0] || '', f.type, existingSlugs))
    );

    setFilesWithAI(prev => prev.map((item, i) => ({
      ...item,
      suggestedFolder: results[i].suggestedFolder,
      suggestedName: results[i].suggestedName,
      confidence: results[i].confidence,
      isNewCategory: results[i].isNewCategory,
      newCategoryName: results[i].newCategoryName,
      selectedFolder: results[i].suggestedFolder,
      isClassifying: false,
    })));
  }, [existingSlugs]);

  const handleGlobalDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    const items: FileWithAI[] = droppedFiles.map(f => ({
      file: f, suggestedFolder: 'outros', suggestedName: 'Outros',
      confidence: 0, isNewCategory: false, selectedFolder: 'outros',
      isClassifying: true, mode: 'ai' as const, newCategoryInput: '',
    }));
    setFilesWithAI(items);
    setUploadModalOpen(true);

    const results = await Promise.all(
      droppedFiles.map(f => classifyFile(f.name, f.type.split('/')[0] || '', f.type, existingSlugs))
    );

    setFilesWithAI(prev => prev.map((item, i) => ({
      ...item,
      suggestedFolder: results[i].suggestedFolder,
      suggestedName: results[i].suggestedName,
      confidence: results[i].confidence,
      isNewCategory: results[i].isNewCategory,
      newCategoryName: results[i].newCategoryName,
      selectedFolder: results[i].suggestedFolder,
      isClassifying: false,
    })));
  }, [existingSlugs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalFiles = files.length;

  return (
    <div
      className="space-y-6 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleGlobalDrop}
    >
      {/* Global drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 bg-primary/5 border-2 border-dashed border-primary rounded-xl flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="w-10 h-10" />
            <p className="text-sm font-medium">Solte os arquivos aqui</p>
            <p className="text-xs text-muted-foreground">A IA classificará automaticamente</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalFiles} arquivo{totalFiles !== 1 ? 's' : ''} no projeto
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setNewCategoryModalOpen(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
          <Button onClick={() => { setFilesWithAI([]); setUploadModalOpen(true); }}>
            <Upload className="w-4 h-4 mr-2" />
            Upload de Arquivo
          </Button>
        </div>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folderOrder.map((folderKey) => {
          const cat = categoryMap[folderKey];
          const name = cat?.name || folderKey;
          const Icon = cat ? getCategoryIcon(cat.icon) : Folder;
          const folderFiles = filesByFolder[folderKey] || [];
          
          return (
            <div 
              key={folderKey} 
              className={cn(
                "glass-card rounded-xl overflow-hidden transition-all",
                isDragging && "ring-2 ring-primary/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folderKey)}
            >
              <div className="p-4 border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{name}</span>
                    {cat && !cat.is_default && (
                      <Badge variant="secondary" className="text-xs">Custom</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {folderFiles.length} arquivo{folderFiles.length !== 1 ? 's' : ''}
                    </span>
                    {cat && !cat.is_default && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setRenamingCategory(cat);
                            setRenameCategoryName(cat.name);
                          }}>
                            <FileText className="w-4 h-4 mr-2" /> Renomear
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (folderFiles.length > 0) {
                                toast.error('Mova ou exclua os arquivos antes de excluir a categoria');
                                return;
                              }
                              if (confirm(`Excluir categoria "${cat.name}"?`)) {
                                deleteCategory.mutate(cat.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-2 max-h-64 overflow-y-auto">
                {folderFiles.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">
                    Arraste arquivos aqui
                  </p>
                ) : (
                  <div className="space-y-1">
                    {folderFiles.map((file) => {
                      const FileIcon = getFileIcon(file.file_type);
                      return (
                        <div key={file.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group">
                          <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.file_size)}
                              {file.visible_in_portal && <span className="ml-2 text-primary">• Portal</span>}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 mr-2" /> Download
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTogglePortal(file)}>
                                {file.visible_in_portal ? (
                                  <><EyeOff className="w-4 h-4 mr-2" /> Ocultar do Portal</>
                                ) : (
                                  <><Eye className="w-4 h-4 mr-2" /> Mostrar no Portal</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openMoveModal(file)}>
                                <FolderInput className="w-4 h-4 mr-2" /> Mover para...
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(file.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {totalFiles === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum arquivo no projeto</h3>
          <p className="text-muted-foreground mb-6">
            Faça upload de contratos, materiais gráficos, vídeos e outros arquivos do projeto.
          </p>
          <Button onClick={() => setUploadModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" /> Fazer Upload
          </Button>
        </div>
      )}

      {/* Upload Modal with AI Classification */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Arquivos
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* File Input */}
            {filesWithAI.length === 0 && (
              <div>
                <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors border-border"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para selecionar arquivos</p>
                  <p className="text-xs text-muted-foreground mt-1">A IA classificará automaticamente</p>
                </div>
              </div>
            )}

            {/* Files with AI suggestions */}
            {filesWithAI.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{filesWithAI.length} arquivo{filesWithAI.length !== 1 ? 's' : ''}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setFilesWithAI([]); fileInputRef.current?.click(); }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Adicionar mais
                  </Button>
                </div>

                {filesWithAI.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate text-foreground">{item.file.name}</span>
                      </div>
                      <Button
                        variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0"
                        onClick={() => setFilesWithAI(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    {item.isClassifying ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Classificando com IA...
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* AI Suggestion */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={item.mode === 'ai' ? 'default' : 'outline'}
                            className="cursor-pointer text-xs"
                            onClick={() => updateFileItem(idx, { mode: 'ai', selectedFolder: item.suggestedFolder })}
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            {item.isNewCategory ? item.newCategoryName : item.suggestedName}
                            {item.confidence > 0 && (
                              <span className="ml-1 opacity-70">({Math.round(item.confidence * 100)}%)</span>
                            )}
                          </Badge>
                          <Badge
                            variant={item.mode === 'existing' ? 'default' : 'outline'}
                            className="cursor-pointer text-xs"
                            onClick={() => updateFileItem(idx, { mode: 'existing' })}
                          >
                            Escolher
                          </Badge>
                          <Badge
                            variant={item.mode === 'new' ? 'default' : 'outline'}
                            className="cursor-pointer text-xs"
                            onClick={() => updateFileItem(idx, { mode: 'new' })}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Nova
                          </Badge>
                        </div>

                        {/* Existing category dropdown */}
                        {item.mode === 'existing' && (
                          <Select
                            value={item.selectedFolder}
                            onValueChange={(v) => updateFileItem(idx, { selectedFolder: v })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.slug} value={cat.slug}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {/* New category input */}
                        {item.mode === 'new' && (
                          <Input
                            placeholder="Nome da nova categoria..."
                            value={item.newCategoryInput}
                            onChange={(e) => updateFileItem(idx, { newCategoryInput: e.target.value })}
                            className="h-8 text-xs"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadModalOpen(false); setFilesWithAI([]); }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={filesWithAI.length === 0 || isUploading || filesWithAI.some(f => f.isClassifying)}
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Enviar ({filesWithAI.length})</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move File Modal */}
      <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mover Arquivo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">Mover "{fileToMove?.name}" para:</p>
            <Select value={newFolder} onValueChange={setNewFolder}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug} disabled={cat.slug === fileToMove?.folder}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleMoveFile} disabled={newFolder === fileToMove?.folder}>
              <FolderInput className="w-4 h-4 mr-2" /> Mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Category Modal */}
      <Dialog open={newCategoryModalOpen} onOpenChange={setNewCategoryModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome da categoria..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCategoryModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
              <FolderPlus className="w-4 h-4 mr-2" /> Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Category Modal */}
      <Dialog open={!!renamingCategory} onOpenChange={(open) => { if (!open) setRenamingCategory(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear Categoria</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Novo nome..."
              value={renameCategoryName}
              onChange={(e) => setRenameCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renamingCategory && renameCategoryName.trim()) {
                  renameCategory.mutate({
                    id: renamingCategory.id,
                    name: renameCategoryName.trim(),
                    slug: slugify(renameCategoryName),
                  });
                  setRenamingCategory(null);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingCategory(null)}>Cancelar</Button>
            <Button
              disabled={!renameCategoryName.trim()}
              onClick={() => {
                if (renamingCategory) {
                  renameCategory.mutate({
                    id: renamingCategory.id,
                    name: renameCategoryName.trim(),
                    slug: slugify(renameCategoryName),
                  });
                  setRenamingCategory(null);
                }
              }}
            >
              Renomear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
