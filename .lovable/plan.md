
## Problema identificado

Na galeria, os assets extraídos de PDFs mostram uma imagem quebrada (X vermelho) porque:

1. **Edge function `extract-visual-assets`**: O campo `thumb_url` só é preenchido para imagens (`isImage ? urlData.publicUrl : null`). PDFs ficam com `thumb_url: null`.
2. **Sub-assets de elementos detectados** (logo, assinatura, paleta, etc.) também herdam esse `null` para PDFs.
3. **`AssetCard` no `GalleryTab.tsx`**: Tenta renderizar `<img src={displayUrl}>` mesmo quando `displayUrl` é `null` ou inválido, resultando na imagem quebrada.

## Solução em duas frentes

### 1. Edge function — gerar thumbnail para PDFs via IA

Quando o arquivo é um PDF, solicitar ao Gemini que retorne uma **imagem de preview** usando `modalities: ["image", "text"]`. Isso gera um thumbnail representativo do documento que é salvo no storage e usado como `thumb_url`.

Se a geração de imagem falhar ou o PDF for grande demais, usar um fallback elegante no frontend.

### 2. Frontend `GalleryTab.tsx` — melhorar o AssetCard

- **Remover a imagem quebrada**: Envolver o `<img>` em `try/catch` via `onError` já existe, mas o problema é que `src` recebe uma string vazia ou inválida sendo renderizada mesmo assim.
- **Fallback visual rico**: Quando não há thumbnail, exibir um placeholder elegante com ícone do tipo de arquivo, nome do arquivo e cor de fundo baseada na categoria — em vez da imagem quebrada atual.
- **Para PDFs**: Mostrar um card visual com gradiente + ícone PDF + nome do documento (sem tentar carregar imagem).

### Arquivos a modificar

**`supabase/functions/extract-visual-assets/index.ts`**:
- Após salvar o arquivo no storage, se for PDF e tamanho <= 3MB base64, fazer uma chamada ao Gemini com `modalities: ["image", "text"]` para gerar um preview visual
- Salvar esse preview no storage como `thumb_{timestamp}.png`
- Usar a URL pública do preview como `thumb_url` do asset

**`src/components/projects/detail/tabs/GalleryTab.tsx`**:
- Corrigir o `AssetCard` para não renderizar `<img>` quando `displayUrl` é falsy
- Melhorar o placeholder sem thumbnail: mostrar gradiente de fundo baseado na categoria + ícone grande + extensão do arquivo
- Para assets com `preview_url` ou `og_image_url`, usar essas como fallback antes do placeholder

### Fluxo corrigido

```text
PDF enviado
  ↓
Edge function: salva PDF no storage
  ↓
Se PDF <= 3MB: pede ao Gemini para gerar imagem preview
  ↓
Gemini retorna imagem base64 do preview
  ↓
Salva preview no storage como thumb_xxx.png
  ↓
thumb_url = URL pública do preview
  ↓
Galeria: mostra o preview como thumbnail ✅

Se PDF > 3MB ou geração falha:
  ↓
thumb_url = null
  ↓
Galeria: mostra placeholder elegante (sem imagem quebrada) ✅
```

### Detalhes técnicos

**No edge function**, a geração de thumbnail fica assim:
```typescript
// Para PDFs, gera preview via Gemini image generation
if (isPdf && fileData.base64.length <= 3 * 1024 * 1024) {
  const previewResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: [
        { type: 'text', text: 'Gere uma imagem de preview/thumbnail deste PDF' },
        { type: 'image_url', image_url: { url: `data:application/pdf;base64,...` } }
      ]}],
      modalities: ['image', 'text'],
    })
  });
  // extrai base64 da imagem gerada, salva no storage
}
```

**No `AssetCard`**, o placeholder sem thumbnail:
```tsx
// Em vez de tentar renderizar <img> com src vazio:
{displayUrl ? (
  <img src={displayUrl} onError={...} />
) : (
  <div className={cn("w-full h-full flex flex-col items-center justify-center gap-2", categoryBg)}>
    {getAssetTypeIcon(asset)}  // ícone grande
    <span>{asset.file_ext?.toUpperCase() || asset.asset_type}</span>
  </div>
)}
```
