
# Plano: Sincronização em Tempo Real de Projetos

## Objetivo
Quando um projeto for criado, atualizado ou excluído, todas as áreas do sistema (Dashboard, Calendário, Kanban, Relatórios, etc.) serão atualizadas automaticamente em tempo real sem necessidade de recarregar a página.

---

## Visão Geral da Solução

A arquitetura atual já tem o Supabase Realtime habilitado para as tabelas `projects` e `project_stages`. Precisamos implementar a camada de React que escuta essas mudanças e invalida os caches automaticamente.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         Banco de Dados                              │
│  [projects] ←──┬──→ [project_stages] ←──→ [calendar_events]         │
│                │                                                    │
│                └──→ [project_files] ←──→ [portal_links]             │
└────────────────────────────────────────┬────────────────────────────┘
                                         │ REALTIME
                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    useRealtimeSync Hook                             │
│  - Escuta INSERT/UPDATE/DELETE em projects                          │
│  - Escuta mudanças em project_stages                                │
│  - Escuta mudanças em calendar_events                               │
└────────────────────────────────────────┬────────────────────────────┘
                                         │ INVALIDATE
                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     React Query Cache                               │
│  ['projects'] → Lista de projetos                                   │
│  ['project', id] → Projeto individual                               │
│  ['dashboard-metrics'] → Métricas do dashboard                      │
│  ['calendar-events'] → Eventos do calendário                        │
│  ['project-files', id] → Arquivos do projeto                        │
└────────────────────────────────────────┬────────────────────────────┘
                                         │ AUTO-REFETCH
                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Componentes UI                               │
│  Dashboard / Projetos / Calendário / Kanban / Relatórios            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementação

### 1. Criar Hook `useRealtimeSync`

Novo hook centralizado que gerencia todas as subscrições realtime:

**Arquivo**: `src/hooks/useRealtimeSync.tsx`

```typescript
// Escuta mudanças em tempo real nas tabelas:
// - projects (INSERT, UPDATE, DELETE)
// - project_stages (INSERT, UPDATE, DELETE)  
// - calendar_events (INSERT, UPDATE, DELETE)

// Quando detecta mudança:
// 1. Identifica qual query key precisa ser invalidada
// 2. Chama queryClient.invalidateQueries()
// 3. React Query automaticamente refetcha os dados
// 4. UI atualiza sem interação do usuário
```

Funcionalidades:
- Subscrição automática ao montar
- Cleanup ao desmontar
- Debounce para evitar múltiplas invalidações
- Log opcional para debug

### 2. Habilitar Realtime em Tabelas Adicionais

**Migration SQL**:
```sql
-- Habilitar realtime para tabelas relacionadas
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.revenues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prospect_opportunities;
```

### 3. Integrar no App Principal

Montar o hook de realtime no nível do App para que todas as páginas se beneficiem:

**Arquivo**: `src/App.tsx`

```typescript
function App() {
  // Inicializa sincronização realtime global
  useRealtimeSync();
  
  return <Routes>...</Routes>;
}
```

### 4. Mapear Eventos para Query Keys

| Tabela | Evento | Query Keys Invalidadas |
|--------|--------|----------------------|
| projects | * | `['projects']`, `['dashboard-metrics']`, `['project', *]` |
| project_stages | * | `['projects']`, `['project', projectId]` |
| calendar_events | * | `['calendar-events']`, `['dashboard-metrics']` |
| project_files | * | `['project-files', projectId]` |
| portal_links | * | `['portal-link', projectId]` |
| revenues | * | `['dashboard-metrics']` |
| prospect_opportunities | * | `['dashboard-metrics']` |

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `migration.sql` | Habilitar realtime em tabelas adicionais |
| `src/hooks/useRealtimeSync.tsx` | Novo hook de sincronização |
| `src/App.tsx` | Integrar hook no App principal |

---

## Benefícios

1. **Colaboração em Tempo Real**: Múltiplos usuários veem as mesmas atualizações instantaneamente
2. **Dashboard Sempre Atualizado**: Métricas refletem dados atuais sem refresh manual
3. **Calendário Sincronizado**: Novos eventos aparecem automaticamente
4. **Kanban Dinâmico**: Projetos movidos de etapa atualizam em todas as telas
5. **Zero Interação**: Usuário não precisa recarregar a página

---

## Fluxo de Exemplo

```text
1. Usuário A cria projeto "Novo Vídeo" na tela de Projetos
2. INSERT disparado no banco → Supabase Realtime propaga evento
3. useRealtimeSync recebe evento de INSERT em 'projects'
4. Hook invalida: ['projects'], ['dashboard-metrics']
5. Usuário B (no Dashboard) vê automaticamente:
   - Contador "Projetos Ativos" incrementa
   - Novo card aparece no Visual Board
   - Timeline atualiza se projeto tem data de entrega
```
