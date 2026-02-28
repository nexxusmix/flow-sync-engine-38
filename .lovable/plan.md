
Objetivo
- Elevar o fluxo IA de “gerar → prévia → confirmar” para nível produção (robusto, rápido, sem perda de dados, com UX clara).

Plano de implementação (curto e direto)

1) Robustez de geração e estados (`src/pages/TasksPage.tsx`)
- Bloquear “Gerar Tarefas” também quando houver upload em processamento.
- Tratar erros de limite/cota/timeout com mensagens específicas e ação de retry.
- Limpar estados de loading com segurança em todos os caminhos (incluindo exceções).
- Evitar ações concorrentes: impedir regenerar/confirmar simultaneamente.

2) Prévia mais segura e inteligente (`src/components/tasks/TaskAIPreviewPanel.tsx`)
- Validar antes de confirmar: impedir títulos vazios e destacar cards inválidos.
- Confirmar perda de alterações ao clicar “Voltar” ou “Regenerar” após edição/reordenação.
- Melhorar seleção em lote: comportamento consistente em lista vazia e contador de selecionadas.
- Adicionar ações rápidas por lote (categoria/status para selecionadas).
- Manter drag-and-drop com UX melhor (handle claro, feedback visual mais forte, fallback de teclado estável).

3) Persistência fiel da ordem e metadados (`src/hooks/useTasksUnified.tsx`)
- Ajustar `createTasksFromAI` para respeitar `position` vindo da prévia (quando existir), sem recalcular cegamente.
- Garantir defaults consistentes no insert (ex.: `priority` padrão) para evitar variação entre criação manual e IA.

4) Sanitização e qualidade da saída IA (`supabase/functions/generate-tasks-from-text/index.ts`)
- Normalizar saída: `trim` de título/descrição/tags, remover duplicadas, descartar itens vazios.
- Definir limite máximo de tarefas por geração (proteção contra respostas excessivas).
- Validar datas inválidas e normalizar status/categoria com fallback seguro.
- Retornar warnings estruturados (ex.: itens descartados) para feedback transparente na UI.

5) Refino visual da prévia (alinhado ao estilo do print enviado)
- Cards mais “executivos”: hierarquia visual forte (título, prazo, categoria, tags, ações).
- Barra superior com resumo (“geradas / selecionadas / atrasadas com data”).
- Rodapé sticky com ações primárias sempre visíveis em listas longas.

Detalhes técnicos (arquivos alvo)
- `src/pages/TasksPage.tsx`
- `src/components/tasks/TaskAIPreviewPanel.tsx`
- `src/hooks/useTasksUnified.tsx`
- `supabase/functions/generate-tasks-from-text/index.ts`

Checklist de validação E2E (obrigatório)
- Gerar com texto simples, com arquivos, e com orientação.
- Editar campos, desmarcar algumas, arrastar/reordenar, regenerar com confirmação de perda.
- Confirmar criação e validar ordem final no quadro.
- Testar estados de erro (limite, timeout, resposta vazia) e garantir UX sem travar.
- Testar fluxo completo em desktop e mobile.
