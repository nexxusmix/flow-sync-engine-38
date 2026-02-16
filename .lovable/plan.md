
# Fix: Modal Modo Foco cortado - footer invisivel

## Problema
Com o zoom de 1.2x aplicado na plataforma, o `max-h-[80vh]` do modal se transforma em ~96vh real, fazendo o footer (botoes "Exportar PDF" e "Salvar Plano") ficar fora da tela. O conteudo simplesmente corta apos os blocos.

## Correcao

**Arquivo:** `src/components/tasks/TaskExecutionGuide.tsx`

Reduzir `max-h-[80vh]` para `max-h-[70vh]` no modal interno. Isso garante que mesmo com o zoom de 1.2x (70vh * 1.2 = 84vh), o modal completo com header + conteudo + footer caiba na viewport.

### Mudanca exata (1 linha)

Linha 151:
```
// De:
className="relative z-10 w-full max-w-lg max-h-[80vh] my-auto flex flex-col ..."

// Para:
className="relative z-10 w-full max-w-lg max-h-[70vh] my-auto flex flex-col ..."
```

O conteudo dos blocos continua com scroll interno, e o footer com os botoes ficara sempre visivel na parte inferior do modal.
