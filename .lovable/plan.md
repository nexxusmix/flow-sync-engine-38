
# Plano: Banner Fino + Geração Automática com IA (Estilos Selecionáveis)

## Objetivos
1. **Reduzir altura do banner em 50%** (de `aspect-[4/1]` para `aspect-[8/1]`)
2. **Gerar banner automaticamente com IA** quando o projeto é criado
3. **Adicionar geração de banner no modal "Editar Projeto"** com botão de gerar
4. **Adicionar botão de editar no banner** para abrir modal de edição
5. **Permitir seleção de estilos diferentes** (textura, sólido, 3D, gradiente, etc.)
6. **Sempre usar o logo SQUAD Film** como referência visual

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `ProjectHeader.tsx` | Reduzir aspect ratio do banner + adicionar botão editar |
| `EditProjectModal.tsx` | Adicionar seção de banner com geração IA e seletor de estilos |
| `NewProjectModal.tsx` | Adicionar seleção de estilo e auto-gerar banner após criação |
| `generate-project-art/index.ts` | Atualizar prompts com estilos diferentes |
| `useProjects.tsx` | Trigger de geração automática após criar projeto |

---

## Detalhes Técnicos

### 1. Reduzir Altura do Banner (ProjectHeader.tsx)

**Mudança de aspect ratio:**
```tsx
// ANTES
className="w-full aspect-[4/1] ..."

// DEPOIS
className="w-full aspect-[8/1] ..."
```

**Adicionar botão de editar (ícone Pencil) no banner:**
```tsx
<button onClick={handleEdit} className="absolute top-2 right-2 ...">
  <Pencil className="w-4 h-4" />
</button>
```

---

### 2. Estilos de Banner Disponíveis

```typescript
const BANNER_STYLES = [
  { id: 'texture_pattern', label: 'Textura Pattern', prompt: 'Abstract geometric texture pattern with subtle film grain' },
  { id: 'solid_gradient', label: 'Gradiente', prompt: 'Smooth gradient background with cinematic color tones' },
  { id: '3d_abstract', label: '3D Abstrato', prompt: '3D abstract shapes with metallic and glass materials, depth of field' },
  { id: 'minimal_lines', label: 'Linhas Minimalistas', prompt: 'Minimal line art with elegant geometric patterns' },
  { id: 'noise_grain', label: 'Ruído Film', prompt: 'Film grain noise texture with subtle color variations' },
  { id: 'dark_cinematic', label: 'Cinematográfico', prompt: 'Dark cinematic atmosphere with volumetric lighting' },
];
```

---

### 3. EditProjectModal.tsx - Seção de Banner

**Nova seção após o logo:**
```tsx
{/* Banner com Geração IA */}
<div className="space-y-2">
  <Label>Banner do Projeto</Label>
  
  {/* Preview do Banner */}
  <div className="aspect-[8/1] bg-muted/30 rounded-xl overflow-hidden border border-dashed border-border">
    {formData.banner_url ? (
      <img src={formData.banner_url} className="w-full h-full object-cover" />
    ) : (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <ImagePlus className="w-5 h-5 mr-2" />
        Sem banner
      </div>
    )}
  </div>
  
  {/* Seletor de Estilo */}
  <Select value={bannerStyle} onValueChange={setBannerStyle}>
    <SelectTrigger>
      <SelectValue placeholder="Selecione um estilo" />
    </SelectTrigger>
    <SelectContent>
      {BANNER_STYLES.map(style => (
        <SelectItem key={style.id} value={style.id}>
          {style.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  
  {/* Botão Gerar com IA */}
  <Button 
    type="button" 
    variant="outline" 
    onClick={handleGenerateBanner}
    disabled={isGenerating}
  >
    {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
    Gerar com IA
  </Button>
</div>
```

---

### 4. NewProjectModal.tsx - Auto-Geração

**Adicionar seletor de estilo no formulário:**
```tsx
const [bannerStyle, setBannerStyle] = useState('texture_pattern');

// No formulário, antes dos botões de ação:
<div className="space-y-2">
  <Label>Estilo do Banner (gerado automaticamente)</Label>
  <Select value={bannerStyle} onValueChange={setBannerStyle}>
    ...
  </Select>
</div>
```

**Trigger automático após criação:**
```tsx
// Após createProject() bem-sucedido
onSuccess: async (project) => {
  // Gerar banner automaticamente
  await supabase.functions.invoke('generate-project-art', {
    body: {
      project_id: project.id,
      art_type: 'banner',
      style: bannerStyle,
    },
  });
}
```

---

### 5. Edge Function generate-project-art/index.ts

**Atualizar interface e prompts:**
```typescript
interface GenerateArtInput {
  project_id: string;
  art_type: "banner" | "favicon" | "cover";
  style?: string; // Novo parâmetro
  custom_prompt?: string;
}

// Prompts por estilo
const STYLE_PROMPTS: Record<string, string> = {
  texture_pattern: 'Abstract geometric texture pattern with subtle film grain, repeating shapes',
  solid_gradient: 'Smooth cinematic gradient background transitioning from deep black to dark cyan',
  '3d_abstract': '3D abstract floating shapes with metallic and glass materials, depth of field, volumetric lighting',
  minimal_lines: 'Minimal elegant line art with geometric patterns on dark background',
  noise_grain: 'Film grain noise texture with analog photography aesthetic, subtle color cast',
  dark_cinematic: 'Dark cinematic atmosphere with fog, volumetric light rays, moody ambiance',
};

// No prompt base:
const stylePrompt = STYLE_PROMPTS[style || 'texture_pattern'];

const basePrompt = `
Generate a professional banner image.
Aspect ratio: 8:1 (very wide horizontal stripe)
Style: ${stylePrompt}
Brand Reference: SQUAD Film logo (cyan #00A3D3 on black #000000)
Requirements:
- Pure black background (#000000)
- Cyan accent (#00A3D3) as highlight color
- NO TEXT, NO LETTERS, NO WORDS
- Minimalist and elegant
- Ultra high resolution
- Seamless edge blending for header use
`.trim();
```

---

### 6. Logo SQUAD Film como Referência

O logo já está disponível em `src/assets/squad-film-logo-full.png`. 

**Estratégia:**
- Fazer upload do logo para o storage se ainda não existir
- Passar URL pública do logo como referência visual para a IA
- Incorporar cores do logo (cyan #00A3D3 + preto) nos prompts

---

## Fluxo de Uso

```text
┌─────────────────────────────────────────────────────────────┐
│  CRIAR PROJETO                                               │
│  ├── Preencher dados                                         │
│  ├── Selecionar estilo do banner (opcional)                 │
│  └── Ao salvar → Gera banner automaticamente com IA         │
├─────────────────────────────────────────────────────────────┤
│  EDITAR PROJETO                                              │
│  ├── Ver preview do banner atual                            │
│  ├── Selecionar novo estilo                                 │
│  └── Clicar "Gerar com IA" → Regenera banner                │
├─────────────────────────────────────────────────────────────┤
│  HEADER DO PROJETO                                           │
│  ├── Banner fino (aspect 8:1)                               │
│  ├── Botão de editar (abre EditProjectModal)                │
│  └── Hover para trocar imagem manualmente                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Resultado Esperado
- Banner com altura reduzida em 50% (mais fino, tipo stripe)
- Geração automática com IA usando logo SQUAD Film como referência
- 6 estilos visuais diferentes para escolha
- Botão de editar visível no banner
- Modal de edição permite regenerar com novo estilo
- Nano Banana Pro (gemini-3-pro-image-preview) para geração de alta qualidade
