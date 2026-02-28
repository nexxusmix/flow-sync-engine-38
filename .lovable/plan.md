

## Diagnóstico

O recurso "Templates" atualmente é 100% manual:
- O usuário cria templates preenchendo formulário manualmente (título, descrição, categoria, prioridade, tags, subtarefas)
- O template é aplicado apenas para preencher o formulário de nova tarefa
- Não há nenhuma geração, automação ou processamento com IA

## Plano: Templates com IA Autônoma

### 1. Criar Edge Function `generate-task-templates`
Nova função que recebe um prompt/contexto do usuário e gera automaticamente templates completos:
- Título, descrição, categoria, prioridade, tags e subtarefas
- Usa `google/gemini-2.5-flash` via Lovable AI Gateway
- Gera 3-5 templates de uma vez baseado no contexto fornecido

### 2. Adicionar "Gerar com IA" ao TaskTemplateManager
- Botão "Gerar Templates com IA" no topo do dialog
- Campo de texto para o usuário descrever o tipo de templates que precisa (ex: "templates para produção de vídeo", "templates para gestão de projeto de marketing")
- A IA gera os templates e salva automaticamente no banco
- Loading state durante geração

### 3. Adicionar "Aplicar e Criar Tarefa" automático
- Quando um template é aplicado, ao invés de apenas preencher o formulário, criar a tarefa diretamente com um clique
- Botão "Criar Tarefa" direto no card do template (além do botão de copiar para formulário)

### 4. Adicionar "Gerar Templates a partir das Tarefas"
- Botão que analisa as tarefas existentes do usuário e sugere templates baseados em padrões recorrentes
- A IA identifica tarefas similares e cria templates automaticamente

### Detalhes Técnicos

**Edge Function `supabase/functions/generate-task-templates/index.ts`:**
- Recebe `{ prompt, existingTemplates }` no body
- Usa tool calling para extrair JSON estruturado com array de templates
- Cada template: `{ title, description, category, priority, tags, checklist_items }`
- Retorna array de templates gerados

**`src/components/tasks/TaskTemplateManager.tsx`:**
- Adicionar estado `aiPrompt` e `isGeneratingAI`
- Seção no topo com input + botão "Gerar com IA"
- Ao receber resultado, salvar cada template via `createTemplate.mutateAsync`
- Botão "Analisar Tarefas" que envia tarefas existentes como contexto para gerar templates

**`src/hooks/useTaskTemplates.tsx`:**
- Adicionar mutation `generateTemplatesAI` que chama a edge function e salva os resultados

**`supabase/config.toml`:**
- Registrar `generate-task-templates` com `verify_jwt = false`

