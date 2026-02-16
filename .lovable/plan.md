
# Fix: Modo Foco Travando (Erro 502 + JSON Truncado)

## Causa Raiz

Dois problemas combinados:

1. **73 tarefas enviadas de uma vez** com `max_tokens: 4096` -- a IA gera um JSON enorme que estoura o limite de tokens e fica truncado no meio de uma string, causando "Unterminated string in JSON"
2. **Gateway 502** -- o prompt com 73 tarefas e muito grande, causando timeout no gateway
3. **Modal vazio** -- quando da erro, o componente mostra nada (sem estado de erro, sem botao de retry)

## Correcoes

### 1. Edge Function `generate-execution-blocks/index.ts`

- **Limitar tarefas a no maximo 20** (as mais urgentes/com prazo proximo primeiro, depois as mais recentes)
- **Aumentar `max_tokens` de 4096 para 8192** para dar margem ao JSON
- **Adicionar regra no prompt**: "Maximo 6 blocos, maximo 4 tarefas por bloco" (limita o tamanho da resposta)
- **Adicionar retry**: se o parse falhar, tentar uma segunda chamada com prompt mais curto pedindo apenas os top 10 tasks

### 2. Frontend `TaskExecutionGuide.tsx`

- **Adicionar estado de erro** com mensagem e botao "Tentar novamente"
- **Limitar tarefas no frontend** antes de enviar (slice top 20)
- **Mostrar qual erro ocorreu** no modal ao inves de so toast

### Arquivos modificados:
- `supabase/functions/generate-execution-blocks/index.ts`
- `src/components/tasks/TaskExecutionGuide.tsx`
