
# Dois problemas distintos a corrigir

## Problema 1 — Paleta da SQUAD misturada com a do cliente

### Causa raiz
O `BrandKitPanel` em `BrandIdentityTab.tsx` agrega `color_palette` de **todos** os assets processados pela IA, sem filtrar a origem. Quando o usuário enviou um PDF de apresentação da SQUAD Film (com preto + azul #009CCA), a IA extraiu essas cores e as exibiu junto às do cliente real.

### Solução — Filtro anti-SQUAD + UI de separação

**Parte A — Filtrar as cores do sistema (SQUAD)**

Definir uma lista de "cores da plataforma" a serem excluídas da paleta do cliente:

```typescript
const SQUAD_BRAND_COLORS = [
  '#009cca', '#009CCA', // SQUAD Blue
  '#000000', '#0f0f11', '#0a0a0a', // SQUAD Black variants
  // Também filtrar por similaridade HSL se muito próximas
];
```

Além disso, filtrar também por nome da marca detectada: se `ai_entities.brand_name` conter "squad", "squad film", o asset é da própria plataforma — excluir das cores do cliente.

**Parte B — Separar paleta por origem**

Na agregação de cores em `BrandIdentityTab`, separar dois grupos:
- **Paleta do cliente** = assets cujo `ai_entities.brand_name` NÃO é SQUAD e cujas cores não são as SQUAD
- **Paleta interna** = assets SQUAD (mostrar separadamente, com badge "Plataforma")

**Parte C — UI no BrandKitPanel**

Mostrar na coluna de paleta:
```
[ PALETA DO CLIENTE ]
🎨 5 cores detectadas — (nome da marca)
■ ■ ■ ■ ■

[ Se houver cores SQUAD detectadas — aviso ]
⚠️  Cores da plataforma SQUAD foram excluídas desta paleta.
```

---

## Problema 2 — Thumbnails/previews não aparecem

### Causa raiz

O bucket `project-files` é **privado**. A função `extract-visual-assets/index.ts` salva a imagem original em `project-files` e usa `getPublicUrl()` como `thumb_url` — mas URLs públicas de buckets privados **não funcionam** no browser.

A tabela mostra a imagem em `AssetThumbnail` usando `asset.thumb_url` diretamente no `<img src>`, que falha silenciosamente.

### Solução em duas partes

**Parte A — Para novos uploads via `extract-visual-assets`**

Ao salvar o arquivo original em `project-files`, **também salvar uma cópia pública no bucket `asset-thumbs`** (que já é público):

```typescript
// Após upload em project-files:
const thumbStoragePath = `${project_id}/thumbs/${ts}_${sanitizedName}`;
await supabase.storage
  .from('asset-thumbs')  // bucket público ✓
  .upload(thumbStoragePath, bytes, { contentType: fileData.mime_type });

const { data: thumbUrl } = supabase.storage
  .from('asset-thumbs')
  .getPublicUrl(thumbStoragePath);
// Usar thumbUrl no campo thumb_url do registro
```

Para imagens grandes (>2MB), gerar uma versão reduzida via Gemini antes de salvar no bucket público.

**Parte B — Para assets já existentes com thumb_url quebrada**

No `AssetThumbnail` e `BrandAssetThumbnail`, quando `thumb_url` falha (`onError`), gerar uma **URL assinada on-demand** via `supabase.storage.createSignedUrl()` e substituir:

```typescript
const [resolvedUrl, setResolvedUrl] = useState<string | null>(asset.thumb_url);

const handleError = async () => {
  if (asset.storage_path) {
    const { data } = await supabase.storage
      .from(asset.storage_bucket || 'project-files')
      .createSignedUrl(asset.storage_path, 3600);
    if (data?.signedUrl) setResolvedUrl(data.signedUrl);
    else setImgError(true);
  } else {
    setImgError(true);
  }
};
```

Isso garante que **qualquer imagem com storage_path privado** funcione, mesmo para assets já existentes.

---

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/components/projects/detail/tabs/BrandIdentityTab.tsx` | Filtrar cores SQUAD, separar paleta do cliente, badge de aviso quando cores são excluídas |
| `src/components/projects/detail/tabs/GalleryTab.tsx` | `AssetThumbnail` — fallback com signed URL on-demand quando `thumb_url` falha |
| `supabase/functions/extract-visual-assets/index.ts` | Salvar thumb em bucket público `asset-thumbs` para imagens, não apenas para PDFs |

---

## Detalhes técnicos — Filtro de cores SQUAD

A lista de cores a filtrar usa comparação case-insensitive no HEX e também filtra por nome da marca:

```typescript
const SQUAD_COLORS_FILTER = new Set([
  '#009cca', '#000000', '#0f0f11', '#0a0a0a', '#ffffff',
]);

const SQUAD_BRAND_NAMES = ['squad', 'squad film', 'squadfilm'];

function isSquadAsset(asset: ProjectAsset): boolean {
  const brandName = (asset.ai_entities as any)?.brand_name?.toLowerCase() || '';
  return SQUAD_BRAND_NAMES.some(n => brandName.includes(n));
}

function filterClientColors(colors: string[]): string[] {
  return colors.filter(c => !SQUAD_COLORS_FILTER.has(c.toLowerCase()));
}
```

Cores do cliente = assets não-SQUAD, com as cores brutas filtradas pelas SQUAD_COLORS.

---

## Ordem de implementação

1. **`extract-visual-assets/index.ts`** — salvar thumb em bucket público (fix para uploads futuros)
2. **`GalleryTab.tsx`** — signed URL fallback em `AssetThumbnail` (fix para assets existentes e futuros)
3. **`BrandIdentityTab.tsx`** — filtro SQUAD + paleta separada do cliente
