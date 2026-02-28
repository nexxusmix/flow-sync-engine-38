

## Plano: Inteligência Preditiva na Overview do Projeto

O dashboard executivo (`/executivo`) já tem componentes preditivos (Risk Radar, Revenue Forecast, Capacity, etc.). Agora vamos trazer essa mesma inteligência para a **OverviewTab de cada projeto individual** — focada no contexto daquele projeto específico.

### O que será adicionado à OverviewTab

1. **Edge Function `generate-project-insights`** — Análise IA focada em UM projeto
   - Recebe: dados do projeto, tarefas do projeto, receitas do projeto, stages
   - Retorna: `risk_assessment` (probabilidade de atraso, risco financeiro, saúde do cliente), `completion_forecast` (data prevista real), `action_items` (o que fazer agora), `bottlenecks`, `executive_summary`
   - Usa `chatCompletion` do `_shared/ai-client.ts`

2. **Hook `useProjectIntelligence(projectId)`** — Métricas preditivas por projeto
   - Busca tarefas e receitas do projeto
   - Calcula client-side:
     - **Velocity do projeto** (tarefas concluídas/dia últimos 30d)
     - **Data prevista de conclusão** (tarefas pendentes / velocity)
     - **Risco de atraso (%)** = (overdue stages / total × velocity × days remaining)
     - **ROI do projeto** = contract_value / horas estimadas
     - **Status financeiro** = pago vs total, receitas vencidas
     - **Saúde do cliente** = tempo desde última reunião, revisões pendentes, feedback pendente
     - **Alerta de prazo** = se data prevista > due_date

3. **Novos componentes na OverviewTab** (inseridos no topo, antes do conteúdo atual):

   **A. Banner de Alerta de Prazo** — Se a data prevista de conclusão ultrapassar o due_date:
   - Banner vermelho/amarelo com: "Risco de atraso: conclusão prevista em X, prazo em Y"
   - Mostra velocity atual vs necessária

   **B. Bloco de Inteligência do Projeto** (`ProjectIntelligenceBlock`):
   - 4 cards: Risco de Atraso (%), Previsão de Conclusão (data), ROI (R$/h), Saúde do Cliente (score)
   - Cores: verde/amarelo/vermelho baseado nos valores

   **C. Botão "Análise IA do Projeto"** — Chama a edge function com dados do projeto:
   - Gera sumário executivo, riscos, ações recomendadas e gargalos
   - Renderiza usando ExecutiveActionBlock e cards de risco (reutilizando padrão do AIRiskRadar)
   - Cache em localStorage por projeto

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-project-insights/index.ts` | Criar |
| `src/hooks/useProjectIntelligence.ts` | Criar |
| `src/components/projects/detail/ProjectIntelligenceBlock.tsx` | Criar |
| `src/components/projects/detail/ProjectDeadlineAlert.tsx` | Criar |
| `src/components/projects/detail/ProjectAIAnalysis.tsx` | Criar |
| `src/components/projects/detail/tabs/OverviewTab.tsx` | Adicionar novos blocos no topo |
| `supabase/config.toml` | Registrar nova function |

