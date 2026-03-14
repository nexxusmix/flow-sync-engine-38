import { useState, useEffect } from "react";
import { KnowledgeArticle } from "@/hooks/useKnowledge";
import { Save, X, Eye, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ArticleEditorProps {
  article: KnowledgeArticle;
  onSave: (updates: Partial<KnowledgeArticle>) => void;
  onCancel: () => void;
  categories: string[];
}

// Simple markdown to HTML converter
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/```([\s\S]*?)```/gim, '<pre class="bg-muted p-4 rounded-lg my-4 overflow-x-auto"><code>$1</code></pre>')
    .replace(/`(.*?)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/^\s*[-*] (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^\s*\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-primary hover:underline" target="_blank">$1</a>')
    .replace(/\n\n/gim, '</p><p class="mb-4">')
    .replace(/\n/gim, '<br />');
}

export function ArticleEditor({ article, onSave, onCancel, categories }: ArticleEditorProps) {
  const [title, setTitle] = useState(article.title);
  const [category, setCategory] = useState(article.category || '');
  const [content, setContent] = useState(article.content);
  const [tags, setTags] = useState(article.tags?.join(', ') || '');
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = 
      title !== article.title ||
      category !== (article.category || '') ||
      content !== article.content ||
      tags !== (article.tags?.join(', ') || '');
    setHasChanges(changed);
  }, [title, category, content, tags, article]);

  const handleSave = () => {
    onSave({
      title,
      category: category || null,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do artigo"
              className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <Edit2 className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showPreview ? 'Editar' : 'Preview'}
            </Button>
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={!hasChanges}
              className="btn-primary"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar
            </Button>
          </div>
        </div>
        
        {/* Metadata */}
        <div className="flex items-center gap-4 mt-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px] bg-muted/50">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (separadas por vírgula)"
            className="flex-1 bg-muted/50"
          />
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <div className="h-full overflow-y-auto p-6">
            <article 
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${renderMarkdown(content)}</p>` }}
            />
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva seu artigo em Markdown..."
            className="h-full w-full resize-none border-none rounded-none p-6 bg-transparent font-mono text-sm focus-visible:ring-0"
          />
        )}
      </div>

      {/* Footer Helper */}
      {!showPreview && (
        <div className="p-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
          <span className="font-semibold">Dica:</span> Use <code className="bg-muted px-1 rounded"># Título</code> para headers, 
          <code className="bg-muted px-1 rounded ml-1">**negrito**</code> para negrito, 
          <code className="bg-muted px-1 rounded ml-1">*itálico*</code> para itálico.
        </div>
      )}
    </div>
  );
}
