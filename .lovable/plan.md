
# Plano: Adicionar Logo Editável e Banner no Header do Projeto

## Objetivo
Adicionar ao card de header do projeto:
1. **Logo do cliente** em quadrado sempre visível (com opção de upload/alterar ao clicar)
2. **Banner** acima das informações do projeto (16:9 aspect ratio)

---

## Contexto Atual

### Campos no Banco de Dados (já existem)
- `logo_url` - URL do logo do projeto
- `banner_url` - URL do banner do projeto  
- `cover_image_url` - URL da imagem de capa

### Componentes Existentes
- `ProjectLogoUpload` - Componente de upload de logo (já funcional)
- `ProjectArtSection` - Componente para gerar arte com IA (banner/cover)
- `EditProjectModal` - Já permite editar o logo

---

## Solução Técnica

### Arquivo: `src/components/projects/detail/ProjectHeader.tsx`

**Mudanças:**

1. **Adicionar estado para controle de upload inline**
```tsx
const [isUploadingLogo, setIsUploadingLogo] = useState(false);
const [isUploadingBanner, setIsUploadingBanner] = useState(false);
```

2. **Extrair URLs do projeto**
```tsx
const logoUrl = (project as any).logo_url;
const bannerUrl = (project as any).banner_url;
```

3. **Adicionar Banner acima do conteúdo principal**
```text
┌────────────────────────────────────────────────────────┐
│            BANNER (16:9) - clicável para upload        │
│    ┌──────────────────────────────────────────────┐    │
│    │                                              │    │
│    │     [Banner Image ou Placeholder Upload]    │    │
│    │                                              │    │
│    └──────────────────────────────────────────────┘    │
├────────────────────────────────────────────────────────┤
│ [LOGO]  PORTO 153 - Narrativa...        [Botões]       │
│  quad   RAFAEL DE FREITAS                              │
├────────────────────────────────────────────────────────┤
│  R$ 15.590  │  100%  │  -  │  matheus.fellip           │
└────────────────────────────────────────────────────────┘
```

4. **Logo sempre visível em quadrado clicável**
```tsx
// Quadrado do logo (sempre visível, com ou sem imagem)
<div className="relative group">
  <input type="file" ref={logoInputRef} hidden onChange={handleLogoUpload} />
  
  <button 
    onClick={() => logoInputRef.current?.click()}
    className="w-14 h-14 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-all overflow-hidden"
  >
    {logoUrl ? (
      <>
        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
          <Pencil className="w-4 h-4 text-white" />
        </div>
      </>
    ) : (
      <ImagePlus className="w-5 h-5 text-muted-foreground" />
    )}
  </button>
</div>
```

5. **Banner clicável para upload**
```tsx
// Banner section (acima do título)
<div className="mb-4">
  <input type="file" ref={bannerInputRef} hidden onChange={handleBannerUpload} />
  
  <button 
    onClick={() => bannerInputRef.current?.click()}
    className="w-full aspect-[4/1] rounded-xl border-2 border-dashed border-border hover:border-primary/50 overflow-hidden transition-all group"
  >
    {bannerUrl ? (
      <div className="relative w-full h-full">
        <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
          <Pencil className="w-5 h-5 text-white" />
          <span className="text-white text-sm">Alterar Banner</span>
        </div>
      </div>
    ) : (
      <div className="w-full h-full flex items-center justify-center gap-2 text-muted-foreground">
        <ImagePlus className="w-5 h-5" />
        <span className="text-sm">Adicionar Banner</span>
      </div>
    )}
  </button>
</div>
```

6. **Funções de upload**
```tsx
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  setIsUploadingLogo(true);
  try {
    const fileExt = file.name.split(".").pop();
    const filePath = `logos/${project.id}/${Date.now()}.${fileExt}`;
    
    await supabase.storage.from("project-files").upload(filePath, file, { upsert: true });
    const { data } = supabase.storage.from("project-files").getPublicUrl(filePath);
    
    await supabase.from("projects").update({ logo_url: data.publicUrl }).eq("id", project.id);
    toast.success("Logo atualizado!");
  } catch (error) {
    toast.error("Erro ao enviar logo");
  } finally {
    setIsUploadingLogo(false);
  }
};

const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // Mesma lógica, salvando em banner_url
};
```

---

## Imports Necessários
```tsx
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, Pencil, Loader2 } from "lucide-react";
```

---

## Layout Final

```text
┌──────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    BANNER (aspect 4:1)                    │   │
│  │              [Imagem ou "Adicionar Banner"]               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌────┐                                                          │
│  │LOGO│  active  filme_institucional  Pré-produção               │
│  │ 56 │                                                          │
│  └────┘  PORTO 153 - Narrativa Audiovisual Completa              │
│          RAFAEL DE FREITAS BERNARDES                             │
│                                                                   │
│  ────────────────────────────────────────────────────────────    │
│  │ R$ 15.590 │ 100% │ - │ matheus.fellip │                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Resumo das Mudanças

| Arquivo | Alteração |
|---------|-----------|
| `ProjectHeader.tsx` | Adicionar banner clicável no topo + logo sempre visível com upload inline |

---

## Resultado Esperado
- Banner aparece acima das informações do projeto (pode ser adicionado/alterado clicando)
- Logo em quadrado sempre visível ao lado do título (pode ser adicionado/alterado clicando)
- Overlay de edição ao passar o mouse sobre imagens existentes
- Upload direto para Supabase Storage
- Indicador de loading durante upload
