
# Plano: Módulo de Projetos SQUAD Hub - MVP Completo

## Resumo Executivo

Reformulação completa do módulo de Projetos com inteligência operacional, design ultra-premium e integração total com Dashboard, CRM, Financeiro e Portal do Cliente. Inclui otimização responsiva para mobile e tablet.

---

## Fase 1: Otimização Responsiva (Mobile/Tablet)

### Ajustes Globais
- **Sidebar**: Menu colapsável com hamburger no mobile, bottom navigation opcional
- **Cards**: Stack vertical em telas < 768px, padding reduzido
- **Tabelas**: Transformar em cards empilhados no mobile
- **Modais**: Full-screen no mobile, 80% width em tablet
- **Touch**: Aumentar touch targets para 44px mínimo
- **Typography**: Escala responsiva (clamp())

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## Fase 2: Estrutura de Rotas

```text
Rotas Internas (Autenticadas)
├── /projects                    → Lista de projetos + Dashboard analítico
├── /projects/:projectId         → Detalhe do projeto com tabs
└── /projects/:projectId/portal  → Configuração do portal

Rota Pública
└── /client/:shareToken          → Portal do Cliente
```

### Arquivos de Rotas
- Atualizar `src/App.tsx` com as novas rotas
- Criar `src/pages/projects/ProjectsListPage.tsx`
- Criar `src/pages/projects/ProjectDetailPage.tsx`
- Criar `src/pages/ClientPortalPage.tsx`

---

## Fase 3: Modelos de Dados (Mock)

### Entidades Principais

```text
Project
├── id, title, clientId, dealId
├── template (enum de 7 tipos)
├── currentStage (9 etapas)
├── status: ok | em_risco | atrasado | bloqueado
├── healthScore (0-100)
├── contractValue, owner, team[]
├── startDate, estimatedDelivery
├── blockedByPayment (boolean)
├── revisionLimit, revisionsUsed
└── createdAt, updatedAt

Deliverable
├── id, projectId, title, type
├── currentVersion, status
├── visibleInPortal, revisionLimit
└── versions[]

DeliverableVersion
├── id, deliverableId, versionNumber
├── fileUrl, author, notes
└── createdAt, status

Comment
├── id, deliverableId, author
├── content, timecode (opcional)
├── pinX, pinY (para imagens)
├── status: open | resolved
└── createdAt

ProjectStage
├── id, projectId, name, order
├── status, owner, plannedDate
├── actualDate, blockReason
└── dependencies[]

Checklist
├── id, projectId, stageId
├── title, isCritical, status
├── assignee, dueDate
└── evidence, comments

PortalLink
├── id, projectId, shareToken
├── isActive, expiresAt
├── visibleDeliverables[]
└── clientActivity[]

AuditLog
├── id, projectId, timestamp
├── actor, action, entityType
├── entityId, description
└── metadata
```

---

## Fase 4: Templates de Projeto

### 7 Templates com Configuração Padrão

| Template | Etapas | Revisões | SLA |
|----------|--------|----------|-----|
| Filme Institucional | 9 | 2 | 30 dias |
| Filme de Produto | 8 | 2 | 21 dias |
| Aftermovie | 7 | 2 | 14 dias |
| Reels (Pacote) | 6 | 3 | 7 dias |
| Foto (Pacote) | 5 | 2 | 5 dias |
| Tour 360 | 6 | 1 | 10 dias |
| Motion/Vinheta | 7 | 2 | 14 dias |

Cada template define:
- Etapas padrão
- Checklist padrão por etapa
- Entregáveis padrão
- Limite de revisões
- SLA sugerido

---

## Fase 5: Arquitetura de Componentes

```text
src/components/projects/
├── dashboard/
│   ├── ProjectsDashboard.tsx       → View analítica principal
│   ├── ProjectHealthChart.tsx      → Barra de saúde por projeto
│   ├── StageDistribution.tsx       → Distribuição por etapa
│   └── ValueMetrics.tsx            → Métricas de valor
├── list/
│   ├── ProjectsHeader.tsx          → Filtros + Novo Projeto
│   ├── ProjectsTable.tsx           → Lista/tabela
│   ├── ProjectsKanban.tsx          → Board por etapa
│   └── ProjectCard.tsx             → Card individual
├── detail/
│   ├── ProjectHeader.tsx           → Info + status + ações
│   ├── ProjectTabs.tsx             → Navegação de tabs
│   ├── tabs/
│   │   ├── OverviewTab.tsx         → Visão geral
│   │   ├── TasksTab.tsx            → Checklist + tarefas
│   │   ├── DeliverablesTab.tsx     → Entregas + versões
│   │   ├── RevisionsTab.tsx        → Revisões + aprovação
│   │   ├── FilesTab.tsx            → Arquivos
│   │   ├── ScheduleTab.tsx         → Cronograma
│   │   ├── PortalTab.tsx           → Config portal
│   │   └── AuditTab.tsx            → Logs
│   └── ProjectTimeline.tsx         → Timeline horizontal
├── modals/
│   ├── NewProjectModal.tsx         → Criação completa
│   ├── EditProjectModal.tsx        → Edição
│   ├── NewDeliverableModal.tsx     → Novo entregável
│   └── NewVersionModal.tsx         → Nova versão
└── shared/
    ├── StageProgress.tsx           → Progresso visual
    ├── HealthIndicator.tsx         → Indicador de saúde
    └── BlockageAlert.tsx           → Alerta de bloqueios

src/components/client-portal/
├── PortalHeader.tsx
├── PortalProgress.tsx
├── PortalDeliverables.tsx
├── PortalComments.tsx              → Comentários com timecode
├── PortalApproval.tsx
└── PortalChecklist.tsx
```

---

## Fase 6: /projects - Lista + Dashboard Analítico

### Dashboard Analítico (Topo)
- **Métricas de Valor**: Valor total em produção, valor médio por projeto
- **Saúde Média**: Gauge com healthScore médio do pipeline
- **Gráfico de Distribuição**: Projetos por etapa (bar chart)
- **Alertas**: Projetos em risco, atrasados, bloqueados

### Header de Filtros
- Botão "Novo Projeto" (destaque primário)
- Toggle de view: Kanban / Lista
- Filtros:
  - Status (Ok/Risco/Atrasado/Bloqueado)
  - Etapa atual
  - Cliente
  - Responsável
  - Template
  - Prazo (7 dias/30 dias/Atrasado)
  - Bloqueado por pagamento

### Lista/Tabela
Colunas:
- Projeto (nome + health indicator)
- Cliente
- Template (badge)
- Etapa atual (badge colorido)
- Status (ícone + cor)
- Próxima entrega
- Responsável (avatar)
- Última atualização
- Ícone "Bloqueado por pagamento"

### Kanban por Etapa
- Mini-board horizontal
- Cards simplificados com drag indicator
- Contador por coluna

---

## Fase 7: Criação de Projeto (Modal)

### Campos do Formulário
1. **Nome do projeto** (obrigatório)
2. **Cliente** (select com busca)
3. **Deal relacionado** (opcional, select)
4. **Template** (select com preview)
5. **Data de início** (date picker)
6. **Data estimada de entrega** (date picker)
7. **Responsável principal** (select)
8. **Equipe** (multi-select)
9. **Valor do contrato** (currency input)
10. **Toggle "Bloquear entrega se inadimplente"** (default: on)

### Ao Criar
- Gerar etapas do template
- Gerar checklist padrão
- Gerar entregáveis base
- Criar log de criação
- Sugerir cronograma automático

---

## Fase 8: Detalhe do Projeto - 8 Tabs

### Tab 1: Visão Geral
- **Card Principal**: Nome, cliente, template, etapa, status, owner, datas
- **Card Financeiro**: Valor do contrato, status de pagamento
- **Card Saúde Operacional**: healthScore, SLA, Review Speed
- **Card Bloqueios**: Lista visual de pendências
- **Card Próximos Passos**: Ações automáticas baseadas em estado
- **Timeline Horizontal Compacta**: Últimos eventos interativa
- **Botões Rápidos**: Criar entrega, Solicitar revisão, Publicar entrega, Abrir Portal

### Tab 2: Tarefas & Checklist
- Checklist agrupado por etapa
- Status: pendente | em andamento | concluído | bloqueado
- Itens críticos marcados
- Tarefas avulsas com responsável e prazo
- Regra: etapa não conclui se checklist crítico pendente

### Tab 3: Entregas & Versões (Core)
- Lista de entregáveis com cards
- Status: rascunho | revisão | aprovado | entregue | arquivado
- Toggle "Visível no portal"
- Limite de revisões com contador
- Histórico de versões por entregável
- Ações: Nova versão, Enviar ao cliente, Aprovar, Entregar, Arquivar

### Tab 4: Revisões & Aprovação
- Lista de comentários do cliente
- Contador de rodadas
- Comentários abertos vs resolvidos
- Filtro por entregável
- Botão "Gerar resumo de ajustes" (IA mock)
- Alerta se exceder limite de revisões

### Tab 5: Arquivos
- Organização por pastas: Brutos, Projeto, Referências, Entregas, Contratos, Outros
- Upload mock
- Tags automáticas
- Permissões (cliente só vê o visível no portal)

### Tab 6: Cronograma
- Timeline ou calendário visual
- Marcos: captação, corte, revisão, entrega
- Dependências simples
- Ajuste de datas com recálculo
- Registro de justificativas

### Tab 7: Portal do Cliente
- Gerar/regenerar link
- Copiar link
- Ativar/desativar
- Definir expiração
- Selecionar entregas visíveis
- Log de atividade do cliente

### Tab 8: Auditoria
- Event log completo filtrado
- Tipos: criação, mudança de etapa, upload, versão, revisão, aprovação, entrega, bloqueio/desbloqueio, etc.

---

## Fase 9: Portal do Cliente (/client/:shareToken)

### Design
- Minimalista, limpo, sem dados financeiros
- Header com nome do projeto e status
- Sem acesso a outros projetos

### Seções
1. **Progresso**: Timeline das 9 etapas
2. **Bloqueios**: Card se houver pendências (sem valores)
3. **Entregas**: Tabs (Para revisar / Aprovados / Arquivos)
4. **Revisão com Comentários**:
   - Vídeo: comentário por timecode, clicar pula o vídeo
   - Imagem: comentários com pin (x,y)
   - PDF: comentários gerais
5. **Aprovação**: Botões Aprovar / Solicitar ajustes
6. **Checklist do Cliente**: Items que o cliente precisa enviar

### Segurança
- shareToken único e longo
- Verificar isActive e expiresAt
- Nunca mostrar valores
- Mensagem genérica se inadimplente

---

## Fase 10: Regras de Negócio

### Bloqueio por Inadimplência
Se `blockedByPayment = true`:
- Permitir trabalho interno
- Bloquear "Enviar para cliente" e "Marcar entregue"
- Portal mostra: "Entrega bloqueada por pendência financeira"
- Admin pode fazer override

### Health Score (Mock)
- Baseado em: atrasos, uso de revisões, bloqueios
- < 50: vermelho (Em risco)
- 50-80: amarelo (Atenção)
- > 80: verde (Ok)

### Limite de Revisões
- Contador visível
- Alerta ao atingir limite
- Revisão extra gera item de upsell (mock)

---

## Fase 11: Integrações Internas

### Dashboard
- Widget "Projetos em risco"
- Widget "Próximas entregas 7 dias"
- Widget "Bloqueados por pagamento"

### Financeiro
- Projeto vinculado a invoice
- Invoice vencida D+7 → blockedByPayment = true

### CRM
- Criar projeto a partir de Deal "Fechado"
- Copiar escopo e prazos do deal

---

## Fase 12: Arquivos a Criar/Modificar

### Novos Arquivos (~35 arquivos)

```text
src/
├── pages/
│   ├── projects/
│   │   ├── ProjectsListPage.tsx
│   │   └── ProjectDetailPage.tsx
│   └── ClientPortalPage.tsx
├── components/
│   └── projects/
│       ├── dashboard/
│       │   ├── ProjectsDashboard.tsx
│       │   ├── ProjectHealthChart.tsx
│       │   ├── StageDistribution.tsx
│       │   └── ValueMetrics.tsx
│       ├── list/
│       │   ├── ProjectsHeader.tsx
│       │   ├── ProjectsTable.tsx
│       │   ├── ProjectsKanban.tsx
│       │   └── ProjectListCard.tsx
│       ├── detail/
│       │   ├── ProjectHeader.tsx
│       │   ├── ProjectTabs.tsx
│       │   ├── tabs/
│       │   │   ├── OverviewTab.tsx
│       │   │   ├── TasksTab.tsx
│       │   │   ├── DeliverablesTab.tsx
│       │   │   ├── RevisionsTab.tsx
│       │   │   ├── FilesTab.tsx
│       │   │   ├── ScheduleTab.tsx
│       │   │   ├── PortalTab.tsx
│       │   │   └── AuditTab.tsx
│       │   └── ProjectTimeline.tsx
│       ├── modals/
│       │   ├── NewProjectModal.tsx
│       │   ├── EditProjectModal.tsx
│       │   ├── NewDeliverableModal.tsx
│       │   └── NewVersionModal.tsx
│       └── shared/
│           ├── StageProgress.tsx
│           ├── HealthIndicator.tsx
│           └── BlockageAlert.tsx
│   └── client-portal/
│       ├── PortalHeader.tsx
│       ├── PortalProgress.tsx
│       ├── PortalDeliverables.tsx
│       ├── PortalComments.tsx
│       ├── PortalApproval.tsx
│       └── PortalChecklist.tsx
├── data/
│   ├── projectTemplates.ts
│   └── projectsMockData.ts
├── stores/
│   └── projectsStore.ts
└── types/
    └── projects.ts
```

### Arquivos a Modificar
- `src/App.tsx` (novas rotas)
- `src/pages/Dashboard.tsx` (widgets de projetos)
- `src/data/mockData.ts` (expandir dados)
- `src/components/layout/Sidebar.tsx` (atualizar link)

---

## Seção Técnica

### Estado Global (Context/Zustand)
```typescript
interface ProjectsStore {
  projects: Project[];
  selectedProject: Project | null;
  filters: ProjectFilters;
  setFilters: (filters: ProjectFilters) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  addDeliverable: (projectId: string, deliverable: Deliverable) => void;
  addComment: (deliverableId: string, comment: Comment) => void;
  approveVersion: (versionId: string) => void;
}
```

### Tipos TypeScript
- Enums para stages, status, templates
- Interfaces para todas as entidades
- Type guards para validação

### Responsividade
- CSS Grid com breakpoints
- Flex wrap para filtros
- Cards em stack no mobile
- Modais full-screen no mobile
- Touch-friendly interactions

### Design System
- Manter estética "dark quiet luxury"
- glass-card para containers
- Badges coloridos para status
- Timeline horizontal compacta
- Microinterações sutis
- Health indicator com gradiente

---

## Ordem de Implementação

1. **Tipos e Mock Data** - Base estrutural
2. **Store de Projetos** - Estado global
3. **Lista de Projetos** - View principal
4. **Dashboard Analítico** - Métricas visuais
5. **Modal de Criação/Edição** - CRUD básico
6. **Detalhe - Visão Geral** - Tab principal
7. **Detalhe - Entregas** - Core do módulo
8. **Detalhe - Demais Tabs** - Completar funcionalidades
9. **Portal do Cliente** - Rota pública
10. **Integrações** - Dashboard, CRM, Financeiro
11. **Responsividade** - Polimento mobile/tablet
12. **Auditoria** - Logs completos

---

## Resultado Esperado

Um módulo de Projetos completo e funcional com:
- Dashboard analítico com métricas de valor e saúde
- Lista/Kanban com filtros avançados
- Criação e edição de projetos com templates
- 8 tabs de detalhe com todas as funcionalidades
- Portal do cliente com comentários por timecode
- Aprovação formal com auditoria
- Bloqueio por inadimplência
- Design premium responsivo para todos os dispositivos
- Integração com outros módulos do SQUAD Hub
