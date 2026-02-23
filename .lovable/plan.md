

## Plano de Melhorias Globais - Fase 1

Como voce quer melhorar todas as areas (Dashboard, Login, CRM, Notificacoes) com todos os tipos de melhoria (UX, funcionalidades, IA, performance), vou organizar em uma fase inicial focada nas melhorias de maior impacto e menor risco.

---

### 1. Login com Google (OAuth Social)

Adicionar botao "Entrar com Google" na pagina de login, usando o sistema gerenciado do Lovable Cloud (sem necessidade de configurar credenciais).

**Arquivo**: `src/pages/LoginPage.tsx`
- Importar `lovable` de `@/integrations/lovable`
- Adicionar botao estilizado "Continuar com Google" abaixo do formulario
- Chamar `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`
- Manter o formulario de email/senha existente como alternativa

---

### 2. Sistema de Notificacoes em Tempo Real

Criar um sistema de notificacoes que aparece como badge no menu lateral e como dropdown ao clicar.

**Tabela**: `notifications` (nova migração)
- Colunas: id, user_id, title, message, type (info/warning/error/success), read (boolean), entity_type, entity_id, created_at
- RLS: usuario so ve suas proprias notificacoes

**Arquivos novos**:
- `src/hooks/useNotifications.ts` - Hook com React Query + Realtime subscription para notificacoes nao lidas
- `src/components/layout/NotificationDropdown.tsx` - Dropdown com lista de notificacoes, marcar como lida, limpar todas

**Arquivo editado**: `src/components/layout/Sidebar.tsx`
- Adicionar badge com contador de notificacoes nao lidas no item "Avisos"
- Badge animado com pulse quando ha novas notificacoes

---

### 3. Dashboard - Resumo Diario com IA

Adicionar um card no topo do Dashboard com um resumo inteligente do dia gerado pelo Polo AI.

**Arquivo novo**: `src/components/dashboard/AIDailySummary.tsx`
- Card com resumo gerado pela edge function `polo-ai-chat`
- Conteudo: destaques do dia (tarefas pendentes, deals quentes, pagamentos proximos, entregas da semana)
- Botao para regenerar o resumo
- Skeleton loading enquanto a IA processa
- Cache do resumo por sessao (evitar chamadas repetidas)

**Arquivo editado**: `src/pages/Dashboard.tsx`
- Inserir o componente `AIDailySummary` logo apos o header, antes dos metric cards

---

### 4. Dashboard - Graficos Interativos

Substituir os blocos estaticos do Dashboard por graficos interativos usando Recharts (ja instalado).

**Arquivo novo**: `src/components/dashboard/RevenueChart.tsx`
- Grafico de barras/area mostrando receita dos ultimos 6 meses
- Tooltip interativo com valores formatados em BRL
- Cores consistentes com o tema

**Arquivo novo**: `src/components/dashboard/PipelineChart.tsx`
- Grafico de funil ou donut mostrando distribuicao de deals por estagio
- Clicavel para navegar ao CRM filtrado

**Arquivo editado**: `src/pages/Dashboard.tsx`
- Adicionar secao com os graficos em grid 2 colunas abaixo dos KPIs

---

### 5. CRM - Filtros Avancados

Adicionar barra de filtros no topo do Kanban do CRM.

**Arquivo editado**: `src/pages/CRMPage.tsx`
- Filtro por temperatura (hot/warm/cold)
- Filtro por responsavel
- Filtro por valor minimo/maximo
- Busca por nome do deal ou contato
- Botao "Limpar filtros"
- Filtros persistidos no estado local (Zustand ou useState)

---

### 6. Dark/Light Mode Toggle

Adicionar alternador de tema no Sidebar (rodape, proximo ao usuario).

**Arquivo editado**: `src/components/layout/Sidebar.tsx`
- Botao de toggle sol/lua no rodape do sidebar
- Usar `next-themes` (ja instalado) para alternar entre dark e light

**Arquivo editado**: `src/App.tsx` ou provider raiz
- Garantir que o `ThemeProvider` do next-themes esteja envolvendo a aplicacao

---

### Resumo de Arquivos

| Arquivo | Tipo | Mudanca |
|---|---|---|
| `src/pages/LoginPage.tsx` | Editar | Botao Google OAuth |
| `src/components/layout/Sidebar.tsx` | Editar | Badge notificacoes + toggle tema |
| `src/pages/Dashboard.tsx` | Editar | Resumo IA + graficos |
| `src/components/dashboard/AIDailySummary.tsx` | Novo | Card resumo diario com IA |
| `src/components/dashboard/RevenueChart.tsx` | Novo | Grafico receita mensal |
| `src/components/dashboard/PipelineChart.tsx` | Novo | Grafico pipeline CRM |
| `src/hooks/useNotifications.ts` | Novo | Hook notificacoes realtime |
| `src/components/layout/NotificationDropdown.tsx` | Novo | Dropdown de notificacoes |
| `src/pages/CRMPage.tsx` | Editar | Filtros avancados |
| Migracao SQL | Novo | Tabela notifications + RLS |

### Ordem de implementacao

1. Login com Google (rapido, alto impacto)
2. Dark/Light mode toggle (rapido, visual)
3. Sistema de notificacoes (banco + frontend)
4. Dashboard - Resumo IA
5. Dashboard - Graficos interativos
6. CRM - Filtros avancados

