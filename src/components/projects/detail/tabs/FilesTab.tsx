import { useState, useRef, useCallback } from "react";
import { ProjectWithStages } from "@/hooks/useProjects";
import { useProjectFiles, FileFolder, ProjectFile } from "@/hooks/useProjectFiles";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Folder, 
  FileVideo, 
  FileImage, 
  FileText, 
  File, 
  Upload,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  EyeOff,
  FolderInput,
  Loader2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FilesTabProps {
  project: ProjectWithStages;
}

const FOLDER_CONFIG: Record<FileFolder, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
  brutos: { name: 'Brutos', icon: FileVideo },
  projeto: { name: 'Projeto', icon: Folder },
  referencias: { name: 'Referências', icon: FileImage },
  entregas: { name: 'Entregas', icon: File },
  contratos: { name: 'Contratos', icon: FileText },
  outros: { name: 'Outros', icon: File },
};

const FOLDER_ORDER: FileFolder[] = ['brutos', 'projeto', 'referencias', 'entregas', 'contratos', 'outros'];

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

export function FilesTab({ project }: FilesTabProps) {
  const { files, filesByFolder, isLoading, uploadFile, deleteFile, togglePortalVisibility, moveFile } = useProjectFiles(project.id);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FileFolder>('outros');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [fileToMove, setFileToMove] = useState<ProjectFile | null>(null);
  const [newFolder, setNewFolder] = useState<FileFolder>('outros');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      for (const file of selectedFiles) {
        await uploadFile.mutateAsync({
          file,
          folder: selectedFolder,
          projectId: project.id,
        });
      }
      setSelectedFiles([]);
      setUploadModalOpen(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (confirm('Tem certeza que deseja excluir este arquivo?')) {
      await deleteFile.mutateAsync(fileId);
    }
  };

  const handleTogglePortal = async (file: ProjectFile) => {
    await togglePortalVisibility.mutateAsync({
      fileId: file.id,
      visible: !file.visible_in_portal,
    });
  };

  const handleMoveFile = async () => {
    if (!fileToMove) return;
    await moveFile.mutateAsync({
      fileId: fileToMove.id,
      newFolder,
    });
    setMoveModalOpen(false);
    setFileToMove(null);
  };

  const openMoveModal = (file: ProjectFile) => {
    setFileToMove(file);
    setNewFolder(file.folder);
    setMoveModalOpen(true);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, folder: FileFolder) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setSelectedFiles(droppedFiles);
      setSelectedFolder(folder);
      setUploadModalOpen(true);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalFiles = files.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {totalFiles} arquivo{totalFiles !== 1 ? 's' : ''} no projeto
          </p>
        </div>
        <Button onClick={() => setUploadModalOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload de Arquivo
        </Button>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FOLDER_ORDER.map((folderKey) => {
          const { name, icon: Icon } = FOLDER_CONFIG[folderKey];
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
              {/* Folder Header */}
              <div className="p-4 border-b border-border/50 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {folderFiles.length} arquivo{folderFiles.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Files List */}
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
                        <div
                          key={file.id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group"
                        >
                          <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.file_size)}
                              {file.visible_in_portal && (
                                <span className="ml-2 text-primary">• Portal</span>
                              )}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTogglePortal(file)}>
                                {file.visible_in_portal ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Ocultar do Portal
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Mostrar no Portal
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openMoveModal(file)}>
                                <FolderInput className="w-4 h-4 mr-2" />
                                Mover para...
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(file.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
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
            <Upload className="w-4 h-4 mr-2" />
            Fazer Upload
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload de Arquivo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Folder Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pasta de destino</label>
              <Select value={selectedFolder} onValueChange={(v) => setSelectedFolder(v as FileFolder)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDER_ORDER.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      {FOLDER_CONFIG[folder].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivos</label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-muted/50",
                  selectedFiles.length > 0 ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                {selectedFiles.length === 0 ? (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar arquivos
                    </p>
                  </>
                ) : (
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                </>
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
            <p className="text-sm text-muted-foreground mb-4">
              Mover "{fileToMove?.name}" para:
            </p>
            <Select value={newFolder} onValueChange={(v) => setNewFolder(v as FileFolder)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOLDER_ORDER.map((folder) => (
                  <SelectItem key={folder} value={folder} disabled={folder === fileToMove?.folder}>
                    {FOLDER_CONFIG[folder].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMoveFile} disabled={newFolder === fileToMove?.folder}>
              <FolderInput className="w-4 h-4 mr-2" />
              Mover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
