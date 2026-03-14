import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useKnowledge } from "@/hooks/useKnowledge";
import { ArticleList } from "@/components/knowledge/ArticleList";
import { ArticleView } from "@/components/knowledge/ArticleView";
import { ArticleEditor } from "@/components/knowledge/ArticleEditor";
import { KnowledgeAssistant } from "@/components/knowledge/KnowledgeAssistant";
import { KnowledgeFaq } from "@/components/knowledge/KnowledgeFaq";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Plus, Search, Sparkles, HelpCircle } from "lucide-react";

const CATEGORIES = ['Operação', 'Atendimento', 'Comercial', 'Financeiro', 'Marketing', 'Projetos', 'Onboarding', 'Políticas', 'Geral'];

const ARTICLE_TYPES = [
  { value: 'all', label: 'Todos os Tipos' },
  { value: 'article', label: 'Artigo' },
  { value: 'procedure', label: 'Procedimento' },
  { value: 'policy', label: 'Política' },
  { value: 'faq', label: 'FAQ' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'guide', label: 'Guia Rápido' },
  { value: 'template', label: 'Template' },
];

export default function KnowledgePage() {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tab, setTab] = useState('articles');
  const [showAssistant, setShowAssistant] = useState(false);

  const filters = {
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: searchQuery || undefined,
    articleType: typeFilter !== 'all' ? typeFilter : undefined,
  };

  const {
    articles,
    isLoading,
    faqItems,
    createArticle,
    updateArticle,
    archiveArticle,
    deleteArticle,
    createFaq,
    isCreating: isCreatingArticle,
  } = useKnowledge(filters);

  const selectedArticle = articles.find(a => a.id === selectedArticleId);

  const handleCreateArticle = () => {
    createArticle({
      title: 'Novo Artigo',
      category: categoryFilter !== 'all' ? categoryFilter : 'Geral',
      content: '# Novo Artigo\n\nComece a escrever aqui...',
    }, {
      onSuccess: (data: any) => {
        setSelectedArticleId(data.id);
        setIsEditing(true);
      }
    });
  };

  // Stats
  const publishedCount = articles.filter(a => a.is_published).length;
  const draftCount = articles.filter(a => a.status === 'draft').length;

  return (
    <DashboardLayout title="Base de Conhecimento">
      <div className="flex h-[calc(100vh-10rem)] gap-4">
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">Base de Conhecimento</h2>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{articles.length} artigos</span>
                <span>·</span>
                <span>{publishedCount} publicados</span>
                {draftCount > 0 && <><span>·</span><span className="text-amber-500">{draftCount} rascunhos</span></>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={showAssistant ? "default" : "outline"}
                onClick={() => setShowAssistant(!showAssistant)}
                className="gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Assistente IA
              </Button>
              <Button size="sm" onClick={handleCreateArticle} disabled={isCreatingArticle} className="gap-2">
                <Plus className="w-3.5 h-3.5" />
                Novo Artigo
              </Button>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="mb-3">
              <TabsTrigger value="articles">Artigos</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="articles" className="flex-1 flex gap-4 min-h-0 mt-0">
              {/* Left: list */}
              <div className="w-[340px] flex flex-col rounded-xl border border-border bg-card overflow-hidden shrink-0">
                <div className="p-3 space-y-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar artigo..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 h-8 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Categoria" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Tipo" /></SelectTrigger>
                      <SelectContent>
                        {ARTICLE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ArticleList
                    articles={articles}
                    selectedArticleId={selectedArticleId}
                    onSelectArticle={id => { setSelectedArticleId(id); setIsEditing(false); }}
                    isLoading={isLoading}
                  />
                </div>
              </div>

              {/* Right: view/edit */}
              <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden">
                {selectedArticle ? (
                  isEditing ? (
                    <ArticleEditor
                      article={selectedArticle}
                      onSave={updates => { updateArticle({ id: selectedArticle.id, ...updates }); setIsEditing(false); }}
                      onCancel={() => setIsEditing(false)}
                      categories={CATEGORIES}
                    />
                  ) : (
                    <ArticleView
                      article={selectedArticle}
                      onEdit={() => setIsEditing(true)}
                      onArchive={() => { archiveArticle(selectedArticle.id); setSelectedArticleId(null); }}
                      onDelete={() => { deleteArticle(selectedArticle.id); setSelectedArticleId(null); }}
                    />
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Selecione ou crie um artigo</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="faq" className="flex-1 min-h-0 mt-0">
              <KnowledgeFaq items={faqItems} onCreateFaq={createFaq} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Assistant panel */}
        {showAssistant && (
          <div className="w-[400px] shrink-0">
            <KnowledgeAssistant articles={articles} onClose={() => setShowAssistant(false)} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
