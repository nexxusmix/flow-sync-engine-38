

## Plano: Categorização Automática de Arquivos com IA + Categorias Dinâmicas

### 1. Criar tabela `project_file_categories`
- Migration: nova tabela para categorias customizáveis por projeto
- Campos: `id`, `project_id` (nullable = global), `name`, `slug`, `icon`, `is_default`, `created_at`
- Seed com as 6 categorias padrão (brutos, projeto, referencias, entregas, contratos, outros) como `is_default = true`
- O campo `folder` em `project_files` continua como texto livre — não precisa de FK

### 2. Criar Edge Function `classify-file`
- Recebe: `{ fileName, fileType, mimeType, projectContext? }`
- Usa Lovable AI (gemini-3-flash-preview) para analisar nome + tipo do arquivo
- Retorna: `{ suggestedFolder: string, confidence: number, isNewCategory: boolean, newCategoryName?: string }`
- Regras no prompt: mapear para categorias existentes (brutos, projeto, referencias, entregas, contratos, outros) ou sugerir nova

### 3. Atualizar fluxo de upload no `FilesTab.tsx`
- Ao selecionar arquivos, chamar `classify-file` para cada arquivo
- Exibir sugestão de categoria da IA ao lado de cada arquivo no modal de upload
- Três opções por arquivo:
  - **Aceitar sugestão IA** (pré-selecionada)
  - **Escolher categoria existente** (dropdown)
  - **Criar nova categoria** (input de texto)
- Botão "Classificar com IA" para re-processar

### 4. Atualizar `useProjectFiles.tsx`
- Adicionar query para buscar categorias customizadas do projeto
- Atualizar `FileFolder` para aceitar strings dinâmicas (não mais type literal fixo)
- Adicionar mutation para criar nova categoria

### 5. Atualizar `FOLDER_CONFIG` e `FOLDER_ORDER` no `FilesTab.tsx`
- Tornar dinâmico: mesclar categorias padrão + categorias customizadas do projeto
- Novas categorias aparecem na grid de pastas automaticamente

### Detalhes Técnicos
- A classificação IA usa apenas nome do arquivo + mime type (leve e rápido)
- Categorias customizadas são por projeto (`project_id`)
- Categorias padrão são globais (`project_id = NULL, is_default = true`)
- O campo `folder` em `project_files` é texto livre, aceita qualquer slug

