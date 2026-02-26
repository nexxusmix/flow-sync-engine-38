

## Problema Identificado

Modais e popups com `position: fixed` não funcionam corretamente porque estão renderizados **dentro** de elementos com `transform` CSS (framer-motion). Quando um elemento pai tem `transform`, o browser trata `fixed` como `absolute` relativo àquele pai — quebrando o posicionamento.

### Elementos causadores:
- `DashboardLayout.tsx` linha 106-113: `motion.div` com `animate={{ marginLeft }}` aplica `transform`
- `PageTransition.tsx`: aplica `scale`, `y`, `filter` via framer-motion
- `DashboardLayout.tsx` linha 126: `zoom: 1.2` no `<main>`

### Solução: Usar React Portals

Mover todos os modais/popups `fixed` para fora da árvore DOM transformada, renderizando-os via `createPortal` diretamente no `document.body`.

### Arquivos a modificar:

1. **Criar `src/components/ui/Portal.tsx`** — Componente utilitário que renderiza children via `createPortal(children, document.body)`

2. **`src/components/tasks/TaskDetailModal.tsx`** — Envolver o conteúdo `fixed inset-0` com `<Portal>`

3. **`src/components/tasks/TaskAnalysisPanel.tsx`** — Envolver com `<Portal>`

4. **`src/components/tasks/TaskExecutionGuide.tsx`** — Envolver com `<Portal>`

5. **`src/components/tasks/TaskAIPrioritySuggestions.tsx`** — Envolver com `<Portal>`

6. **`src/components/tasks/TaskAIDeadlineSuggestions.tsx`** — Envolver com `<Portal>`

7. **`src/components/tasks/TaskDuplicateDetection.tsx`** — Envolver com `<Portal>`

### Detalhes técnicos

```text
Antes:
  DashboardLayout (motion.div com transform)
    └─ PageTransition (motion.div com transform)
        └─ TasksPage
            └─ TaskDetailModal (fixed inset-0) ← QUEBRADO

Depois:
  DashboardLayout (motion.div com transform)
    └─ PageTransition (motion.div com transform)
        └─ TasksPage
            └─ TaskDetailModal → Portal → document.body (fixed inset-0) ← FUNCIONA
```

O componente Portal:
```tsx
import { createPortal } from "react-dom";
import { ReactNode } from "react";

export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
```

Cada modal terá apenas 2 linhas alteradas: importar `Portal` e envolver o `AnimatePresence`/container com `<Portal>`.

