

## Plano: Adicionar Tarefas COM IA — Preview, Edição e Upload de Arquivos

### Escopo

Substituir o fluxo atual "Adicionar Tarefas" (que apenas seleciona tarefas existentes) por um fluxo com IA que:
- Permite digitar texto livre e/ou enviar múltiplos arquivos (PDF, DOCX, TXT, imagens)
- Processa tudo via IA para gerar tarefas estruturadas
- Mostra prévia editável do resultado antes de confirmar
- Permite regenerar, editar inline cada tarefa, ou ajustar com campo de prompt

### Arquitetura

```text
┌─────────────────────────────────────────────┐
│  Dialog "Adicionar Tarefas com IA"          │
│                                             │
│  Step 1: INPUT                              │
│  ┌─────────────────────────────────────┐    │
│  │ Textarea (prompt / texto livre)     │    │
│  │ [📎 Upload Arquivos] (multi)        │    │
│  │ Lista de arquivos anexados          │    │
│  │ [🧠 Gerar Tarefas]                 │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Step 2: PREVIEW                            │
│  ┌─────────────────────────────────────┐    │
│  │ Tarefa 1: [título editável] [🗑️]   │    │
│  │   desc: [editável]                  │    │
│  │   tags: [...] categoria: [select]   │    │
│  │ Tarefa 2: ...                       │    │
│  │ ...                                 │    │
│  │ ─────────────────────────────────── │    │
│  │ Campo prompt: "Refine isso..."      │    │
│  │ [♻️ Regenerar] [✅ Confirmar]       │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Tarefas de Implementação

1. **Criar componente `AiAddTasksDialog.tsx`** em `src/components/tasks/`
   - Step 1 (input): Textarea para texto/prompt + input de upload múltiplo de arquivos + lista de arquivos anexados com opção de remover
   - Step 2 (preview): Lista editável de tarefas geradas pela IA — cada tarefa com título, descrição, tags e categoria editáveis inline; botão remover por tarefa
   - Campo de prompt para orientar regeneração
   - Botões: "Regenerar" (chama IA de novo com prompt atualizado), "Confirmar" (salva tarefas)
   - Upload de arquivos: extrai texto de cada arquivo (usando `generate-tasks-from-text` com `extractedTexts`)

2. **Atualizar edge function `generate-tasks-from-text`**
   - Aceitar campo `guidancePrompt` opcional para orientar a geração
   - Aceitar campo `imageBase64` para imagens (enviar como multimodal ao Gemini)
   - Usar modelo com visão (`gemini-2.5-flash`) quando houver imagens

3. **Integrar no `SavedFocusPlans.tsx`**
   - Substituir o dialog atual de "Adicionar Tarefas" pelo novo `AiAddTasksDialog`
   - No confirm, inserir as tarefas na tabela `tasks` e depois adicioná-las como bloco ao plano
   - Manter compatibilidade com o botão existente

4. **Processamento de arquivos no frontend**
   - Extrair texto de PDFs/DOCX/TXT via FileReader
   - Para imagens, converter para base64 e enviar junto
   - Mostrar progresso de upload/processamento

### Detalhes Técnicos

- **Edge function**: `generate-tasks-from-text` já aceita `rawText` e `extractedTexts`, só precisa adicionar `guidancePrompt` e suporte a imagens multimodais
- **Modelo IA**: `google/gemini-2.5-flash` (já usado no projeto para multimodal)
- **Limites**: 10 arquivos, 20MB cada (alinhado com limites existentes)
- **Tarefas criadas**: inseridas em `tasks` com `workspace_id` padrão e depois vinculadas ao plano como novo bloco

