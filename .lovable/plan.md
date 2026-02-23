

# Migrar TODOS os PDFs para Gemini HTML + Design SQUAD Swiss A4

## Situacao Atual

Existem **8 edge functions** de exportacao de PDF que ainda usam `SquadPdfBuilder` (pdf-lib binario). Apenas `project` e `project_overview` ja usam Gemini HTML.

### Funcoes a migrar para Gemini HTML:

| Funcao | Tipo | Status Atual |
|--------|------|-------------|
| `export-pdf` (report_360) | Relatorio 360 | pdf-lib |
| `export-pdf` (tasks) | Quadro de Tarefas | pdf-lib |
| `export-pdf` (finance) | Financeiro | pdf-lib |
| `export-panorama-pdf` | Panorama do Projeto | pdf-lib |
| `export-finance-pdf` | Financeiro (standalone) | pdf-lib |
| `export-focus-pdf` | Plano de Foco | pdf-lib |
| `export-campaign-pdf` | Campanha | pdf-lib |
| `export-content-pdf` | Conteudo | pdf-lib |
| `export-creative-pdf` | Criativo (Studio/Pacote) | pdf-lib |

## Abordagem

Cada funcao sera reescrita para:
1. Buscar dados do banco normalmente
2. Montar um payload JSON com os dados
3. Enviar ao Gemini com o CSS SQUAD Swiss e instrucoes precisas de estrutura HTML
4. Retornar `{ success: true, html, slug }` ao frontend
5. O frontend converte via `iframe.contentWindow.print()` (ja implementado no `pdfExportService.ts`)

### CSS padrao para TODOS os PDFs (A4 portrait com margens ideais)

Sera adicionado `@media print` com `@page { size: A4; margin: 20mm 15mm; }` e `print-color-adjust: exact` para garantir fidelidade do fundo preto e cores no PDF.

## Detalhes Tecnicos

### 1. `export-pdf/index.ts` - Migrar report_360, tasks, finance

- Criar 3 novas funcoes: `buildReport360Html`, `buildTasksHtml`, `buildFinanceHtml`
- Cada uma busca dados, monta payload JSON, chama Gemini com prompt especifico
- Remover o bloco "PDF-binary exports (legacy pdf-lib)" do handler principal
- Todos os tipos agora retornam `{ html, slug }` em vez de `{ bytes, slug }`
- Remover upload para storage e logica de signed URL (o HTML e renderizado client-side)
- Atualizar a condicional no handler para incluir todos os tipos no fluxo HTML

### 2. `export-panorama-pdf/index.ts` - Migrar para HTML

- Criar `buildPanoramaHtml` com Gemini
- Manter a logica de `panorama_snapshots` (mas salvar o HTML em vez do PDF binario, ou gerar print-to-PDF no server se snapshot precisar de URL)
- Como snapshots precisam de URL publica, manter upload do HTML como arquivo e gerar signed URL

### 3. `export-finance-pdf/index.ts` - Migrar para HTML

- Reescrever para retornar HTML via Gemini
- Remover SquadPdfBuilder e upload para storage

### 4. `export-focus-pdf/index.ts` - Migrar para HTML

- Adaptar para gerar HTML em formato paisagem (landscape) conforme ja definido no design do Modo Foco
- Retornar HTML ao cliente

### 5. `export-campaign-pdf/index.ts` - Migrar para HTML

- Gerar HTML com secoes de conceito, roteiros, ideias, legendas
- Retornar HTML ao cliente

### 6. `export-content-pdf/index.ts` - Migrar para HTML

- Gerar HTML com copy, roteiro, checklist, comentarios
- Retornar HTML ao cliente

### 7. `export-creative-pdf/index.ts` - Migrar para HTML

- Gerar HTML com briefing, conceito, roteiro, storyboard, shotlist, moodboard
- Retornar HTML ao cliente

### 8. `src/services/pdfExportService.ts` - Atualizar frontend

- As funcoes `invokeAndDownload` (usadas por creative, campaign, content, focus) precisam ser atualizadas para aceitar resposta HTML
- Adicionar tratamento: se `data.html` existe, usar `convertHtmlToPdf`; senao, fallback para download por URL
- Garantir que `convertHtmlToPdf` usa margens A4 corretas no `@media print`

### 9. `src/services/pdfExportService.ts` - Melhorar conversao HTML

- Atualizar `convertHtmlToPdf` para injetar CSS de `@media print` com `@page { size: A4; margin: 20mm 15mm; }` caso o HTML nao contenha

### Estrutura do prompt Gemini (padrao para todos)

Cada tipo tera um system prompt com:
- O CSS SQUAD completo (SQUAD_REPORT_CSS) 
- `@media print` com `size: A4; margin: 20mm 15mm;`
- Estrutura exata: header com logo "SQ", hero section, KPI cards, tabelas, footer "SQUAD FILM | 2026"
- Instrucao para retornar APENAS HTML sem markdown code blocks

### Panorama especial

O `export-panorama-pdf` salva snapshots com URL publica. A estrategia sera:
- Gerar HTML via Gemini
- Salvar o HTML como arquivo `.html` no storage (em vez de .pdf)
- O snapshot tera `pdf_url` apontando para o HTML
- Alternativa: continuar retornando HTML ao frontend, e o snapshot registra apenas metadata

## Sequencia de implementacao

1. Atualizar `export-pdf/index.ts` (report_360, tasks, finance -> HTML via Gemini)
2. Atualizar `export-finance-pdf/index.ts` 
3. Atualizar `export-focus-pdf/index.ts`
4. Atualizar `export-campaign-pdf/index.ts`
5. Atualizar `export-content-pdf/index.ts`
6. Atualizar `export-creative-pdf/index.ts`
7. Atualizar `export-panorama-pdf/index.ts`
8. Atualizar `pdfExportService.ts` no frontend para tratar HTML em todas as funcoes standalone
9. Deploy de todas as edge functions

