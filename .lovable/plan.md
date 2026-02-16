
# Correcao Polo AI + Melhorias de Tarefas com IA

## DIAGNOSTICO DOS ERROS

### Problema 1: Auto-execucao falha silenciosamente
No `useAgentChat.tsx` (linhas 349-358), a auto-execucao e disparada **dentro de um `setMessages` callback**, o que causa problemas:
- O `autoExecutePlan` e chamado com `msgIndex` calculado como `prev.length - 1`, mas essa e a mensagem do assistant, nao a do user
- O `autoExecutePlan` tenta atualizar `newMsgs[msgIndex + 1]` (linha 384), que pode nao existir
- O resultado: a execucao roda, mas o feedback nao aparece na UI (nao atualiza a mensagem correta)

### Problema 2: Nenhum feedback textual apos auto-execucao
O `autoExecutePlan` (linhas 374-407) so mostra toast, mas **NAO posta mensagem de texto** no chat dizendo o que foi feito/errou. O `handleExecutePlan` (manual) sim posta feedback detalhado (linhas 448-468), mas o auto nao.

### Problema 3: Falta animacao de "executando" durante auto-execucao
Quando auto-executa, nao ha indicacao visual clara no chat de que algo esta sendo processado alem do spinner nos steps.

---

## PLANO DE CORRECAO

### Passo 1: Corrigir `useAgentChat.tsx` - Auto-execucao robusta com feedback

**Mudancas:**
1. Mover a chamada de `autoExecutePlan` para FORA do `setMessages` callback (anti-pattern do React)
2. Usar `setTimeout(0)` ou chamar diretamente apos o `setMessages` final
3. No `autoExecutePlan`, adicionar mensagem de texto no chat (igual ao `handleExecutePlan`):
   - Sucesso: "Execucao concluida! X acoes executadas com sucesso."
   - Erro: "Execucao com X erro(s):" + lista dos erros + sugestao de regenerar
4. Adicionar mensagem intermediaria "Executando plano..." com animacao enquanto processa
5. Corrigir o calculo do `msgIndex` para apontar ao assistant message correto

### Passo 2: Melhorar `ExecutionPlanView.tsx` - Animacoes de processamento

**Mudancas:**
1. Adicionar animacao de "processando" em cada step durante execucao (pulse/glow no step ativo)
2. Progress bar geral no topo do plano mostrando % de steps completados
3. Animacao de transicao quando um step passa de pending para success/error
4. Timer mostrando tempo total de execucao

### Passo 3: Melhorar `AIAssistant.tsx` - Animacao de execucao no chat

**Mudancas:**
1. Quando `isExecuting` = true, mostrar indicador animado no chat ("Polo AI executando plano..." com spinner + steps counter)
2. Animacao de entrada para mensagens de resultado

### Passo 4: Expandir upload de arquivos no "Criar com IA" (TasksPage)

**Mudancas em `src/pages/TasksPage.tsx`:**
1. Adicionar input de upload multiplo ao Sheet de "Criar com IA":
   - Aceitar: imagens (PNG, JPG, WEBP), PDFs, documentos (DOCX, TXT), audio (MP3, WAV, M4A, OGG)
   - Upload para bucket `project-files` do storage
2. Para audios: chamar edge function `transcribe-media` para transcrever e usar o texto resultante como input
3. Para PDFs/documentos: extrair texto via a mesma funcao ou enviar como contexto
4. Para imagens: enviar como referencia visual ao prompt
5. Mostrar preview dos arquivos uploadados com opcao de remover
6. Loading states com animacao para cada tipo de processamento

**Mudancas em `supabase/functions/generate-tasks-from-text/index.ts`:**
1. Aceitar campo `extractedTexts` (array de textos extraidos de arquivos) alem de `rawText`
2. Combinar todos os textos no prompt para a IA

### Passo 5: Botao "Analise de Tarefas" (Task Analysis)

**Criar componente `src/components/tasks/TaskAnalysisPanel.tsx`:**
1. Botao que abre um painel/drawer com analise IA das tarefas:
   - Quantidade total, por status, por categoria
   - Tarefas repetidas/duplicadas (por similaridade de titulo)
   - Tarefas atrasadas (due_date < hoje e status != done)
   - Tarefas "dormentes" (sem update ha mais de 7 dias)
   - Distribuicao por prioridade
2. Chama edge function que analisa e retorna insights
3. Animacoes de loading enquanto processa

### Passo 6: Gerador de Blocos de Execucao (Neuroscience-based)

**Criar componente `src/components/tasks/TaskExecutionGuide.tsx`:**
1. Botao "Modo Foco" que gera um guia de execucao inteligente baseado em:
   - Tecnicas de produtividade (Pomodoro, Time Boxing, Eat the Frog, 2-Minute Rule)
   - Agrupamento por contexto (deep work vs shallow work)
   - Sequenciamento otimo (alta energia primeiro, alternancia cognitiva)
   - Estimativa de tempo por tarefa
2. Interface do guia:
   - Lista sequencial de blocos (ex: "Bloco 1: Deep Work - 45min")
   - Dentro de cada bloco, as tarefas ordenadas
   - Cronometro integrado por tarefa e por bloco
   - Botao "Iniciar" que comeca a contar
   - Botao "Concluir" que marca a tarefa como done
   - Barra de progresso geral
   - Tempo estimado total vs tempo real
3. Chama edge function com as tarefas pendentes e retorna o plano de execucao

**Criar edge function `supabase/functions/generate-execution-blocks/index.ts`:**
1. Recebe lista de tarefas pendentes
2. Usa IA para:
   - Classificar tipo cognitivo (deep vs shallow)
   - Estimar tempo
   - Agrupar em blocos com pausas
   - Sugerir sequencia otima
   - Aplicar tecnicas de produtividade/TDAH
3. Retorna blocos estruturados com metadata

### Passo 7: Cronometro de Tarefa

**Mudancas em `src/components/tasks/TaskDetailModal.tsx`:**
1. Adicionar cronometro no modal de detalhe da tarefa
2. Botao "Iniciar" que comeca a contar o tempo
3. Persiste tempo no campo (adicionar coluna `time_spent_seconds` via migracao se nao existir)
4. Botao "Pausar" e "Parar"
5. Exibe tempo total gasto

---

## DETALHES TECNICOS

### Arquivos a criar:
1. `src/components/tasks/TaskAnalysisPanel.tsx` - Painel de analise com IA
2. `src/components/tasks/TaskExecutionGuide.tsx` - Guia de execucao com cronometro
3. `src/components/tasks/TaskTimer.tsx` - Componente cronometro reutilizavel
4. `supabase/functions/generate-execution-blocks/index.ts` - Edge function para blocos
5. `supabase/functions/analyze-tasks/index.ts` - Edge function para analise

### Arquivos a modificar:
1. `src/hooks/useAgentChat.tsx` - Corrigir auto-execucao + feedback
2. `src/components/ai/ExecutionPlanView.tsx` - Animacoes de processamento
3. `src/components/ai/AIAssistant.tsx` - Indicador de execucao
4. `src/pages/TasksPage.tsx` - Upload multiplo + botoes de analise e execucao
5. `supabase/functions/generate-tasks-from-text/index.ts` - Aceitar textos extraidos

### Migracao de banco:
- Adicionar coluna `time_spent_seconds` (integer, default 0) na tabela `tasks`

### Dependencias:
- Nenhuma nova (usa framer-motion, lucide-react, supabase ja instalados)

### Performance:
- Cronometro usa `useRef` para interval (nao re-renderiza a cada segundo no pai)
- Analise de tarefas cacheia resultado por 5 minutos
- Blocos de execucao geram uma vez e ficam em state local
