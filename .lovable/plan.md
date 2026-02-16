
# Fix: Modal Modo Foco cortado no topo

## Problema
O modal do Modo Foco esta ultrapassando os limites da viewport. O `max-h-[85vh]` nao esta sendo respeitado corretamente devido ao zoom de 1.2 aplicado no container principal da plataforma, fazendo o conteudo escalar alem do viewport real e cortando o header com o botao de fechar.

## Correcao

**Arquivo:** `src/components/tasks/TaskExecutionGuide.tsx`

1. **Trocar `items-center` por `items-start`** no container fixo (linha 144) para que o modal alinhe pelo topo em vez de tentar centralizar verticalmente (o que causa corte quando o conteudo e grande)
2. **Adicionar `overflow-y-auto`** no container fixo para permitir scroll do proprio overlay
3. **Reduzir `max-h-[85vh]` para `max-h-[80vh]`** no modal para dar mais margem
4. **Adicionar `my-auto`** no motion.div do modal para centralizar quando couber, mas sem cortar quando nao couber

### Mudanca exata

Linha 144 - Container externo:
```
// De:
className="fixed inset-0 z-50 flex items-center justify-center p-4"
// Para:
className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
```

Linha 151 - Modal interno:
```
// De:
className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-border bg-background shadow-2xl"
// Para:
className="relative z-10 w-full max-w-lg max-h-[80vh] my-auto flex flex-col rounded-2xl border border-border bg-background shadow-2xl"
```

Isso garante que o modal nunca ultrapasse a viewport e sempre mostre o header com o botao X visivel.
