import { KnowledgeArticle } from "@/hooks/useKnowledge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Archive, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ArticleViewProps {
  article: KnowledgeArticle;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

// Simple markdown to HTML converter
function renderMarkdown(md: string): string {
  return md
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre class="bg-muted p-4 rounded-lg my-4 overflow-x-auto"><code>$1</code></pre>')
    // Inline code
    .replace(/`(.*?)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
    // Unordered lists
    .replace(/^\s*[-*] (.*$)/gim, '<li class="ml-4">$1</li>')
    // Ordered lists
    .replace(/^\s*\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-primary hover:underline" target="_blank">$1</a>')
    // Line breaks
    .replace(/\n\n/gim, '</p><p class="mb-4">')
    .replace(/\n/gim, '<br />');
}

export function ArticleView({ article, onEdit, onArchive, onDelete }: ArticleViewProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">{article.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              {article.category && (
                <Badge variant="secondary">{article.category}</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Atualizado em {format(new Date(article.updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Tag className="w-3 h-3 text-muted-foreground" />
                {article.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={onArchive}>
              <Archive className="w-4 h-4 mr-1" />
              Arquivar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Artigo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir "{article.title}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <article 
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${renderMarkdown(article.content)}</p>` }}
        />
      </div>
    </div>
  );
}
