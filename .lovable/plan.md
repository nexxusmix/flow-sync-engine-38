

# Modo Foco: Scroll, PDF Export e Aba de Planos Salvos

## 1. Corrigir scroll do modal do Modo Foco

O modal atual usa `max-h-[85vh] overflow-y-auto` no container inteiro, mas o header fica junto no scroll. Vamos reestruturar para que o header e barra de progresso fiquem fixos no topo, e apenas o conteudo dos blocos role.

**Arquivo:** `src/components/tasks/TaskExecutionGuide.tsx`
- Separar o modal em: header fixo (titulo + progresso) + area scrollavel (blocos)
- Usar `flex flex-col` com `overflow-y-auto` apenas na area dos blocos
- Garantir `max-h-[85vh]` no container externo

---

## 2. Exportar plano em PDF (A4 Horizontal ou Vertical)

Adicionar botoes no modal do Modo Foco para exportar o plano gerado em PDF, seguindo a identidade visual da plataforma (fundo escuro, tipografia premium, cores por tipo de bloco).

**Arquivo:** `src/components/tasks/TaskExecutionGuide.tsx`
- Adicionar dois botoes: "PDF Horizontal" e "PDF Vertical"
- Ambos chamam uma nova Edge Function `export-focus-pdf`

**Arquivo:** `supabase/functions/export-focus-pdf/index.ts` (novo)
- Recebe: `{ blocks, total_estimated_minutes, tips, orientation: "landscape" | "portrait" }`
- Gera PDF com pdf-lib seguindo o design system da plataforma (cores escuras, accent por tipo de bloco)
- Layout:
  - Capa com titulo "PLANO DE EXECUCAO" e data
  - Cada bloco como card visual com icone de tipo, tecnica, duracao e lista de tarefas
  - Pausas em destaque verde
  - Rodape com branding HUB
- Salva no storage e retorna signed_url
- Frontend faz download via blob (Safari-compatible)

**Arquivo:** `src/services/pdfExportService.ts`
- Adicionar `exportFocusPDF(plan, orientation, options)` ao servico

---

## 3. Salvar plano na aba "Foco" (nova aba na pagina de tarefas)

Permitir salvar o plano gerado para consulta posterior, em uma nova aba dedicada.

**Database:** Nova tabela `saved_focus_plans`
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `title` (text) - ex: "Plano de Foco - 16/02/2026"
- `plan_data` (jsonb) - o JSON completo do plano (blocks, tips, total_estimated_minutes)
- `completed_tasks` (jsonb, default '[]') - IDs das tarefas concluidas neste plano
- `status` (text, default 'active') - 'active' | 'completed' | 'archived'
- `created_at`, `updated_at` (timestamps)
- RLS: usuario so ve/edita os proprios planos

**Arquivo:** `src/components/tasks/TaskExecutionGuide.tsx`
- Botao "Salvar Plano" no modal apos gerar
- Insere na tabela `saved_focus_plans`
- Toast de confirmacao

**Arquivo:** `src/components/tasks/SavedFocusPlans.tsx` (novo)
- Lista de planos salvos com cards visuais
- Cada card mostra: titulo, data, total de blocos, progresso de tarefas concluidas
- Clicar abre o plano completo (reutilizando a visualizacao de blocos)
- Opcoes: retomar, arquivar, exportar PDF, excluir

**Arquivo:** `src/pages/TasksPage.tsx`
- Adicionar nova aba "Foco" ao TabsList (ao lado de Quadro, Kanban, Timeline, Dashboard)
- Quando selecionada, renderiza `<SavedFocusPlans />`

---

## Detalhes Tecnicos

### Estrutura do modal refatorado (scroll fix)

```text
+----------------------------------+
| [Brain] Modo Foco          [X]  |  <- header fixo
| [===== progress bar =====]      |
| [PDF H] [PDF V] [Salvar]        |  <- acoes fixas
+----------------------------------+
|                                  |
|  [Bloco 1 - Deep Work]          |
|  [Pausa Curta]                   |  <- area scrollavel
|  [Bloco 2 - Shallow Work]       |
|  ...                             |
+----------------------------------+
```

### Arquivos modificados/criados:
1. `src/components/tasks/TaskExecutionGuide.tsx` - scroll fix + botoes PDF/salvar
2. `supabase/functions/export-focus-pdf/index.ts` - nova edge function
3. `src/components/tasks/SavedFocusPlans.tsx` - novo componente da aba
4. `src/pages/TasksPage.tsx` - nova aba "Foco"
5. `src/services/pdfExportService.ts` - nova funcao export
6. Migracao SQL para tabela `saved_focus_plans`
