
# Plano: Grid de Materiais com Thumbnails e Player na Aba Visão Geral

## Objetivo
Adicionar uma galeria visual com grid de materiais (vídeos/arquivos) com thumbnails, títulos e player integrado logo abaixo do título "Visão Geral" no portal do cliente.

---

## Estrutura Atual
A aba Overview (`PortalOverviewPremium`) tem:
1. Cards de progresso (3 colunas)
2. Seção "Materiais Disponíveis" (lista simples com ícones)
3. Status de Entregas
4. Resumo Executivo (colapsável)

## Nova Estrutura
1. Cards de progresso (3 colunas)
2. **NOVA: Grid de Materiais com Thumbnails e Player** ← Adicionar aqui
3. Status de Entregas
4. Resumo Executivo (colapsável)

---

## Solução Técnica

### Arquivo: `src/components/client-portal/PortalOverviewPremium.tsx`

**Mudanças:**
1. Substituir a seção "Materiais Disponíveis" por uma galeria visual rica
2. Adicionar grid responsivo (2-3 colunas) com cards de materiais
3. Cada card terá:
   - **Thumbnail** (16:9 aspect ratio)
     - YouTube: usar `img.youtube.com/vi/{ID}/hqdefault.jpg`
     - Vídeos storage: usar tag `<video>` como preview
     - Outros: ícone placeholder
   - **Botão Play** centralizado para vídeos
   - **Título** do material
   - **Badge** de tipo (YouTube, Vídeo, Link)
4. Ao clicar: abrir modal com player embarcado (YouTube embed ou video nativo)
5. Adicionar estado `useState` para controle do modal de preview

**Layout da Grid:**
```text
┌──────────────────────────────────────────────┐
│ 🎬 MATERIAIS DO PROJETO                       │
├─────────────────┬─────────────────┬──────────┤
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌──────┐ │
│ │  THUMBNAIL  │ │ │  THUMBNAIL  │ │ │ ...  │ │
│ │   ▶ Play    │ │ │   ▶ Play    │ │ │      │ │
│ └─────────────┘ │ └─────────────┘ │ └──────┘ │
│ Video Teaser    │ Institucional   │ ...      │
│ 🟥 YouTube      │ 📁 Arquivo      │          │
└─────────────────┴─────────────────┴──────────┘
```

**Código do Card de Material:**
```tsx
// Dentro do map de availableMaterials
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {availableMaterials.map((material) => {
    const youtubeId = getYouTubeVideoId(material.youtube_url);
    
    return (
      <button 
        key={material.id}
        onClick={() => setPreviewMaterial(material)}
        className="bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden group"
      >
        {/* Thumbnail */}
        <div className="aspect-video relative bg-[#111]">
          {youtubeId ? (
            <img 
              src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
              alt={material.title}
              className="w-full h-full object-cover"
            />
          ) : material.file_url ? (
            <video src={material.file_url} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Film className="w-8 h-8 text-gray-600" />
            </div>
          )}
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-cyan-500 flex items-center justify-center">
              <Play className="w-6 h-6 text-black ml-0.5" />
            </div>
          </div>
        </div>
        
        {/* Info */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-white truncate">{material.title}</h4>
          <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
            {material.youtube_url ? <Youtube className="w-3 h-3 text-red-500" /> : <Film className="w-3 h-3 text-cyan-400" />}
            {material.youtube_url ? 'YouTube' : 'Vídeo'}
          </span>
        </div>
      </button>
    );
  })}
</div>
```

**Modal de Preview:**
```tsx
<Dialog open={!!previewMaterial} onOpenChange={() => setPreviewMaterial(null)}>
  <DialogContent className="max-w-4xl p-0 bg-black border-[#1a1a1a]">
    <div className="aspect-video">
      {youtubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      ) : previewMaterial?.file_url && (
        <video src={previewMaterial.file_url} controls autoPlay className="w-full h-full" />
      )}
    </div>
    <div className="p-4">
      <h4 className="font-medium text-white">{previewMaterial?.title}</h4>
    </div>
  </DialogContent>
</Dialog>
```

---

## Imports Necessários
```tsx
import { Play, Film, Youtube } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
```

---

## Resumo das Mudanças

| Arquivo | Alteração |
|---------|-----------|
| `PortalOverviewPremium.tsx` | Substituir lista de materiais por grid visual com thumbnails e modal de player |

---

## Resultado Esperado
- Grid de materiais com thumbnails logo abaixo dos cards de progresso
- Vídeos do YouTube mostram thumbnail automático
- Botão de play visível ao passar o mouse
- Clique abre modal com player funcional
- Layout responsivo (1 coluna mobile, 2-3 desktop)
