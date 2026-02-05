import { KnowledgeArticle } from "@/hooks/useKnowledge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ArticleListProps {
  articles: KnowledgeArticle[];
  selectedArticleId: string | null;
  onSelectArticle: (id: string) => void;
  isLoading: boolean;
}

export function ArticleList({ articles, selectedArticleId, onSelectArticle, isLoading }: ArticleListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="p-3 rounded-xl bg-muted/30 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Nenhum artigo encontrado</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {articles.map((article) => {
        const isSelected = article.id === selectedArticleId;

        return (
          <button
            key={article.id}
            onClick={() => onSelectArticle(article.id)}
            className={cn(
              "w-full p-4 text-left transition-colors hover:bg-muted/50",
              isSelected && "bg-primary/5 border-l-2 border-primary"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground truncate mb-1">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {article.category && (
                    <Badge variant="secondary" className="text-[10px]">
                      {article.category}
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(article.updated_at), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">+{article.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
