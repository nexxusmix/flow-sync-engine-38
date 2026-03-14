

# Portal do Cliente — Visualização Fullscreen + Download Individual/Lote

## Problema
O lightbox atual (`MaterialLightbox.tsx`) não suporta PDFs, não tem botão de download visível, e não há mecanismo de seleção em lote para download múltiplo.

## Plano

### 1. Reescrever `MaterialLightbox.tsx`
- Adicionar **botão de download** visível no header do lightbox (ao lado do botão fechar)
- Suportar preview por tipo:
  - **Imagens**: `<img>` fullscreen (já funciona)
  - **Vídeos**: player nativo ou YouTube embed (já funciona)
  - **PDFs**: `<iframe src="file_url">` ou `<object>` para renderizar inline
  - **Outros arquivos**: fallback com ícone + botão download
- Corrigir badges com cores hardcoded (`emerald`, `amber`) → tokens semânticos

### 2. Adicionar botão de download rápido no `PortalMaterialCard.tsx`
- Botão de download no hover do card (similar ao "Solicitar Ajuste")
- Ação direta sem abrir o lightbox — `<a href={file_url} download>`
- Só aparece quando `file_url` existe

### 3. Seleção em lote + download batch no `PortalMaterialsTab.tsx`
- Adicionar estado de seleção múltipla com checkboxes nos cards
- Botão "Selecionar" no header que ativa o modo de seleção
- Toolbar flutuante quando há itens selecionados: "X selecionados — Baixar todos"
- Download em lote: iterar pelos selecionados e disparar downloads sequenciais (via `<a download>` programático)

### Arquivos alterados
- `src/components/client-portal/portal-materials/MaterialLightbox.tsx` — PDF preview, download button
- `src/components/client-portal/portal-materials/PortalMaterialCard.tsx` — quick download button
- `src/components/client-portal/portal-materials/PortalMaterialsTab.tsx` — batch selection + bulk download

### Detalhes técnicos
- PDF detection: `file_url?.match(/\.pdf$/i)` ou `type?.includes('pdf')`
- Bulk download: criar links `<a>` temporários com `download` attribute e `.click()` programático com delay entre cada
- Nenhuma tabela nova necessária
- Nenhuma dependência nova

