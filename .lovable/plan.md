

## Corrigir "Resumo do Dia" para funcionar de verdade

### Problema
O `polo-ai-chat` usa o system prompt do **executor autonomo** (que responde com JSON/execution_plan) para TODAS as chamadas, incluindo o resumo diario. Quando o dashboard pede um "resumo executivo", o Gemini responde com um JSON de execution plan em vez de texto legivel. O `data?.response` pode ate ter conteudo, mas e um bloco JSON ilegivel, ou o campo vem vazio porque o executor nao "entende" o pedido como uma acao.

Alem disso, o componente `AIDailySummary` depende de dados reais (tarefas, CRM, pagamentos) que **nao sao enviados ao AI** -- ele pede "inclua tarefas pendentes" mas nao passa nenhum dado real. O AI inventa ou responde genericamente.

### Solucao

**1. Criar um system prompt especifico para daily summary no `polo-ai-chat/index.ts`**
- Quando `context.type === 'daily_summary'`, usar um prompt simplificado que pede resposta em markdown legivel (nao JSON)
- Isso garante que o Gemini responda com bullet points legiveis

**2. Injetar dados reais do dashboard na chamada**
- No `AIDailySummary.tsx`, buscar metricas reais usando o hook `useDashboardMetrics` que ja existe
- Passar esses dados no corpo da mensagem ao AI para que ele gere um resumo baseado em dados reais
- Isso transforma o resumo de "inventado" para "baseado em dados"

**3. Tratar melhor a resposta no componente**
- Garantir que o fallback so aparece quando realmente nao ha resposta

### Arquivos a editar

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/polo-ai-chat/index.ts` | Adicionar system prompt especifico quando `context.type === 'daily_summary'` |
| `src/components/dashboard/AIDailySummary.tsx` | Usar `useDashboardMetrics` para enviar dados reais ao AI |

### Detalhe tecnico

**polo-ai-chat - novo branch para daily_summary:**
```typescript
if (context?.type === 'daily_summary') {
  systemPrompt = `Voce e o Polo AI, assistente da produtora. Gere um resumo executivo curto do dia em markdown com bullet points. Seja direto, use emojis moderadamente. Responda APENAS em texto legivel, NUNCA em JSON. Use os dados fornecidos pelo usuario para basear o resumo.`;
}
```

**AIDailySummary - enviar metricas reais:**
```typescript
const { data: dashData } = useDashboardMetrics();
// ... na queryFn:
const metricsContext = dashData ? `Dados atuais:
- Projetos ativos: ${dashData.metrics.totalProjectsActive}
- Projetos em risco: ${dashData.metrics.projectsAtRisk}
- Receita do mes: R$${dashData.metrics.monthlyRevenue}
- Pagamentos pendentes: R$${dashData.metrics.pendingPayments}
- Deals no pipeline: ${dashData.metrics.totalDeals}
- Eventos proximos: ${dashData.metrics.eventsNext30Days}` : '';

message: `${metricsContext}\n\nGere o resumo do dia.`
```

### Resultado
- Resumo gerado com dados REAIS do dashboard
- Texto legivel em markdown (nao JSON de execution plan)
- Deploy automatico da edge function
