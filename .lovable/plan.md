

# Otimizar Performance do Portal do Cliente

## Diagnóstico

Dois gargalos principais:

1. **Edge Function `resolve-portal-token`**: Faz ~15 queries sequenciais ao banco. Cada query espera a anterior terminar antes de iniciar.
2. **Página pesada**: 20 partículas animadas, cursor glow, parallax scroll, ScrollReveal em cada seção — tudo carrega antes do conteúdo aparecer.

## Plano de Otimização

### 1. Paralelizar queries na Edge Function
Agrupar as queries independentes com `Promise.all` — projeto, stages, deliverables, files, tasks, timeline podem rodar simultaneamente. Depois, em um segundo `Promise.all`, rodar comments, approvals, versions e change requests (que dependem dos IDs do primeiro grupo).

**Impacto estimado**: reduzir tempo de resposta de ~2-3s para ~0.5-1s.

### 2. Simplificar animações pesadas
- Reduzir `BackgroundParticles` de 20 para 6 partículas
- Remover `CursorGlow` (pouco perceptível, custo alto — mousemove listener constante)
- Remover `ScrollReveal` wrapper dos componentes principais — exibir conteúdo imediatamente
- Manter apenas animação de entrada sutil no container principal

### 3. Lazy load das tabs
Usar `React.lazy` para tabs secundárias (Financeiro, Mensagens, Documentos, Atividade) que não são visíveis no carregamento inicial.

### 4. Cache mais agressivo
Aumentar `staleTime` de 30s para 5 minutos — os dados do portal raramente mudam durante uma sessão.

### Arquivos a editar
1. `supabase/functions/resolve-portal-token/index.ts` — paralelizar queries
2. `src/pages/ClientPortalPageNew.tsx` — simplificar animações, lazy load tabs, cache
3. `src/hooks/useClientPortalEnhanced.tsx` — aumentar staleTime

