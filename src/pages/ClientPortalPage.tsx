import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useClientPortal } from "@/hooks/useClientPortal";
import { 
  AlertTriangle, 
  Lock, 
  Loader2, 
  Play, 
  FileText, 
  Image, 
  Download,
  DollarSign,
  Activity,
  Zap,
  Calendar,
  User,
  CheckCircle2,
  MessageSquare,
  Youtube
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import squadHubLogo from "@/assets/squad-hub-logo.png";

// Stage name mapping
const STAGE_NAMES: Record<string, string> = {
  briefing: 'Briefing',
  roteiro: 'Roteiro',
  pre_producao: 'Pré-Produção',
  captacao: 'Captação',
  edicao: 'Edição',
  revisao: 'Revisão',
  aprovacao: 'Aprovação',
  entrega: 'Entrega',
  pos_venda: 'Pós-Venda',
};

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

// Extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/v\/([^&\s?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Format currency
function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value);
}

export default function ClientPortalPage() {
  const { shareToken } = useParams();
  const { data, isLoading, error, addComment, approveFile, isApproving, requestRevision, isRequestingRevision } = useClientPortal(shareToken);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', content: '' });
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Dynamic document title for portal
  useEffect(() => {
    if (data?.portal) {
      const projectName = data.portal.project_name || 'Projeto';
      const clientName = data.portal.client_name || '';
      document.title = clientName
        ? `${projectName} — ${clientName} | SQUAD HUB`
        : `${projectName} | SQUAD HUB`;
    }
    return () => { document.title = 'Hub v2.4 | Gestão Criativa & Audiovisual'; };
  }, [data?.portal]);

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
            isInactive ? "bg-muted" : isExpired ? "bg-muted" : "bg-destructive/20"
          )}>
            {isInactive ? <Lock className="w-8 h-8 text-muted-foreground" /> : <AlertTriangle className={cn("w-8 h-8", isExpired ? "text-muted-foreground" : "text-destructive")} />}
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

  const { portal, project, files, comments, approvals } = data;
  const selectedFile = files.find(f => f.id === selectedFileId);
  const fileComments = comments.filter(c => c.project_file_id === selectedFileId);
  const fileApproval = approvals.find(a => a.project_file_id === selectedFileId);
  const hasPaymentBlock = portal.blocked_by_payment || project?.has_payment_block;

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

  const handleRequestRevision = () => {
    if (!selectedFileId || !commentForm.name || !commentForm.content) return;
    requestRevision({
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

  const stageName = project?.stage_current ? (STAGE_NAMES[project.stage_current] || project.stage_current) : '--';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={squadHubLogo} alt="SQUAD Hub" className="h-8 w-auto object-contain" />
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="hidden sm:block">
                <h1 className="font-semibold text-foreground">{project?.name || portal.project_name || 'Projeto'}</h1>
                <p className="text-xs text-muted-foreground">{project?.client_name || portal.client_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {project?.status && (
                <Badge variant="outline" className="text-xs">
                  {project.status === 'active' ? 'Ativo' : project.status}
                </Badge>
              )}
              {project?.template && (
                <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                  {project.template.replace(/_/g, ' ')}
                </Badge>
              )}
              {stageName !== '--' && (
                <Badge className="text-xs bg-primary/20 text-primary border-0">
                  {stageName}
                </Badge>
              )}
              {hasPaymentBlock && (
                <Badge variant="destructive" className="text-xs">
                  Bloqueado
                </Badge>
              )}
            </div>
          </div>
          {/* Mobile Project Name */}
          <div className="sm:hidden mt-3">
            <h1 className="font-semibold text-foreground">{project?.name || portal.project_name || 'Projeto'}</h1>
            <p className="text-xs text-muted-foreground">{project?.client_name || portal.client_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Project Info Cards */}
        {project && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[9px] font-medium text-primary uppercase">Valor</span>
              </div>
              <p className="text-lg font-medium text-foreground truncate">
                {project.contract_value ? formatCurrency(project.contract_value) : '--'}
              </p>
              <p className="text-[10px] text-muted-foreground">Valor do Contrato</p>
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[9px] font-medium text-primary uppercase">Saúde</span>
              </div>
              <p className={cn(
                "text-lg font-medium truncate",
                (project.health_score || 0) >= 90 ? 'text-primary' :
                (project.health_score || 0) >= 70 ? 'text-muted-foreground' : 'text-destructive'
              )}>
                {project.health_score ?? 100}%
              </p>
              <p className="text-[10px] text-muted-foreground">Health Score</p>
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[9px] font-bold text-primary uppercase">Entrega</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {project.due_date ? format(new Date(project.due_date), "dd/MM/yyyy") : '--'}
              </p>
              <p className="text-[10px] text-muted-foreground">Data de Entrega</p>
            </div>

            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Responsável</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">
                {project.owner_name || '--'}
              </p>
              <p className="text-[10px] text-muted-foreground">Gerente do Projeto</p>
            </div>
          </div>
        )}

        {/* Payment Block Alert */}
        {hasPaymentBlock && (
          <div className="glass-card rounded-2xl p-6 border-destructive/30 bg-destructive/5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Projeto Bloqueado por Inadimplência</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Existe uma fatura em atraso vinculada a este projeto. A entrega final está bloqueada até regularização.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* YouTube Video Section */}
        {youtubeUrl && getYouTubeVideoId(youtubeUrl) && (
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Youtube className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-foreground">Vídeo de Apresentação</h3>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(youtubeUrl)}`}
                title="YouTube video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
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
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Arquivos do Projeto</h3>
              <Badge variant="secondary" className="ml-auto">{files.length}</Badge>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => {
                const isApproved = approvals.some(a => a.project_file_id === file.id);
                const isSelected = file.id === selectedFileId;
                const fileType = getFileType(file);
                const commentCount = comments.filter(c => c.project_file_id === file.id).length;

                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={cn(
                      "glass-card rounded-xl p-3 text-left transition-all hover:border-primary/30",
                      isSelected && "border-primary ring-1 ring-primary"
                    )}
                  >
                    <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden flex items-center justify-center relative">
                      {fileType === 'image' ? (
                        <img src={file.file_url} alt={file.name} className="w-full h-full object-cover" />
                      ) : fileType === 'video' ? (
                        <>
                          <video src={file.file_url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-10 h-10 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="text-muted-foreground">
                          {getFileIcon(fileType)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-sm text-foreground truncate flex-1">{file.name}</h4>
                      <Badge variant={isApproved ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {isApproved ? 'Aprovado' : 'Pendente'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {file.folder && (
                        <span className="text-[10px] text-muted-foreground">{file.folder}</span>
                      )}
                      {commentCount > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> {commentCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected File Detail */}
        {selectedFile && (
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedFile.name}</h2>
              <div className="flex items-center gap-2">
                <a
                  href={selectedFile.file_url}
                  download
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
            
            {/* File Preview */}
            {selectedFile.file_url && (
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                {getFileType(selectedFile) === 'video' ? (
                  <video src={selectedFile.file_url} controls className="w-full h-full" />
                ) : getFileType(selectedFile) === 'image' ? (
                  <img src={selectedFile.file_url} alt={selectedFile.name} className="w-full h-full object-contain" />
                ) : getFileType(selectedFile) === 'pdf' ? (
                  <iframe src={selectedFile.file_url} className="w-full h-full bg-white" />
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
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <p className="text-primary font-semibold">Aprovado por {fileApproval.approved_by_name}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(fileApproval.approved_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Feedback e Aprovação</h3>
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
                  placeholder="Comentário, solicitação de ajuste ou revisão..."
                  value={commentForm.content}
                  onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                  rows={4}
                />
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleAddComment} 
                    variant="outline" 
                    disabled={!commentForm.name || !commentForm.content}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enviar Comentário
                  </Button>
                  <Button 
                    onClick={handleRequestRevision} 
                    variant="outline"
                    className="border-muted-foreground text-muted-foreground hover:bg-muted"
                    disabled={!commentForm.name || !commentForm.content || isRequestingRevision}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {isRequestingRevision ? 'Solicitando...' : 'Solicitar Alteração'}
                  </Button>
                  <Button 
                    onClick={handleApprove} 
                    disabled={!commentForm.name || isApproving || hasPaymentBlock} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {isApproving ? 'Aprovando...' : 'Aprovar Entrega'}
                  </Button>
                </div>
                {hasPaymentBlock && (
                  <p className="text-xs text-amber-500">
                    * A aprovação está bloqueada devido a pendência financeira.
                  </p>
                )}
              </div>
            )}

            {/* Comments */}
            {fileComments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Comentários ({fileComments.length})
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {fileComments.map((comment) => (
                    <div key={comment.id} className={cn(
                      "p-3 rounded-xl",
                      comment.status === 'revision_requested' 
                        ? "bg-amber-500/10 border border-amber-500/20" 
                        : "bg-muted/50"
                    )}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-sm">{comment.author_name}</span>
                        <div className="flex items-center gap-2">
                          {comment.status === 'revision_requested' && (
                            <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500">
                              Revisão
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), "dd/MM HH:mm")}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  ))}
                </div>
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
