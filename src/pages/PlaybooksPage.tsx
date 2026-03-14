import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaybookLibrary } from '@/components/playbooks/PlaybookLibrary';
import { PlaybookEditor } from '@/components/playbooks/PlaybookEditor';
import { PlaybookApplications } from '@/components/playbooks/PlaybookApplications';

export default function PlaybooksPage() {
  const [tab, setTab] = useState('library');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setTab('editor');
  };

  const handleNew = () => {
    setEditingId(null);
    setTab('editor');
  };

  const handleSaved = () => {
    setEditingId(null);
    setTab('library');
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="material-symbols-rounded text-primary">menu_book</span>
            Playbooks & Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Padronize processos, escale operação e replique boas práticas.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30 border border-border/40">
            <TabsTrigger value="library" className="gap-1.5 text-xs">
              <span className="material-symbols-rounded text-[16px]">library_books</span>
              Biblioteca
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-1.5 text-xs">
              <span className="material-symbols-rounded text-[16px]">edit_note</span>
              {editingId ? 'Editar' : 'Criar'}
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-1.5 text-xs">
              <span className="material-symbols-rounded text-[16px]">play_circle</span>
              Aplicações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-4">
            <PlaybookLibrary onEdit={handleEdit} onNew={handleNew} />
          </TabsContent>
          <TabsContent value="editor" className="mt-4">
            <PlaybookEditor playbookId={editingId} onSaved={handleSaved} onCancel={() => setTab('library')} />
          </TabsContent>
          <TabsContent value="applications" className="mt-4">
            <PlaybookApplications />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
