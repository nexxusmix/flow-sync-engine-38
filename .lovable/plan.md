
# Plano: Logo de Projeto + Geracao de Imagens com IA + Exportacao PDF Universal

## Resumo Executivo

Este plano implementa tres funcionalidades integradas:

1. **Upload de logo/imagem do projeto** - Campo para adicionar uma imagem de identidade visual ao projeto
2. **Geracao de imagens com IA** - Gerar banner, favicon, foto do projeto a partir do logo
3. **Exportacao PDF Universal** - Exportar Relatorio 360, Tarefas, Projetos e Overview em PDF com identidade visual da plataforma

---

## Arquitetura Geral

```text
+---------------------------+     +------------------------+     +------------------+
|  Upload Logo do Projeto   | --> |  generate-project-art  | --> | Storage: exports |
|  (Supabase Storage)       |     |  (Edge Function + IA)  |     | (banner, favicon)|
+---------------------------+     +------------------------+     +------------------+
                                           |
                                           v
+---------------------------+     +------------------------+
|  Paginas com Exportar PDF | --> |  export-universal-pdf  |
|  (Report360, Tasks, Proj) |     |  (Edge Function)       |
+---------------------------+     +------------------------+
```

---

## Parte 1: Upload de Logo/Imagem do Projeto

### 1.1 Alteracao no Banco de Dados

Adicionar colunas na tabela `projects`:

- `logo_url` (TEXT) - URL da imagem de logo do projeto
- `banner_url` (TEXT) - URL do banner gerado com IA
- `cover_image_url` (TEXT) - Imagem de capa do projeto

Migration SQL:
```sql
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
```

### 1.2 Interface de Upload

**Arquivo:** `src/components/projects/modals/NewProjectModal.tsx`

Adicionar:
- Campo de upload de imagem para logo
- Preview da imagem selecionada
- Upload para bucket `project-files` no path `logos/{project_id}.png`

**Arquivo:** `src/components/projects/modals/EditProjectModal.tsx`

- Mesmo campo de upload
- Opcao de remover imagem existente

**Arquivo:** `src/components/projects/detail/ProjectHeader.tsx`

- Exibir logo do projeto ao lado do titulo (se existir)
- Fallback para icone generico

---

## Parte 2: Geracao de Arte com IA

### 2.1 Edge Function: `generate-project-art`

**Input:**
```json
{
  "project_id": "uuid",
  "art_type": "banner" | "favicon" | "cover",
  "custom_prompt": "opcional - instrucoes adicionais"
}
```

**Logica:**
1. Buscar projeto (nome, cliente, template, logo_url)
2. Se logo_url existir, usar como referencia na geracao
3. Chamar `google/gemini-3-pro-image-preview` com prompt construido:
   - "Generate a professional [art_type] for a film production project called [name] for client [client]. Style: cinematic, modern, dark theme with cyan accents. Based on logo: [logo_url if exists]"
4. Salvar imagem no Storage: `project-files/art/{project_id}/{art_type}.png`
5. Atualizar coluna correspondente no projeto (banner_url, etc)
6. Retornar URL publica

### 2.2 Interface de Geracao

**Arquivo:** `src/components/projects/detail/tabs/OverviewTab.tsx`

Adicionar secao "Arte do Projeto" com:
- Preview do banner/cover atual (se existir)
- Botoes: "Gerar Banner com IA", "Gerar Favicon", "Gerar Capa"
- Loading states e toast de sucesso/erro

---

## Parte 3: Exportacao PDF Universal

### 3.1 Edge Function: `export-universal-pdf`

**Arquivo:** `supabase/functions/export-universal-pdf/index.ts`

**Input:**
```json
{
  "type": "report_360" | "tasks" | "project" | "project_overview",
  "id": "opcional - project_id para project/overview",
  "period": "opcional - 1m|3m|6m|1y para report_360",
  "filters": "opcional - filtros aplicados"
}
```

**Logica para cada tipo:**

#### report_360
1. Buscar projetos no periodo
2. Calcular metricas (entregues, abertos, atrasados, %)
3. Montar PDF com:
   - Capa com titulo "Relatorio 360" + periodo + data
   - KPIs em grid
   - Grafico de evolucao mensal (representacao visual)
   - Distribuicao por status
   - Lista resumida de projetos

#### tasks
1. Buscar tarefas do usuario
2. Agrupar por status e categoria
3. Montar PDF com:
   - Capa "Minhas Tarefas" + data
   - KPIs (total, pendentes, vencidas, concluidas hoje)
   - Lista por status (Backlog, Semana, Hoje, Concluido)
   - Destaques de tarefas vencidas

#### project
1. Buscar projeto completo com stages
2. Montar PDF com:
   - Capa com nome do projeto + logo (se existir)
   - Info do cliente, datas, valor
   - Etapas e status
   - Briefing
   - Metricas (saude, progresso)

#### project_overview
1. Buscar todos os projetos ativos
2. Montar PDF com:
   - Capa "Visao Geral de Projetos" + data
   - KPIs consolidados
   - Lista de projetos com status

### 3.2 Design Visual do PDF (Identidade SQUAD Film)

O PDF seguira a identidade visual da plataforma:

- **Cores:**
  - Background: #000000 (preto puro)
  - Texto primario: #FFFFFF
  - Texto secundario: #737373
  - Accent: #00A3D3 (squad-blue)
  
- **Tipografia:**
  - Helvetica Bold para titulos
  - Helvetica para corpo
  - Tamanhos: 24pt titulo, 14pt subtitulo, 10pt corpo

- **Layout:**
  - Margens: 50pt
  - Formato A4 (595.28 x 841.89)
  - Separadores visuais com linhas finas
  - KPIs em grid com icones representados por texto

- **Elementos:**
  - Logo SQUAD no cabecalho (se disponivel)
  - Data de geracao no rodape
  - Numeracao de paginas
  - Secoes com titulos em uppercase + accent color

### 3.3 Interface de Exportacao

#### Relatorio 360

**Arquivo:** `src/pages/reports/Report360Page.tsx`

Adicionar botao "Exportar PDF" no header que:
- Chama Edge Function com type='report_360' e periodo selecionado
- Mostra loading no botao
- Abre PDF em nova aba ao concluir

#### Tarefas

**Arquivo:** `src/pages/TasksPage.tsx`

Adicionar botao "Exportar PDF" no header que:
- Chama Edge Function com type='tasks'
- Exporta todas as tarefas do usuario

#### Projeto (Detail)

**Arquivo:** `src/components/projects/detail/ProjectHeader.tsx`

Adicionar opcao "Exportar PDF" no menu de acoes que:
- Chama Edge Function com type='project' e project_id
- Gera PDF completo do projeto

#### Overview de Projetos

**Arquivo:** `src/pages/projects/ProjectsListPage.tsx`

Adicionar botao "Exportar Visao Geral (PDF)" que:
- Chama Edge Function com type='project_overview'
- Gera relatorio consolidado

### 3.4 Hook de Exportacao Atualizado

**Arquivo:** `src/hooks/useExportPdf.ts`

Expandir hook existente com novas funcoes:
- `exportReport360(period)`
- `exportTasks()`
- `exportProject(projectId)`
- `exportProjectsOverview()`

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/generate-project-art/index.ts` | Geracao de arte com IA |
| `supabase/functions/export-universal-pdf/index.ts` | Exportacao PDF universal |
| `src/components/projects/ProjectLogoUpload.tsx` | Componente de upload de logo |
| `src/components/projects/ProjectArtSection.tsx` | Secao de arte do projeto no Overview |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useProjects.tsx` | Incluir logo_url, banner_url no tipo |
| `src/hooks/useExportPdf.ts` | Adicionar funcoes de exportacao |
| `src/components/projects/modals/NewProjectModal.tsx` | Campo de upload de logo |
| `src/components/projects/modals/EditProjectModal.tsx` | Campo de upload de logo |
| `src/components/projects/detail/ProjectHeader.tsx` | Exibir logo + botao exportar PDF |
| `src/components/projects/detail/tabs/OverviewTab.tsx` | Secao de arte do projeto |
| `src/pages/reports/Report360Page.tsx` | Botao exportar PDF |
| `src/pages/TasksPage.tsx` | Botao exportar PDF |
| `src/pages/projects/ProjectsListPage.tsx` | Botao exportar visao geral |
| `supabase/config.toml` | Registrar novas funcoes |

---

## Detalhes Tecnicos

### Upload de Imagem

```typescript
// Componente de upload
const handleUpload = async (file: File) => {
  const path = `logos/${projectId || 'temp'}/${Date.now()}.png`;
  const { error } = await supabase.storage
    .from('project-files')
    .upload(path, file, { upsert: true });
  
  const { data } = supabase.storage
    .from('project-files')
    .getPublicUrl(path);
  
  return data.publicUrl;
};
```

### Geracao de Arte (Prompt Template)

```typescript
const prompt = `
Generate a professional ${artType} for a creative production project.
Project: ${project.name}
Client: ${project.client_name}
Style: Cinematic, modern, dark theme (#000000 background), 
       cyan accent color (#00A3D3), minimalist.
${project.logo_url ? `Reference logo available at: ${project.logo_url}` : ''}
No text in the image.
Ultra high resolution, professional quality.
`;
```

### Estrutura do PDF

```text
+----------------------------------+
|  [Logo]  TITULO DO RELATORIO     |
|          Periodo / Data           |
+----------------------------------+
|                                  |
|  +--------+  +--------+  +------+|
|  | KPI 1  |  | KPI 2  |  | KPI 3||
|  +--------+  +--------+  +------+|
|                                  |
|  ==============================  |
|                                  |
|  SECAO 1                         |
|  - Item 1                        |
|  - Item 2                        |
|                                  |
|  SECAO 2                         |
|  ...                             |
|                                  |
+----------------------------------+
|  Gerado em DD/MM/YYYY | Pag X    |
+----------------------------------+
```

---

## Ordem de Implementacao

1. **Migration de banco** - Adicionar colunas logo_url, banner_url, cover_image_url
2. **Componente de upload** - ProjectLogoUpload com preview
3. **Edge Function generate-project-art** - Geracao com IA
4. **Edge Function export-universal-pdf** - Exportacao com design SQUAD
5. **Integracao na UI** - Botoes de exportar em cada pagina
6. **Atualizacao do hook useExportPdf**

---

## Resultado Esperado

Apos implementacao:
- Projetos podem ter uma imagem de logo/identidade
- IA pode gerar banner, favicon e capa baseados no projeto
- PDFs podem ser exportados de:
  - Relatorio 360 (com metricas do periodo)
  - Tarefas (visao pessoal)
  - Projeto individual (detalhado)
  - Overview de projetos (consolidado)
- Todos os PDFs seguem a identidade visual SQUAD Film (dark, cyan, minimalista)
