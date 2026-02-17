
# Fix: Glow/Dark Bug ao Encerrar Reveal da Overview

## Problema
Quando as animacoes de "reveal" (entrada) da pagina Overview terminam, os cards ficam escuros com glow azul. O problema persiste porque nem todos os componentes foram corrigidos na ultima rodada.

## Causas Restantes

1. **`KPICards.tsx` (linha 51-58)**: Ainda tem `whileHover` com `boxShadow: "0 20px 50px -20px rgba(0, 163, 211, 0.3)"`, `borderColor` azul, e `rotateX`/`rotateY` -- exatamente o mesmo bug que foi corrigido no `MetricCard.tsx`, mas nao foi aplicado aqui.

2. **`Dashboard.tsx` (linha 149)**: O card de data do header tem `whileHover={{ borderColor: "rgba(0, 163, 211, 0.2)", rotateY: 2 }}` que tambem introduz glow azul na borda.

## Correcoes

### 1. `src/components/dashboard/KPICards.tsx`
- Remover `boxShadow`, `borderColor`, `rotateX`, `rotateY` do `whileHover` (linhas 51-58)
- Manter apenas `y: -4` e `scale: 1.01` (mesmo padrao aplicado ao MetricCard)

### 2. `src/pages/Dashboard.tsx`
- Linha 149: Remover `borderColor: "rgba(0, 163, 211, 0.2)"` e `rotateY: 2` do `whileHover` do card de data
- Manter apenas `scale: 1.02`

## Resultado
Todos os cards da Overview terao hover limpo e sutil, sem glow azul em nenhum momento -- nem durante nem apos o reveal.
