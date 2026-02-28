

## Plano: Ações Interativas no Resumo do Dia (Stand By / Recusar / Aprovar)

### O que será feito

Adicionar botões de ação em cada item do "Resumo do Dia — Visão 360°" (ações recomendadas e clientes para contatar) com 3 opções:
- **✅ Feito** — marca como concluído, salva na memória do Polo AI para não repetir
- **⏸️ Stand By** — adia para relembrar depois (snooze com data)
- **❌ Recusar** — descarta a ação, salva na memória para não sugerir novamente

### Banco de Dados

Criar tabela `daily_summary_actions` para persistir decisões:

```sql
CREATE TABLE public.daily_summary_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'action_item' | 'client_action'
  action_text TEXT NOT NULL, -- texto original da ação/cliente
  action_key TEXT NOT NULL, -- hash/chave única para deduplicar
  decision TEXT NOT NULL, -- 'done' | 'standby' | 'dismissed'
  standby_until TIMESTAMPTZ, -- data para relembrar (se standby)
  notes TEXT, -- observação opcional
  metadata JSONB DEFAULT '{}', -- dados extras (client_name, urgency, etc)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.daily_summary_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own summary actions"
  ON public.daily_summary_actions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_daily_summary_actions_user ON public.daily_summary_actions(user_id, decision);
CREATE INDEX idx_daily_summary_actions_key ON public.daily_summary_actions(action_key, user_id);
```

### Implementação no Frontend (`AIDailySummary.tsx`)

1. **Buscar decisões existentes** via `useQuery` na tabela `daily_summary_actions` para filtrar itens já decididos
2. **Cada ação recomendada** ganha 3 botões inline:
   - ✅ Feito → insere com `decision: 'done'`
   - ⏸️ Stand By → popover com seletor de data, insere com `decision: 'standby'` + `standby_until`
   - ❌ Recusar → insere com `decision: 'dismissed'`
3. **Cada client_action** ganha os mesmos 3 botões ao lado dos botões Copiar/WhatsApp
4. **Filtragem**: itens já marcados como `done` ou `dismissed` não aparecem; itens `standby` com data futura ficam ocultos, com data passada voltam a aparecer
5. **Animação**: ao decidir, o item faz fade-out suave
6. **Contadores**: mostrar "3 de 5 ações concluídas" no header da seção
7. **Memória Polo AI**: ao gerar próximo resumo, incluir no prompt as ações recusadas/feitas para evitar repetição

### Arquivos impactados

- **Nova tabela**: `daily_summary_actions` (migration)
- **`src/components/dashboard/AIDailySummary.tsx`**: adicionar botões, queries, filtros, contadores
- **`supabase/functions/polo-ai-chat/index.ts`**: no bloco `daily_summary`, injetar ações passadas no prompt para contexto

