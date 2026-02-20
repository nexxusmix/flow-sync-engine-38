
## Download em lote (ZIP) e individual — Galeria IA e Identidade Visual

### Contexto

Os assets de arquivo ficam no bucket privado `project-files`. Para download é necessário gerar uma **signed URL** com expiração (mesma técnica já usada no PDF viewer). Assets do tipo `link` (YouTube, Vimeo, etc.) não têm arquivo para baixar.

O download ZIP no browser é feito **sem biblioteca externa**: `fetch()` os blobs em paralelo → empacota com a API nativa **`CompressionStream`** usando formato zip simulado, ou, mais simples e confiável, via **`<a download>`** individual para cada arquivo. A alternativa mais robusta para ZIP real é usar a lib **`fflate`** (já disponível no ecossistema, sem instalação extra necessária via CDN/import), mas como não está nas dependências, usaremos a abordagem de **download sequencial de arquivos** para o lote (melhor UX que pedir lib nova).

> **Estratégia de download em lote**: Dado que `fflate` não está instalado, faremos o download "em lote" gerando signed URLs para todos os selecionados e disparando os downloads automaticamente em série com pequeno intervalo (técnica de `<a>` programático com `setTimeout`). Isso evita bloqueio de popup do browser e não requer nova dependência.

---

### Comportamento esperado

**Download individual** (card normal, sem modo seleção):
- Botão de download já existe em alguns cards — garantir que todos os `AssetCard` (Gallery) e `LogoCard` (Identity) tenham um botão de download no menu de ações
- Gera signed URL → dispara `<a download>` → baixa o arquivo com o nome original

**Download em lote** (modo seleção ativo):
- Novo botão "Baixar" na barra de ação (ao lado de "Excluir")
- Estado `isDownloading` com spinner
- Para cada ID selecionado: gera signed URL e dispara download com delay de 300ms entre cada um (evita bloqueio do browser)
- Assets do tipo `link` são ignorados no lote (sem arquivo)
- Toast de progresso: "Baixando N arquivo(s)..."

---

### Arquivos a modificar

#### 1. `GalleryTab.tsx`

**Novo ícone**: `Download` já importado ✓, adicionar `DownloadCloud`.

**Handler de download individual** (dentro de `AssetCard`):
```typescript
const handleDownload = async () => {
  if (!asset.storage_path) return;
  const { data } = await supabase.storage
    .from(asset.storage_bucket || 'project-files')
    .createSignedUrl(asset.storage_path, 300);
  if (data?.signedUrl) {
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = asset.file_name || asset.title;
    a.click();
  }
};
```

**Botão de download no `AssetCard`** — adicionado no rodapé do card (área de metadados), visível no dropdown/menu de ações do card quando `selectionMode=false`:
```tsx
{asset.source_type === 'file' && (
  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleDownload}>
    <Download className="w-3.5 h-3.5" />
  </Button>
)}
```

**Handler de download em lote** no `GalleryTab`:
```typescript
const [isDownloading, setIsDownloading] = useState(false);

const handleBulkDownload = async () => {
  const toDownload = [...selectedIds]
    .map(id => assets.find(a => a.id === id))
    .filter(a => a && a.source_type === 'file' && a.storage_path);
  
  if (toDownload.length === 0) {
    toast.info('Nenhum arquivo para baixar (links são ignorados)');
    return;
  }
  
  setIsDownloading(true);
  toast.info(`Baixando ${toDownload.length} arquivo(s)...`);
  
  for (let i = 0; i < toDownload.length; i++) {
    const asset = toDownload[i];
    const { data } = await supabase.storage
      .from(asset.storage_bucket || 'project-files')
      .createSignedUrl(asset.storage_path!, 300);
    if (data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = asset.file_name || asset.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (i < toDownload.length - 1) await new Promise(r => setTimeout(r, 400));
    }
  }
  setIsDownloading(false);
  toast.success(`${toDownload.length} arquivo(s) baixado(s)`);
};
```

**Botão na barra de seleção** — entre "Desmarcar tudo" e "Excluir":
```tsx
<Button
  size="sm"
  variant="outline"
  onClick={handleBulkDownload}
  disabled={selectedIds.size === 0 || isDownloading}
  className="h-8 text-xs gap-1.5"
>
  {isDownloading 
    ? <Loader2 className="w-3 h-3 animate-spin" /> 
    : <Download className="w-3 h-3" />}
  Baixar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
</Button>
```

---

#### 2. `BrandIdentityTab.tsx`

Mesma lógica espelhada:

**Handler de download individual** (dentro de `LogoCard`) — já existe `handleDownload` usando `downloadUrl` (thumb_url/og_image_url). Melhorar para usar o `storage_path` quando disponível (arquivo original com melhor qualidade):
```typescript
const handleDownload = async () => {
  // Prefer original file via signed URL
  if (asset.storage_path) {
    const { data } = await supabase.storage
      .from(asset.storage_bucket || 'project-files')
      .createSignedUrl(asset.storage_path, 300);
    if (data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = asset.file_name || asset.title;
      a.click();
      return;
    }
  }
  // Fallback to thumb/preview URL
  if (downloadUrl) {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = asset.file_name || asset.title;
    a.target = '_blank';
    a.click();
  }
};
```

**Handler de download em lote** no `BrandIdentityTab`:
```typescript
const [isDownloading, setIsDownloading] = useState(false);

const handleBulkDownload = async () => {
  const toDownload = [...selectedIds]
    .map(id => allVisibleAssets.find(a => a.id === id))
    .filter(a => a && a.storage_path);
  
  if (toDownload.length === 0) {
    toast.info('Nenhum arquivo para baixar');
    return;
  }
  
  setIsDownloading(true);
  toast.info(`Baixando ${toDownload.length} arquivo(s)...`);
  
  for (let i = 0; i < toDownload.length; i++) {
    const asset = toDownload[i];
    const { data } = await supabase.storage
      .from(asset.storage_bucket || 'project-files')
      .createSignedUrl(asset.storage_path!, 300);
    if (data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = asset.file_name || asset.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (i < toDownload.length - 1) await new Promise(r => setTimeout(r, 400));
    }
  }
  setIsDownloading(false);
  toast.success(`${toDownload.length} arquivo(s) baixado(s)`);
};
```

**Botão na barra de seleção** de `BrandIdentityTab` — mesma posição, entre "Desmarcar tudo" e "Excluir".

---

### Resumo das mudanças

| Arquivo | O que muda |
|---|---|
| `GalleryTab.tsx` | `isDownloading` state, `handleBulkDownload`, `handleDownload` no `AssetCard`, botão "Baixar" na barra de seleção, ícone `DownloadCloud` importado |
| `BrandIdentityTab.tsx` | `isDownloading` state, `handleBulkDownload`, melhora do `handleDownload` no `LogoCard` (usa storage_path), botão "Baixar" na barra de seleção, `supabase` importado |

**Sem novas dependências, sem migrations, sem edge functions.**

---

### Nota sobre links

Assets do tipo `source_type = 'link'` (YouTube, Vimeo, Google Drive) não têm `storage_path` e são automaticamente ignorados no download em lote. O contador no botão reflete o total de selecionados, mas o toast informa quantos arquivos foram de fato baixados.
