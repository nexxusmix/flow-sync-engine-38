

## Plano: Refinamento Global — Settings, AI Tasks, Console Warnings, Edge Cases

### O que encontrei ao analisar:

1. **Console warning**: `SettingsDashboard` não usa `forwardRef`, causando warning de ref no React Router
2. **Edge function `generate-tasks-from-text`**: usa tool calling via JSON parsing bruto (frágil) — deveria usar tool calling nativo para garantir JSON válido
3. **`AiAddTasksDialog`**: falta feedback visual de erros de rate-limit (429/402), não trata erros granulares da IA
4. **Settings Dashboard**: tipografia usa `text-3xl` hardcoded (não migrado), e `text-xs` em vez de tokens semânticos
5. **Sub-páginas de Settings**: padrão inconsistente — algumas usam `max-w-3xl`, outras não; headers com tamanhos diferentes
6. **`handleAddAiTasks` em `SavedFocusPlans`**: não trata erro do `supabase.from('saved_focus_plans').update()` — silencia falha
7. **Progress bar na geração**: finge progresso com valores fixos (30/90/100) — deveria ser mais realista

### Implementação

1. **Fix `SettingsDashboard` forwardRef warning**
   - Envolver export com `React.forwardRef` ou remover ref passando-o como componente correto no router

2. **Migrar tipografia restante em Settings**
   - `text-3xl` → `text-page-title`, `text-2xl` → `text-section-title`, `text-xs` → `text-caption` nas sub-páginas
   - Aplicar em: `SettingsDashboard`, `WorkspaceSettingsPage`, `AuditSettingsPage`, `DangerZoneSettingsPage`, `ProspectingSettingsPage`, `TeamSettingsPage`

3. **Melhorar edge function `generate-tasks-from-text`**
   - Usar tool calling nativo (`tools` + `tool_choice`) em vez de pedir JSON bruto no prompt — elimina parsing frágil e markdown wrapping
   - Tratar erros 429/402 e repassar status code ao cliente

4. **Melhorar `AiAddTasksDialog`**
   - Tratar erros 429/402 com mensagens amigáveis
   - Progresso mais realista com intervalos progressivos
   - Adicionar empty state quando IA retorna 0 tarefas com sugestão de tentar de novo
   - Desabilitar botão de arquivo durante processamento

5. **Melhorar `handleAddAiTasks` em `SavedFocusPlans`**
   - Adicionar try/catch no update do plano
   - Refresh da lista de tasks após inserção

6. **Padronizar headers das sub-páginas de Settings**
   - Unificar padrão visual: ícone + título + descrição + botão salvar

### Arquivos Impactados

- `src/pages/settings/SettingsDashboard.tsx`
- `src/pages/settings/WorkspaceSettingsPage.tsx`
- `src/pages/settings/AuditSettingsPage.tsx`
- `src/pages/settings/DangerZoneSettingsPage.tsx`
- `src/pages/settings/ProspectingSettingsPage.tsx`
- `src/pages/settings/TeamSettingsPage.tsx`
- `supabase/functions/generate-tasks-from-text/index.ts`
- `src/components/tasks/AiAddTasksDialog.tsx`
- `src/components/tasks/SavedFocusPlans.tsx`

