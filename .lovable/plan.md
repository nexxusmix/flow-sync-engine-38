
## Multi-select com exclusão em lote — Galeria IA e Identidade Visual

### Problema
Ambas as abas (Galeria IA e Identidade Visual) não têm seleção de itens. O usuário precisa excluir um por um, pelo menu de cada card. A solução é adicionar seleção múltipla, "Selecionar tudo" e exclusão em lote.

---

### Comportamento esperado

- **Modo normal**: cards funcionam como hoje (clique abre preview)
- **Entrar no modo seleção**: clique longo (ou botão "Selecionar" no header) ativa o modo seleção
- **Modo seleção ativo**:
  - Cada card mostra um checkbox no canto superior esquerdo
  - Clique no card alterna a seleção (não abre o preview)
  - Uma barra de ação aparece no topo com:
    - "X selecionados"
    - Botão "Selecionar tudo"
    - Botão "Desmarcar tudo"
    - Botão "Excluir selecionados" (vermelho, com confirmação)
    - Botão "Cancelar" (sai do modo seleção)
- **Exclusão em lote**: chama `deleteAsset.mutateAsync(id)` em paralelo via `Promise.all` para todos os ids selecionados

---

### Arquivos a modificar

#### 1. `src/components/projects/detail/tabs/GalleryTab.tsx`

**States a adicionar no `GalleryTab`** (linhas 413-417):
```typescript
const [selectionMode, setSelectionMode] = useState(false);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [isDeleting, setIsDeleting] = useState(false);
```

**Handler de exclusão em lote**:
```typescript
const handleBulkDelete = async () => {
  if (!confirm(`Excluir ${selectedIds.size} itens?`)) return;
  setIsDeleting(true);
  await Promise.all([...selectedIds].map(id => deleteAsset.mutateAsync(id)));
  setSelectedIds(new Set());
  setSelectionMode(false);
  setIsDeleting(false);
};
```

**Barra de seleção** — aparece acima dos filtros quando `selectionMode` é true:
```tsx
{selectionMode && (
  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
    <span className="text-sm font-medium">{selectedIds.size} selecionado(s)</span>
    <Button size="sm" variant="outline" onClick={selectAll}>Selecionar tudo</Button>
    <Button size="sm" variant="outline" onClick={clearSelection}>Limpar</Button>
    <Button size="sm" variant="destructive" disabled={selectedIds.size === 0 || isDeleting} onClick={handleBulkDelete}>
      {isDeleting ? <Loader2 className="animate-spin w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
      Excluir
    </Button>
    <Button size="sm" variant="ghost" onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}>
      Cancelar
    </Button>
  </div>
)}
```

**Botão "Selecionar" no header** — adicionado ao lado dos filtros existentes

**Modificação no `AssetCard`** — novo prop `selectionMode` e `isSelected`:
- Quando `selectionMode=true`: checkbox visível, clique alterna seleção em vez de abrir preview
- Checkbox sobreposto no canto superior esquerdo do card
- Border do card em `ring-primary` quando selecionado

---

#### 2. `src/components/projects/detail/tabs/BrandIdentityTab.tsx`

O componente principal `BrandIdentityTab` terá os mesmos states de seleção. A diferença é que ele tem dois grupos de cards (`logoAssets` e `signatureAssets`), então:

- A barra de seleção aparece uma vez no topo da seção de conteúdo
- "Selecionar tudo" seleciona todos os assets visíveis (logos + assinaturas)
- O `LogoCard` recebe `selectionMode`, `isSelected` e `onToggle` como props
- O `LogoCard` exibe checkbox sobreposto quando em modo seleção

**States no `BrandIdentityTab`**:
```typescript
const [selectionMode, setSelectionMode] = useState(false);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [isDeleting, setIsDeleting] = useState(false);
```

O hook `useProjectAssets` já expõe `deleteAsset`, só falta importá-lo no `BrandIdentityTab`:
```typescript
const { assets, isLoading, deleteAsset } = useProjectAssets(project.id);
```

---

### UX dos cards com seleção

```text
┌─────────────────┐        ┌─────────────────┐
│ ☑  [thumbnail]  │        │ ☐  [thumbnail]  │
│                 │  vs.   │                 │
│ Título do asset │        │ Título do asset │
│ PDF • 2.3 MB    │        │ PDF • 2.3 MB    │
└─────────────────┘        └─────────────────┘
  Selecionado                Não selecionado
  (ring azul + fundo        (ring ausente)
   primary/10)
```

O checkbox é um overlay `absolute top-2 left-2` com z-index alto, e o card inteiro tem `onClick` redirecionado para toggle quando `selectionMode=true`.

---

### Resumo das mudanças

| Arquivo | O que muda |
|---|---|
| `GalleryTab.tsx` | States de seleção, barra de ação, botão "Selecionar", props novos no `AssetCard` |
| `GalleryTab.tsx` (`AssetCard`) | Suporte a `selectionMode`, `isSelected`, `onToggle`; checkbox overlay |
| `BrandIdentityTab.tsx` | States de seleção, `deleteAsset` do hook, barra de ação, props novos no `LogoCard` |
| `BrandIdentityTab.tsx` (`LogoCard`) | Suporte a `selectionMode`, `isSelected`, `onToggle`; checkbox overlay |

Sem dependências novas, sem migrações de banco de dados, sem edge functions.
