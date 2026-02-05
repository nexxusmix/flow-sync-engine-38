import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useKnowledge } from "@/hooks/useKnowledge";
import { ArticleList } from "@/components/knowledge/ArticleList";
import { ArticleView } from "@/components/knowledge/ArticleView";
import { ArticleEditor } from "@/components/knowledge/ArticleEditor";
import { BookOpen, Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORIES = [
  'Vendas',
  'Onboarding',
  'Produção',
  'Edição',
  'Cobrança',
  'Marketing',
  'Operações',
  'Geral'
];

export default function KnowledgePage() {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filters = {
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: searchQuery || undefined,
    isPublished: true,
  };

  const { 
    articles, 
    isLoading, 
    categories,
    createArticle, 
    updateArticle, 
    archiveArticle,
    deleteArticle,
    isCreating: isCreatingArticle 
  } = useKnowledge(filters);

  const selectedArticle = articles?.find(a => a.id === selectedArticleId);

  const handleCreateArticle = () => {
    createArticle({ 
      title: 'Novo Artigo',
      category: categoryFilter !== 'all' ? categoryFilter : 'Geral',
      content_md: '# Novo Artigo\n\nComece a escrever aqui...',
    }, {
      onSuccess: (data) => {
        setSelectedArticleId(data.id);
        setIsCreating(false);
        setIsEditing(true);
      }
    });
  };

  // Empty State
  if (!isLoading && (!articles || articles.length === 0) && !searchQuery && categoryFilter === 'all') {
    return (
      <DashboardLayout title="Knowledge Base">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="glass-card p-12 rounded-3xl max-w-lg">
            <div className="icon-box w-20 h-20 mb-6 mx-auto">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Knowledge Base</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Centralize playbooks, FAQs, SOPs e templates para sua equipe.
              Crie seu primeiro artigo para começar.
            </p>
            <Button onClick={handleCreateArticle} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Playbook
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Knowledge Base">
      <div className="flex h-[calc(100vh-10rem)] gap-4">
        {/* Left Panel - Article List */}
        <div className="w-[380px] flex flex-col glass-card rounded-2xl overflow-hidden">
          {/* Header & Filters */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Artigos</h3>
              <Button 
                size="sm" 
                onClick={handleCreateArticle}
                disabled={isCreatingArticle}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo
              </Button>
            </div>
            <Input
              placeholder="Buscar artigo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50"
            />
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Article List */}
          <div className="flex-1 overflow-y-auto">
            <ArticleList
              articles={articles || []}
              selectedArticleId={selectedArticleId}
              onSelectArticle={(id) => {
                setSelectedArticleId(id);
                setIsEditing(false);
              }}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Panel - Article View/Editor */}
        <div className="flex-1 glass-card rounded-2xl overflow-hidden">
          {selectedArticle ? (
            isEditing ? (
              <ArticleEditor
                article={selectedArticle}
                onSave={(updates) => {
                  updateArticle({ id: selectedArticle.id, ...updates });
                  setIsEditing(false);
                }}
                onCancel={() => setIsEditing(false)}
                categories={CATEGORIES}
              />
            ) : (
              <ArticleView
                article={selectedArticle}
                onEdit={() => setIsEditing(true)}
                onArchive={() => {
                  archiveArticle(selectedArticle.id);
                  setSelectedArticleId(null);
                }}
                onDelete={() => {
                  deleteArticle(selectedArticle.id);
                  setSelectedArticleId(null);
                }}
              />
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="icon-box w-16 h-16 mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Selecione um Artigo</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Escolha um artigo na lista à esquerda para visualizar ou criar um novo.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
