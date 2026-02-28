

## Plano: Corrigir cliques no dropdown Ferramentas

### Problema
Cada componente (TaskAnalysisPanel, TaskExecutionGuide, etc.) renderiza seu próprio `<Button>` internamente. Ao colocá-los dentro de `<DropdownMenuItem asChild><div>`, o dropdown fecha antes do onClick do Button disparar. Resultado: nada acontece.

### Solução
Substituir os componentes embutidos por `<DropdownMenuItem onClick={...}>` simples que controlam estado no pai (`TasksPage`). Os componentes são renderizados fora do dropdown e recebem uma prop `open`/`onOpenChange` para controle externo.

### Mudanças em `TasksPage.tsx`
1. Adicionar estados para cada ferramenta: `showAnalysis`, `showPrioritySuggestions`, `showDeadlineSuggestions`, `showDuplicates`, `showExecutionGuide`
2. No dropdown Ferramentas, trocar os componentes por DropdownMenuItems simples com onClick que setam esses estados
3. Renderizar os componentes fora do dropdown, passando prop de controle externo

### Mudanças em cada componente (5 arquivos)
Cada componente ganha props opcionais `externalOpen?: boolean` e `onExternalOpenChange?: (open: boolean) => void`. Quando `externalOpen` muda para `true`, dispara a ação automaticamente (runAnalysis, fetchSuggestions, etc.). O Button trigger original continua funcionando para uso standalone.

**Arquivos:**
- `src/pages/TasksPage.tsx` — dropdown com onClick simples + estados + renderização externa
- `src/components/tasks/TaskAnalysisPanel.tsx` — add `externalOpen` prop
- `src/components/tasks/TaskExecutionGuide.tsx` — add `externalOpen` prop
- `src/components/tasks/TaskAIPrioritySuggestions.tsx` — add `externalOpen` prop
- `src/components/tasks/TaskAIDeadlineSuggestions.tsx` — add `externalOpen` prop
- `src/components/tasks/TaskDuplicateDetection.tsx` — add `externalOpen` prop

