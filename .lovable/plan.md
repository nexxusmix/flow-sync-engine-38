
# Plano: Correção de IA de Tarefas + Dashboard de Tarefas + Graficos em Projetos + Modulo de Relatorios 360

## Resumo Executivo

Este plano aborda 4 areas principais:
1. **Correcao do erro de geracao de tarefas com IA** - O endpoint da AI Relay esta inacessivel
2. **Dashboard e graficos para Tarefas** - Adicionar metricas visuais e timeline
3. **Graficos em Projetos** - Adicionar visualizacoes no dashboard de projetos
4. **Relatorio 360** - Novo relatorio consolidado com metricas de projetos por periodo

---

## Problema 1: Erro na Geracao de Tarefas com IA

### Diagnostico
O erro "Failed to send a request to the Edge Function" ocorre porque a Edge Function `generate-tasks-from-text` esta tentando acessar o endpoint `https://ai-relay.lovable.dev/gemini/v1/chat/completions` que retorna erro de DNS.

**Erro detectado:**
```
client error (Connect): dns error: failed to lookup address information
```

### Solucao
Atualizar a Edge Function para usar o endpoint correto da Lovable AI (`https://ai.lovable.dev/v1/chat/completions`) que e o padrao para projetos Lovable Cloud.

---

## Implementacao

### Fase 1: Correcao da Edge Function de Tarefas

**Arquivo:** `supabase/functions/generate-tasks-from-text/index.ts`

Alteracoes:
- Corrigir URL do endpoint AI de `https://ai-relay.lovable.dev/gemini/v1/chat/completions` para `https://ai.lovable.dev/v1/chat/completions`
- Manter modelo `gemini-2.5-flash` que e suportado
- Adicionar logs mais detalhados para debug

---

### Fase 2: Dashboard e Metricas de Tarefas

**Novos componentes:**

1. **`src/components/tasks/TasksDashboard.tsx`**
   - Cards KPI: Total de tarefas, Pendentes, Vencidas, Concluidas hoje
   - Grafico de barras: Tarefas por status (Backlog/Semana/Hoje/Concluido)
   - Grafico de pizza: Tarefas por categoria (Pessoal/Operacao/Projeto)
   - Timeline: Tarefas com prazo nos proximos 7 dias

2. **`src/components/tasks/TasksTimeline.tsx`**
   - Visualizacao de tarefas em formato timeline
   - Agrupamento por dia
   - Indicadores de urgencia (cores por vencimento)

**Alteracoes em arquivos existentes:**

- **`src/pages/TasksPage.tsx`**
  - Adicionar toggle de visualizacao: Dashboard | Kanban
  - Integrar novos componentes de metricas

---

### Fase 3: Graficos em Projetos

**Novos componentes:**

1. **`src/components/projects/dashboard/ProjectsMetricsCharts.tsx`**
   - Grafico de pizza: Projetos por status (Ativo/Pausado/Concluido/Arquivado)
   - Grafico de barras: Projetos por etapa atual
   - Grafico de linha: Evolucao de saude dos projetos
   - Metricas: Valor total de contratos, Projetos com bloqueio financeiro

**Alteracoes em arquivos existentes:**

- **`src/components/projects/dashboard/ProjectsDashboard.tsx`**
  - Integrar graficos de metricas
  - Melhorar cards de KPIs existentes

---

### Fase 4: Relatorio 360 (Novo Modulo)

**Novo arquivo:** `src/pages/reports/Report360Page.tsx`

**Funcionalidades:**
- Seletor de periodo: Mes atual | 3 meses | 6 meses | Ano
- KPIs principais:
  - Projetos entregues no periodo
  - Projetos abertos (em andamento)
  - Projetos atrasados
  - Percentual de entrega no prazo
- Graficos:
  - Evolucao de projetos por mes (barras empilhadas)
  - Distribuicao por status (pizza)
  - Timeline de entregas
- Tabela detalhada com filtros

**Hook:** `src/hooks/useReport360Metrics.ts`
- Funcao `fetchProjectMetrics(period)` que retorna:

```text
+------------------+-------+-------+-------+--------+
| Metrica          | 1 mes | 3 mes | 6 mes | 1 ano  |
+------------------+-------+-------+-------+--------+
| Entregues        |   X   |   X   |   X   |    X   |
| Em andamento     |   X   |   X   |   X   |    X   |
| Atrasados        |   X   |   X   |   X   |    X   |
| % No prazo       |   X   |   X   |   X   |    X   |
| Valor total      |   X   |   X   |   X   |    X   |
+------------------+-------+-------+-------+--------+
```

**Rota:** `/relatorios/360`

**Navegacao:**
- Adicionar novo card no `ReportsDashboard.tsx` para "Relatorio 360"
- Adicionar rota em `App.tsx`

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/tasks/TasksDashboard.tsx` | Dashboard com KPIs e graficos de tarefas |
| `src/components/tasks/TasksTimeline.tsx` | Timeline de tarefas por data |
| `src/components/projects/dashboard/ProjectsMetricsCharts.tsx` | Graficos de metricas de projetos |
| `src/pages/reports/Report360Page.tsx` | Pagina do Relatorio 360 |
| `src/hooks/useReport360Metrics.ts` | Hook para buscar metricas do relatorio 360 |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/generate-tasks-from-text/index.ts` | Corrigir URL da API de IA |
| `src/pages/TasksPage.tsx` | Adicionar toggle Dashboard/Kanban |
| `src/components/projects/dashboard/ProjectsDashboard.tsx` | Integrar graficos |
| `src/pages/reports/ReportsDashboard.tsx` | Adicionar card do Relatorio 360 |
| `src/App.tsx` | Adicionar rota /relatorios/360 |

---

## Detalhes Tecnicos

### Bibliotecas utilizadas (ja instaladas)
- `recharts` - Para graficos (BarChart, PieChart, LineChart)
- `date-fns` - Para manipulacao de datas e periodos
- `framer-motion` - Para animacoes

### Queries de Dados (Relatorio 360)

```sql
-- Projetos por periodo
SELECT 
  COUNT(*) FILTER (WHERE status = 'completed') as entregues,
  COUNT(*) FILTER (WHERE status = 'active') as em_andamento,
  COUNT(*) FILTER (WHERE status = 'active' AND due_date < CURRENT_DATE) as atrasados,
  SUM(contract_value) as valor_total
FROM projects
WHERE created_at >= [data_inicio]
```

### Calculo de Metricas de Tarefas

```typescript
// KPIs de Tarefas
const taskMetrics = {
  total: tasks.length,
  pending: tasks.filter(t => t.status !== 'done').length,
  overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < today && t.status !== 'done').length,
  completedToday: tasks.filter(t => t.completed_at && isToday(new Date(t.completed_at))).length,
  byStatus: { backlog: X, week: Y, today: Z, done: W },
  byCategory: { pessoal: X, operacao: Y, projeto: Z }
}
```

---

## Ordem de Implementacao

1. **Corrigir Edge Function** (prioritario - desbloqueia funcionalidade)
2. **Dashboard de Tarefas** (melhoria visual)
3. **Graficos em Projetos** (melhoria visual)
4. **Relatorio 360** (nova funcionalidade)

---

## Resultado Esperado

Apos implementacao:
- Geracao de tarefas com IA funcionando
- Tarefas com visualizacao Dashboard + metricas + timeline
- Projetos com graficos de distribuicao e evolucao
- Novo Relatorio 360 com visao consolidada por periodo
