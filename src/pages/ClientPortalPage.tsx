import { useParams } from "react-router-dom";
import { useClientPortal } from "@/hooks/useClientPortal";
import { AlertTriangle, Lock, Loader2, Play, FileText, Image, Download } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Helper to detect file type
function getFileType(file: { file_type?: string | null; name: string; file_url: string }) {
  if (file.file_type) {
    if (file.file_type.startsWith('video/')) return 'video';
    if (file.file_type.startsWith('image/')) return 'image';
    if (file.file_type === 'application/pdf') return 'pdf';
    return 'document';
  }
  
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'document';
}

// Get icon for file type
function getFileIcon(type: string) {
  switch (type) {
    case 'video': return <Play className="w-8 h-8" />;
    case 'image': return <Image className="w-8 h-8" />;
    default: return <FileText className="w-8 h-8" />;
  }
}

export default function ClientPortalPage() {
  const { shareToken } = useParams();
  const { data, isLoading, error, addComment, approveFile, isApproving } = useClientPortal(shareToken);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', content: '' });

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Invalid or expired link
  if (error || !data) {
    const errorMessage = error?.message || 'Portal not found';
    const isExpired = errorMessage.includes('expired');
    const isInactive = errorMessage.includes('inactive');

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl p-8 max-w-md text-center space-y-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
            isInactive ? "bg-muted" : isExpired ? "bg-amber-500/20" : "bg-destructive/20"
          )}>
            {isInactive ? <Lock className="w-8 h-8 text-muted-foreground" /> : <AlertTriangle className={cn("w-8 h-8", isExpired ? "text-amber-500" : "text-destructive")} />}
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {isInactive ? 'Portal Desativado' : isExpired ? 'Link Expirado' : 'Link Inválido'}
          </h1>
          <p className="text-muted-foreground">
            {isInactive 
              ? 'O acesso ao portal está temporariamente desativado.'
              : isExpired 
                ? 'O link de acesso expirou. Solicite um novo link.'
                : 'Este link não é válido. Entre em contato com a equipe.'}
          </p>
        </div>
      </div>
    );
  }

  const { portal, files, comments, approvals } = data;
  const selectedFile = files.find(f => f.id === selectedFileId);
  const fileComments = comments.filter(c => c.project_file_id === selectedFileId);
  const fileApproval = approvals.find(a => a.project_file_id === selectedFileId);

  const handleAddComment = () => {
    if (!selectedFileId || !commentForm.name || !commentForm.content) return;
    addComment({
      fileId: selectedFileId,
      authorName: commentForm.name,
      authorEmail: commentForm.email,
      content: commentForm.content,
    });
    setCommentForm({ ...commentForm, content: '' });
  };

  const handleApprove = () => {
    if (!selectedFileId || !commentForm.name) return;
    approveFile({
      fileId: selectedFileId,
      approvedByName: commentForm.name,
      approvedByEmail: commentForm.email,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{portal.project_name || 'Projeto'}</h1>
            <p className="text-sm text-muted-foreground">{portal.client_name}</p>
          </div>
          {portal.blocked_by_payment && (
            <Badge variant="destructive">Pendência Financeira</Badge>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Payment Block Alert */}
        {portal.blocked_by_payment && (
          <div className="glass-card rounded-2xl p-6 border-amber-500/30 bg-amber-500/5 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Entrega Pendente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Existe uma pendência financeira que precisa ser regularizada para liberação da entrega final.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {files.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-2">Nenhum arquivo disponível</h3>
            <p className="text-sm text-muted-foreground">
              Os arquivos do projeto aparecerão aqui assim que forem disponibilizados.
            </p>
          </div>
        )}

        {/* Files Grid */}
        {files.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {files.map((file) => {
              const isApproved = approvals.some(a => a.project_file_id === file.id);
              const isSelected = file.id === selectedFileId;
              const fileType = getFileType(file);

              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={cn(
                    "glass-card rounded-2xl p-4 text-left transition-all hover:border-primary/30",
                    isSelected && "border-primary ring-1 ring-primary"
                  )}
                >
                  <div className="aspect-video bg-muted rounded-xl mb-3 overflow-hidden flex items-center justify-center">
                    {fileType === 'image' ? (
                      <img src={file.file_url} alt={file.name} className="w-full h-full object-cover" />
                    ) : fileType === 'video' ? (
                      <video src={file.file_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-muted-foreground">
                        {getFileIcon(fileType)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground truncate">{file.name}</h3>
                    <Badge variant={isApproved ? "default" : "secondary"}>
                      {isApproved ? 'Aprovado' : 'Pendente'}
                    </Badge>
                  </div>
                  {file.folder && (
                    <p className="text-xs text-muted-foreground mt-1">{file.folder}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected File Detail */}
        {selectedFile && (
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedFile.name}</h2>
              <a
                href={selectedFile.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Download className="w-4 h-4" />
                Baixar
              </a>
            </div>
            
            {/* File Preview */}
            {selectedFile.file_url && (
              <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                {getFileType(selectedFile) === 'video' ? (
                  <video src={selectedFile.file_url} controls className="w-full h-full" />
                ) : getFileType(selectedFile) === 'image' ? (
                  <img src={selectedFile.file_url} alt={selectedFile.name} className="w-full h-full object-contain" />
                ) : getFileType(selectedFile) === 'pdf' ? (
                  <iframe src={selectedFile.file_url} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    {getFileIcon(getFileType(selectedFile))}
                    <span className="ml-2">Preview não disponível</span>
                  </div>
                )}
              </div>
            )}

            {/* Approval Status */}
            {fileApproval ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-500 font-semibold">✓ Aprovado por {fileApproval.approved_by_name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(fileApproval.approved_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    placeholder="Seu nome *"
                    value={commentForm.name}
                    onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                  />
                  <Input
                    placeholder="Seu email"
                    type="email"
                    value={commentForm.email}
                    onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                  />
                </div>
                <Textarea
                  placeholder="Comentário ou solicitação de ajuste..."
                  value={commentForm.content}
                  onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                />
                <div className="flex gap-3">
                  <Button onClick={handleAddComment} variant="outline" disabled={!commentForm.name || !commentForm.content}>
                    Enviar Comentário
                  </Button>
                  <Button onClick={handleApprove} disabled={!commentForm.name || isApproving} className="btn-primary">
                    {isApproving ? 'Aprovando...' : 'Aprovar Entrega'}
                  </Button>
                </div>
              </div>
            )}

            {/* Comments */}
            {fileComments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Comentários</h3>
                {fileComments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-muted/50 rounded-xl">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">{comment.author_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "dd/MM HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-8 mt-8 border-t border-border">
          <p className="text-xs text-muted-foreground">Portal do Cliente • SQUAD Film © {new Date().getFullYear()}</p>
        </footer>
      </main>
    </div>
  );
}
