
# Corrigir erro na atualizacao de etapas

## Problema

O banco de dados tem um CHECK constraint `project_stages_status_check` que aceita apenas estes valores:
- `not_started`
- `in_progress`
- `done`
- `blocked`

Porem o codigo em `TasksTab.tsx` esta enviando `completed` em vez de `done`, causando o erro:
> "new row for relation project_stages violates check constraint project_stages_status_check"

## Correcao

### Arquivo: `src/components/projects/detail/tabs/TasksTab.tsx`

1. Renomear a chave `completed` para `done` no `STATUS_CONFIG`
2. Atualizar `handleToggle` para usar `done` em vez de `completed`
3. Atualizar todas as comparacoes `=== "completed"` para `=== "done"`

Mudancas especificas:
- Linha 23: `completed` -> `done` na chave do objeto
- Linha 33: `s.status === "completed"` -> `s.status === "done"`
- Linha 37: `"completed" ? "not_started" : "completed"` -> `"done" ? "not_started" : "done"`
- Linha 43: `"completed"` -> `"done"` na condicao de actual_end
- Linha 47: `"completed"` -> `"done"` no toast
- Linha 57: `"completed"` -> `"done"` na condicao de actual_end do handleStatusChange
- Linha 102: `stage.status === "completed"` -> `stage.status === "done"`
- Linha 109: `stage.status === "completed"` -> `stage.status === "done"`

Nenhuma migracao de banco necessaria -- o problema e apenas no frontend enviando o valor errado.
