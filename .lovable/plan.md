
## Pipeline IA Completo para Assets — Análise com GPT + Remoção de Fundo + Geração de Padrão

### O que será feito

Quando um asset de imagem é enviado (especialmente logos/identidade visual), o `process-asset` vai executar automaticamente 3 estágios em sequência:

1. **Análise visual com GPT (multimodal)** — o modelo recebe a imagem real (base64) e gera título, descrição, tags, tipo de elemento, paleta de cores detectada e nome de marca. Upgrade do modelo de `gemini-2.5-flash-lite` (só texto) para `google/gemini-2.5-flash` com visão.

2. **Remoção de fundo e geração de PNG recortado** — via `google/gemini-3-pro-image-preview` (Nano banana pro), enviamos a imagem com o prompt "Remove o fundo desta imagem e retorne apenas o elemento principal em PNG com fundo transparente". O resultado é salvo no bucket `asset-thumbs` (público) como `{asset_id}_cutout.png` e armazenado em `preview_url`.

3. **Geração de padrão/textura com o logo** — após o recorte, o Nano banana pro gera um padrão de identidade visual usando o logo recortado como elemento (ex: "Crie um padrão tile seamless com este logo sobre fundo escuro, estilo brand pattern"). Salvo em `asset-thumbs` como `{asset_id}_pattern.png` e armazenado em `og_image_url`.

---

### Arquitetura de Dados

Os campos `preview_url` e `og_image_url` que já existem na tabela `project_assets` são reaproveitados:

| Campo | Conteúdo |
|---|---|
| `thumb_url` | URL pública do arquivo original (imagem original) |
| `preview_url` | PNG recortado sem fundo (cutout) |
| `og_image_url` | Padrão/textura gerado com o logo |
| `ai_entities` | JSON com `element.type`, `color_palette`, `brand_name`, `fonts` |

Sem necessidade de migração de banco de dados — todos os campos já existem.

---

### Fluxo técnico

```text
Upload do arquivo
       │
       ▼
uploadSingleFile() → insert project_assets (status: "processing")
       │
       ▼ (se aiProcess=true OU category="brand"/"identity")
supabase.functions.invoke('process-asset', { asset_id })
       │
       ▼
[ESTÁGIO 1] Busca asset + gera signed URL do storage privado (300s)
       │       Faz fetch da imagem → base64
       │       Chama gemini-2.5-flash com visão (imagem + prompt)
       │       → updates: ai_title, ai_summary, ai_tags, ai_entities
       │         (element.type, color_palette, brand_name)
       │
       ▼ (apenas se asset_type="image")
[ESTÁGIO 2] Remoção de fundo — gemini-3-pro-image-preview
       │       Prompt: "Remove background, return only main element
       │                as PNG with transparent background"
       │       → decode base64 result
       │       → upload para asset-thumbs/{asset_id}_cutout.png
       │       → updates.preview_url = URL pública do cutout
       │
       ▼ (apenas se category="brand" ou element.type in [logo, assinatura])
[ESTÁGIO 3] Geração de padrão — gemini-3-pro-image-preview
       │       Prompt: "Crie um padrão tile seamless com este elemento
       │                como ícone repetido sobre fundo escuro"
       │       → upload para asset-thumbs/{asset_id}_pattern.png
       │       → updates.og_image_url = URL pública do pattern
       │
       ▼
status = "ready" → update project_assets
```

---

### Arquivos a modificar

#### 1. `supabase/functions/process-asset/index.ts` (principal)

**Estágio 1 — Análise visual GPT/Gemini multimodal:**

Substituir o modelo de `gemini-2.5-flash-lite` por `gemini-2.5-flash` com payload de visão. Para imagens, fazer `fetch` da signed URL, converter para base64 e incluir como `image_url` no content array:

```typescript
// Fetch image as base64 for vision
let imageBase64: string | null = null;
if (asset.source_type === "file" && asset.asset_type === "image" && asset.storage_path) {
  const { data: signedData } = await sb.storage
    .from("project-files")
    .createSignedUrl(asset.storage_path, 300);
  if (signedData?.signedUrl) {
    const imgResp = await fetch(signedData.signedUrl);
    const buffer = await imgResp.arrayBuffer();
    imageBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }
}

// Build multimodal message
const userContent: any[] = imageBase64
  ? [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: `data:${asset.mime_type || 'image/png'};base64,${imageBase64}` } },
    ]
  : prompt;

const model = imageBase64 ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite";
```

O prompt de análise também é enriquecido para extrair:
- `element.type`: logo | assinatura | carimbo | foto | ilustracao | paleta | outro
- `color_palette`: array de hex colors detectadas na imagem
- `brand_name`: nome da marca se identificado
- `fonts`: fontes identificadas (se houver)

**Estágio 2 — Remoção de fundo (cutout):**

```typescript
if (imageBase64 && asset.asset_type === "image") {
  const cutoutResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-pro-image-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Remove the background from this image completely. Return only the main element (logo, icon, or subject) with a fully transparent background. Output as PNG." },
          { type: "image_url", image_url: { url: `data:${asset.mime_type || 'image/png'};base64,${imageBase64}` } },
        ],
      }],
      modalities: ["image", "text"],
    }),
  });

  if (cutoutResp.ok) {
    const cutoutData = await cutoutResp.json();
    const cutoutB64 = cutoutData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (cutoutB64) {
      // Strip data URL prefix
      const base64Data = cutoutB64.replace(/^data:image\/\w+;base64,/, "");
      const binary = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const { data: uploadData } = await sb.storage
        .from("asset-thumbs")
        .upload(`${asset_id}_cutout.png`, binary.buffer, {
          contentType: "image/png",
          upsert: true,
        });
      if (uploadData) {
        const { data: pubUrl } = sb.storage.from("asset-thumbs").getPublicUrl(`${asset_id}_cutout.png`);
        updates.preview_url = pubUrl.publicUrl;
      }
    }
  }
}
```

**Estágio 3 — Geração de padrão (apenas se logo ou category=brand):**

```typescript
const elementType = updates.ai_entities?.element?.type || (asset.ai_entities as any)?.element?.type;
const isBrandAsset = ["logo", "assinatura", "carimbo"].includes(elementType) 
  || asset.category === "brand";

if (isBrandAsset && updates.preview_url && cutoutBase64) {
  const patternResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    ...body com gemini-3-pro-image-preview e o cutout como base64...
    prompt: "Create a seamless tile brand pattern using this logo/element repeated multiple times over a dark background. Professional branding style, modern and elegant."
  });
  // upload para asset-thumbs/{asset_id}_pattern.png → updates.og_image_url
}
```

**Proteção contra falhas:** cada estágio tem seu próprio try/catch, garantindo que uma falha no cutout não bloqueie o enriquecimento de metadados.

---

#### 2. `src/stores/useBackgroundUploadStore.ts`

Alterar a lógica de disparo do `process-asset`: hoje ele só é chamado quando `item.aiProcess === true`. Adicionar lógica para chamar automaticamente quando a categoria for `brand` ou `identity`:

```typescript
const shouldProcess = item.aiProcess 
  || ['brand', 'identity', 'logo'].includes(item.category?.toLowerCase() || '');

if (shouldProcess) {
  await supabase.functions.invoke('process-asset', { body: { asset_id: data.id } });
}
```

---

#### 3. `src/components/projects/detail/tabs/BrandIdentityTab.tsx`

**Novo card "Variações Geradas"** — Quando um `logoAsset` tem `preview_url` (cutout) ou `og_image_url` (pattern), o `LogoCard` exibe um painel expandido com as variações geradas:

```tsx
{/* Variações IA */}
{(asset.preview_url || asset.og_image_url) && (
  <div className="mt-3 grid grid-cols-2 gap-2">
    {asset.preview_url && (
      <div className="rounded-lg bg-white/5 border border-border/20 p-2 flex flex-col items-center gap-1">
        <img src={asset.preview_url} className="h-16 object-contain" />
        <span className="text-[9px] text-muted-foreground">Recorte PNG</span>
      </div>
    )}
    {asset.og_image_url && (
      <div className="rounded-lg bg-white/5 border border-border/20 p-2 flex flex-col items-center gap-1">
        <img src={asset.og_image_url} className="h-16 object-cover rounded" />
        <span className="text-[9px] text-muted-foreground">Padrão</span>
      </div>
    )}
  </div>
)}
```

**Indicador de processamento:** quando `asset.status === "processing"`, exibir um spinner sobre o thumbnail com texto "Gerando variações IA...".

---

#### 4. `src/components/projects/detail/tabs/GalleryTab.tsx`

**Botão "Reprocessar com IA"** no menu de contexto de cada `AssetCard` de imagem — chama `supabase.functions.invoke('process-asset', { body: { asset_id: asset.id } })` e invalida a query de assets:

```tsx
{asset.asset_type === 'image' && (
  <DropdownMenuItem onClick={handleReprocess}>
    <Sparkles className="w-4 h-4 mr-2" />
    Reprocessar com IA
  </DropdownMenuItem>
)}
```

---

### Resumo dos arquivos e mudanças

| Arquivo | Mudança |
|---|---|
| `supabase/functions/process-asset/index.ts` | Reescrever pipeline: visão multimodal, cutout (gemini-3-pro-image-preview), pattern (gemini-3-pro-image-preview), upload para asset-thumbs |
| `src/stores/useBackgroundUploadStore.ts` | Auto-trigger process-asset para category=brand/identity |
| `src/components/projects/detail/tabs/BrandIdentityTab.tsx` | Exibir variações geradas (cutout + pattern) no LogoCard, spinner de processamento |
| `src/components/projects/detail/tabs/GalleryTab.tsx` | Botão "Reprocessar com IA" no menu do AssetCard |

**Sem novas dependências, sem migrations de banco de dados.** O bucket `asset-thumbs` já existe e é público.

### Considerações de performance

- O processo inteiro (análise + cutout + pattern) pode levar 15–45 segundos por imagem dependendo do tamanho
- A edge function roda de forma assíncrona — o asset fica com `status: "processing"` enquanto aguarda
- Os estágios 2 e 3 (imagem→imagem) são os mais pesados; podem ser saltados se a API retornar erro 429 sem bloquear o estágio 1
- Imagens grandes (>5MB) são convertidas para base64 completo — pode gerar payloads grandes, mas é suportado pelo gateway
