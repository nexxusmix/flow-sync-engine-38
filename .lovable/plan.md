

## Auditoria — Executive Dashboard

### Bugs encontrados

1. **Heatmap com cores quebradas** — `hsla(var(--primary), 0.5)` não funciona. CSS variables no formato `210 80% 50%` precisam de `hsl(var(--primary) / alpha)` com a sintaxe moderna, não `hsla()`.

2. **Limite de 1000 rows do banco** — Todas as queries usam `.select('*')` sem `.limit()`. Tabelas como `tasks`, `revenues` e `expenses` podem ultrapassar 1000 registros e retornar dados truncados silenciosamente, gerando métricas incorretas.

3. **Sem estado de erro** — Se qualquer query falhar, `data` fica `undefined` e o dashboard exibe spinner infinito. Precisa de fallback visual.

4. **Productivity score instável** — Quando não há mês anterior (`revenuePrevMonth = 0`), `revenueDelta` fica 0 e 30 pontos do score são zerados. A fórmula penaliza indevidamente quando falta histórico.

5. **Sem auto-refresh** — `staleTime: 30_000` mas sem `refetchInterval`, então o dashboard não atualiza sozinho enquanto o usuário observa.

6. **"A Receber" mistura pendente e atrasado** — Valores overdue e pending são somados sem distinção visual de urgência.

### Correções

**`src/hooks/useExecutiveDashboard.ts`:**
- Adicionar `.limit(5000)` em todas as queries para evitar truncamento silencioso
- Separar `pendingRevenue` e `overdueRevenue` como métricas distintas
- Ajustar fórmula do `productivityScore`: quando não há dado histórico, usar peso proporcional aos dados disponíveis
- Adicionar `refetchInterval: 60_000` para auto-refresh a cada minuto

**`src/pages/ExecutiveDashboardPage.tsx`:**
- Corrigir heatmap: `hsl(var(--primary) / ${opacity})` com sintaxe CSS moderna
- Adicionar estado de erro com botão de retry
- Separar card "A Receber" em pendente vs atrasado (com cor de alerta para overdue)
- Adicionar indicador de "última atualização" no header

### Arquivos
- `src/hooks/useExecutiveDashboard.ts`
- `src/pages/ExecutiveDashboardPage.tsx`

