

## Plano: Regenerar Post + 30 Opções de Layout Baseadas em Referências

### O que será feito

**1. Botão "Regenerar Post"** na `PostResultView` — permite gerar novamente todo o conteúdo (texto + imagem) do post atual sem criar um novo, mantendo o mesmo ID.

**2. Seletor de Layout com 30 opções** — um painel visual no diálogo de geração e na PostResultView que exibe 30 templates de layout inspirados em estilos comuns do Instagram (minimalista, bold text, gradient, split, etc). As referências já salvas em `instagram_references` serão consultadas para enriquecer o prompt de geração visual.

### Implementação

**A. PostResultView.tsx — Botão Regenerar**
- Adicionar botão "Regenerar" na barra de ações (ao lado de Download PNG / Export ZIP)
- Ao clicar, abre mini-dialog com opção de escolher layout
- Chama a mesma lógica de `handleGeneratePost` (AI text + generate-image) mas faz UPDATE no post existente ao invés de INSERT

**B. Novo componente: `LayoutPicker.tsx`**
- Grid visual com 30 opções de layout, cada uma com:
  - Mini thumbnail (CSS-only ou SVG placeholder representando o estilo)
  - Nome do layout (ex: "Bold Central", "Gradient Overlay", "Split Text/Image", "Cinematic Bars", etc.)
  - Prompt modifier que será injetado na geração de imagem
- 30 layouts pré-definidos cobrindo estilos como:
  - Tipografia bold central, minimalista, gradient, duotone, editorial, magazine, storytelling, quote card, data-driven, comparison, before/after, polaroid, film grain, neon glow, pastel soft, dark moody, high contrast, retro vintage, futuristic, organic/nature, geometric, collage, frame-in-frame, spotlight, diagonal split, horizontal bars, vertical bars, mosaic grid, watercolor, glitch art

**C. Integração com Referências existentes**
- No `LayoutPicker`, buscar `instagram_references` do usuário
- Mostrar seção "Baseado nas suas referências" no topo com thumbs das referências
- Ao selecionar uma referência, seu estilo visual (tags, media_type, note) é injetado como contexto extra no prompt de geração de imagem

**D. Diálogo de Geração (InstagramEnginePage.tsx)**
- Adicionar `LayoutPicker` ao diálogo de geração existente
- O layout selecionado adiciona um `layout_style` ao prompt enviado ao `generate-image`

**E. Edge Function `generate-image/index.ts`**
- Nenhuma mudança estrutural — o layout style será injetado via prompt text (já suportado)

### Arquivos a criar/editar

| Arquivo | Ação |
|---|---|
| `src/components/instagram-engine/LayoutPicker.tsx` | **Criar** — 30 layouts + referências |
| `src/components/instagram-engine/PostResultView.tsx` | **Editar** — botão Regenerar + integração LayoutPicker |
| `src/pages/InstagramEnginePage.tsx` | **Editar** — LayoutPicker no diálogo + layout no prompt |

